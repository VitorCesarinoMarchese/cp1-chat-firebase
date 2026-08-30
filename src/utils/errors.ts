const firebaseErrorMessages: Readonly<Record<string, string>> = {
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/missing-password': 'Informe a senha.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
  'auth/wrong-password': 'A senha está incorreta.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-login-credentials': 'E-mail ou senha inválidos.',
  'auth/account-exists-with-different-credential':
    'Este e-mail já está ligado a outro provedor de login.',
  'auth/popup-closed-by-user': 'A janela de login foi fechada.',
  'auth/cancelled-popup-request': 'O login foi cancelado.',
  'auth/cancelled': 'O login foi cancelado.',
  'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente novamente.',
  'database/permission-denied': 'O Firebase recusou o acesso a estes dados.',
  'permission_denied': 'O Firebase recusou o acesso a estes dados.',
  'PERMISSION_DENIED': 'O Firebase recusou o acesso a estes dados.',
  'database/network-error': 'Não foi possível acessar o banco de dados.',
  'app/configuration-error': 'Configure as variáveis do Firebase no arquivo .env.',
};

export class SocialAuthCancelledError extends Error {
  readonly code = 'auth/cancelled';

  constructor() {
    super('O login foi cancelado.');
    this.name = 'SocialAuthCancelledError';
  }
}

export function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = error.code;
  return typeof code === 'string' ? code : null;
}

export function toUserFacingError(error: unknown): string {
  if (error instanceof Error && error.name === 'FirebaseConfigurationError') {
    return error.message;
  }

  const code = getErrorCode(error);
  if (code !== null && firebaseErrorMessages[code] !== undefined) {
    return firebaseErrorMessages[code];
  }

  if (error instanceof Error && error.message.trim() === 'AUTH_NOT_READY') {
    return 'Aguarde o carregamento do login e tente novamente.';
  }

  if (
    error instanceof Error &&
    (error.message.startsWith('Configure ') || error.message.includes('redirect HTTPS'))
  ) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() === 'AUTH_CANCELLED') {
    return 'O login foi cancelado.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
