export type AuthProvider = 'password' | 'google' | 'apple';

export type ChatUser = {
  uid: string;
  name: string;
  email: string | null;
  provider: AuthProvider;
  photoUrl: string | null;
};

export function authProviderLabel(provider: AuthProvider): string {
  switch (provider) {
    case 'password':
      return 'E-mail e senha';
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}
