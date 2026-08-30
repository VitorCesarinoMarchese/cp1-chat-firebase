import {
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update,
  type DataSnapshot,
  type Database,
} from 'firebase/database';
import type { ChatMessage, Conversation, ParticipantPair } from '../types/chat';
import { createConversationId, createParticipantPair } from '../utils/chatRules';
import { isRecord, readNumber, readString } from '../utils/parsers';

function parseConversationSnapshot(
  snapshot: DataSnapshot,
  conversationId: string,
): Conversation | null {
  const value: unknown = snapshot.val();
  if (!isRecord(value)) {
    return null;
  }

  const firstParticipantId = readString(value.participantOne);
  const secondParticipantId = readString(value.participantTwo);
  if (firstParticipantId === null || secondParticipantId === null) {
    return null;
  }

  const participants = createParticipantPair(firstParticipantId, secondParticipantId);
  return {
    id: conversationId,
    participants,
    createdAt: readNumber(value.createdAt) ?? 0,
    updatedAt: readNumber(value.updatedAt) ?? 0,
  };
}

export async function getOrCreateConversation({
  database,
  firstParticipantId,
  secondParticipantId,
}: {
  database: Database;
  firstParticipantId: string;
  secondParticipantId: string;
}): Promise<Conversation> {
  const participants = createParticipantPair(firstParticipantId, secondParticipantId);
  const conversationId = createConversationId({ firstParticipantId, secondParticipantId });
  const conversationReference = ref(database, `conversations/${conversationId}`);
  let existingSnapshot: DataSnapshot | null = null;

  try {
    existingSnapshot = await get(conversationReference);
  } catch {
    // A missing conversation is intentionally not readable by the rules. The create below
    // is authorized only when the authenticated user is one of the two participants.
  }

  if (existingSnapshot !== null && existingSnapshot.exists()) {
    const existingConversation = parseConversationSnapshot(existingSnapshot, conversationId);
    if (existingConversation === null) {
      throw new Error('A conversa armazenada não possui dois participantes válidos.');
    }

    // Versions of the app before the letter redesign stored a redundant participant map.
    // Remove it before later conversation updates are validated by the current rules.
    const existingValue: unknown = existingSnapshot.val();
    if (isRecord(existingValue) && isRecord(existingValue.participants)) {
      await update(conversationReference, {
        participants: null,
        updatedAt: serverTimestamp(),
      });
    }

    return existingConversation;
  }

  const now = Date.now();
  await set(conversationReference, {
    participantOne: participants[0],
    participantTwo: participants[1],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: conversationId,
    participants,
    createdAt: now,
    updatedAt: now,
  };
}

function parseMessagesSnapshot(snapshot: DataSnapshot, conversationId: string): ChatMessage[] {
  const messages: ChatMessage[] = [];

  snapshot.forEach((child) => {
    const id = child.key;
    if (id === null) {
      return false;
    }

    const value: unknown = child.val();
    if (!isRecord(value)) {
      return false;
    }

    const storedId = readString(value.id);
    const storedConversationId = readString(value.conversationId);
    const senderId = readString(value.senderId);
    const receiverId = readString(value.receiverId);
    const text = readString(value.text);
    if (
      storedId !== id ||
      storedConversationId !== conversationId ||
      senderId === null ||
      receiverId === null ||
      text === null ||
      text.trim().length === 0
    ) {
      return false;
    }

    messages.push({
      id,
      conversationId,
      senderId,
      receiverId,
      text,
      createdAt: readNumber(value.createdAt) ?? 0,
    });

    return false;
  });

  return messages;
}

export function subscribeToMessages({
  database,
  conversationId,
  onMessages,
  onError,
}: {
  database: Database;
  conversationId: string;
  onMessages: (messages: ChatMessage[]) => void;
  onError: (error: Error) => void;
}): () => void {
  const messagesQuery = query(
    ref(database, `messages/${conversationId}`),
    orderByChild('createdAt'),
  );

  return onValue(
    messagesQuery,
    (snapshot) => {
      try {
        onMessages(parseMessagesSnapshot(snapshot, conversationId));
      } catch (error: unknown) {
        onError(error instanceof Error ? error : new Error('Falha ao ler mensagens.'));
      }
    },
    onError,
  );
}

export async function sendMessage({
  database,
  conversationId,
  senderId,
  receiverId,
  text,
}: {
  database: Database;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
}): Promise<ChatMessage> {
  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    throw new Error('A mensagem não pode estar vazia.');
  }

  const messageReference = push(ref(database, `messages/${conversationId}`));
  const messageId = messageReference.key;
  if (messageId === null) {
    throw new Error('Não foi possível criar a mensagem.');
  }

  const createdAt = Date.now();
  const message = {
    id: messageId,
    conversationId,
    senderId,
    receiverId,
    text: normalizedText,
    createdAt: serverTimestamp(),
  };

  // Keep the message and conversation timestamp in one atomic write. If either
  // path is rejected by the database rules, neither path is changed.
  await update(ref(database), {
    [`messages/${conversationId}/${messageId}`]: message,
    [`conversations/${conversationId}/updatedAt`]: serverTimestamp(),
  });

  return {
    id: messageId,
    conversationId,
    senderId,
    receiverId,
    text: normalizedText,
    createdAt,
  };
}
