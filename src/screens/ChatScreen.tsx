import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChatInput } from '../components/ChatInput';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingView } from '../components/LoadingView';
import { getFirebaseServices } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
} from '../services/chatService';
import type { ChatMessage, Conversation } from '../types/chat';
import type { ChatUser } from '../types/user';
import { toUserFacingError } from '../utils/errors';
import { colors, paperLineHeight, spacing } from '../theme';

type ChatScreenProps = {
  contact: ChatUser;
  onBack: () => void;
};

export function ChatScreen({ contact, onBack }: ChatScreenProps): React.ReactElement {
  const auth = useAuth();
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let stopListening: (() => void) | null = null;

    setConversation(null);
    setMessages([]);
    setLoadingConversation(true);
    setChatError(null);

    const signedInUser = auth.currentUser;
    if (signedInUser === null) {
      setChatError('Sua sessão terminou. Entre novamente para abrir o chat.');
      setLoadingConversation(false);
      return () => {
        active = false;
      };
    }

    const openConversation = async (): Promise<void> => {
      try {
        const { database } = getFirebaseServices();
        const createdConversation = await getOrCreateConversation({
          database,
          firstParticipantId: signedInUser.uid,
          secondParticipantId: contact.uid,
        });

        if (!active) {
          return;
        }

        setConversation(createdConversation);
        stopListening = subscribeToMessages({
          database,
          conversationId: createdConversation.id,
          onMessages: (nextMessages) => {
            if (active) {
              setMessages(nextMessages);
              setLoadingConversation(false);
            }
          },
          onError: (error) => {
            if (active) {
              setChatError(toUserFacingError(error));
              setLoadingConversation(false);
            }
          },
        });
        setLoadingConversation(false);
      } catch (error: unknown) {
        if (active) {
          setChatError(toUserFacingError(error));
          setLoadingConversation(false);
        }
      }
    };

    void openConversation();

    return () => {
      active = false;
      stopListening?.();
    };
  }, [auth.currentUser?.uid, contact.uid]);

  const orderedMessages = useMemo(
    () => [...messages].sort((first, second) => first.createdAt - second.createdAt),
    [messages],
  );

  const letterDate = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const handleSend = useCallback(async (): Promise<void> => {
    if (auth.currentUser === null || conversation === null || messageText.trim().length === 0) {
      return;
    }

    setSending(true);
    setChatError(null);
    try {
      const { database } = getFirebaseServices();
      await sendMessage({
        database,
        conversationId: conversation.id,
        senderId: auth.currentUser.uid,
        receiverId: contact.uid,
        text: messageText,
      });
      setMessageText('');
    } catch (error: unknown) {
      setChatError(toUserFacingError(error));
    } finally {
      setSending(false);
    }
  }, [auth.currentUser, contact.uid, conversation, messageText]);

  const handleTextChange = useCallback((value: string): void => {
    setMessageText(value);
  }, []);

  const handleLogout = useCallback(async (): Promise<void> => {
    await auth.logout();
  }, [auth]);

  const scrollToEnd = useCallback((): void => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }): React.ReactElement => (
      <ChatMessageBubble
        message={item}
        isMine={auth.currentUser !== null && item.senderId === auth.currentUser.uid}
      />
    ),
    [auth.currentUser],
  );

  const letterOpening = useMemo(
    () => (
      <View style={styles.letterOpening}>
        <Text style={styles.greeting}>Querido(a) {contact.name},</Text>
      </View>
    ),
    [contact.name],
  );

  const emptyMessages = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>A página ainda está em branco</Text>
        <Text style={styles.emptyDescription}>Escreva a primeira linha desta carta.</Text>
      </View>
    ),
    [],
  );

  const visibleError = chatError ?? auth.error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar para contatos"
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.contactInfo}>
          <Text style={styles.headerKicker}>ESCREVENDO PARA</Text>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name}
          </Text>
        </View>
        <Pressable
          onPress={handleLogout}
          disabled={auth.busy}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Text style={styles.logoutText}>{auth.busy ? '...' : 'Sair'}</Text>
        </Pressable>
      </View>

      <View style={styles.paperSheet}>
        <View style={styles.letterHeader}>
          <View style={styles.stamp}>
            <Text style={styles.stampText}>✉</Text>
          </View>
          <View style={styles.letterHeading}>
            <Text style={styles.letterKicker}>CORRESPONDÊNCIA DIGITAL</Text>
            <Text style={styles.letterTitle}>Para {contact.name}</Text>
          </View>
          <Text style={styles.letterDate}>{letterDate}</Text>
        </View>
        <View style={styles.letterRule} />

        {visibleError ? (
          <View style={styles.errorWrapper}>
            <ErrorBanner
              message={visibleError}
              onDismiss={chatError ? () => setChatError(null) : auth.clearError}
            />
          </View>
        ) : null}

        {loadingConversation ? (
          <LoadingView message="Abrindo sua carta..." />
        ) : (
          <View style={styles.chatBody}>
            <View pointerEvents="none" style={styles.ruledPaper}>
              {Array.from({ length: 48 }, (_, index) => (
                <View key={`paper-line-${index}`} style={styles.ruledLine} />
              ))}
            </View>
            <FlatList
              ref={listRef}
              data={orderedMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              ListHeaderComponent={letterOpening}
              ListEmptyComponent={emptyMessages}
              contentContainerStyle={
                orderedMessages.length === 0 ? styles.emptyList : styles.messagesList
              }
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToEnd()}
            />
            <ChatInput
              value={messageText}
              onChangeText={handleTextChange}
              onSend={handleSend}
              disabled={sending || conversation === null}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backPressed: {
    backgroundColor: colors.primarySoft,
  },
  backText: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 27,
  },
  chatBody: {
    flex: 1,
    position: 'relative',
  },
  contactInfo: {
    borderLeftColor: colors.paperEdge,
    borderLeftWidth: 1,
    flex: 1,
    marginHorizontal: spacing.sm,
    paddingLeft: spacing.sm,
  },
  contactName: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  greeting: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: paperLineHeight,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: spacing.sm,
  },
  headerKicker: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  letterDate: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 11,
    maxWidth: 94,
    textAlign: 'right',
  },
  letterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  letterHeading: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  letterKicker: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  letterOpening: {
    height: paperLineHeight,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  letterRule: {
    backgroundColor: colors.primary,
    height: 2,
    marginHorizontal: spacing.md,
    opacity: 0.45,
  },
  letterTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
  },
  logoutButton: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  logoutPressed: {
    opacity: 0.55,
  },
  logoutText: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 13,
    fontWeight: '700',
  },
  messagesList: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  paperSheet: {
    backgroundColor: colors.paper,
    borderColor: colors.paperEdge,
    borderRadius: 4,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
    shadowColor: colors.paperShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
  },
  ruledLine: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    height: paperLineHeight,
  },
  ruledPaper: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stamp: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  stampText: {
    color: colors.white,
    fontSize: 22,
  },
});
