import type { AuthProvider } from '../types/user';
import type { ParticipantPair } from '../types/chat';

export function isCompatibleProvider(
  currentProvider: AuthProvider,
  candidateProvider: AuthProvider,
): boolean {
  if (currentProvider === 'password') {
    return candidateProvider === 'google' || candidateProvider === 'apple';
  }

  return candidateProvider === 'password';
}

export function compatibleProviders(currentProvider: AuthProvider): AuthProvider[] {
  if (currentProvider === 'password') {
    return ['google', 'apple'];
  }

  return ['password'];
}

export function createParticipantPair(
  firstParticipantId: string,
  secondParticipantId: string,
): ParticipantPair {
  if (firstParticipantId === secondParticipantId) {
    throw new Error('Uma conversa precisa ter dois usuários diferentes.');
  }

  return firstParticipantId < secondParticipantId
    ? [firstParticipantId, secondParticipantId]
    : [secondParticipantId, firstParticipantId];
}

export function createConversationId({
  firstParticipantId,
  secondParticipantId,
}: {
  firstParticipantId: string;
  secondParticipantId: string;
}): string {
  return createParticipantPair(firstParticipantId, secondParticipantId).join('__');
}
