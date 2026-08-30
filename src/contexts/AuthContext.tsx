import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  createChatUser,
  createEmailAccount,
  getAuthProviderForUser,
  setUserDisplayName,
  signInWithAppleCredential,
  signInWithEmail,
  signInWithGoogleIdToken,
  signInWithGooglePopup,
  signOutUser,
  subscribeToAuthState,
} from '../services/authService';
import type {
  AppleCredentialInput,
  EmailCredentials,
  RegistrationCredentials,
} from '../services/authService';
import { getFirebaseServices } from '../config/firebase';
import { upsertUserProfile } from '../services/userService';
import type { AuthProvider, ChatUser } from '../types/user';
import { toUserFacingError } from '../utils/errors';

type AuthContextValue = {
  currentUser: ChatUser | null;
  firebaseUser: User | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  setErrorMessage: (message: string) => void;
  signInWithEmail: (credentials: EmailCredentials) => Promise<void>;
  registerWithEmail: (credentials: RegistrationCredentials) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
  signInWithApple: (
    credentialInput: AppleCredentialInput & { preferredName: string | null },
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncAuthenticatedUser = useCallback(
    async ({
      user,
      provider,
      preferredName,
    }: {
      user: User;
      provider: AuthProvider;
      preferredName?: string | null;
    }): Promise<void> => {
      if (preferredName !== undefined && preferredName !== null && preferredName.trim().length > 0) {
        await setUserDisplayName({ user, name: preferredName });
      }

      const chatUser = createChatUser(user, provider, preferredName);
      setFirebaseUser(user);
      setCurrentUser(chatUser);

      const { database } = getFirebaseServices();
      await upsertUserProfile({ database, user: chatUser });
    },
    [],
  );

  const handleAuthState = useCallback(
    (user: User | null): void => {
      if (user === null) {
        setFirebaseUser(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const provider = getAuthProviderForUser(user);
      if (provider === null) {
        setFirebaseUser(null);
        setCurrentUser(null);
        setError('O provedor desta conta não é compatível com o aplicativo.');
        setLoading(false);
        return;
      }

      setLoading(true);
      void syncAuthenticatedUser({ user, provider })
        .catch((authError: unknown) => {
          setError(toUserFacingError(authError));
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [syncAuthenticatedUser],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      const { auth } = getFirebaseServices();
      unsubscribe = subscribeToAuthState({
        auth,
        onUser: handleAuthState,
        onError: (authError) => {
          setError(toUserFacingError(authError));
          setLoading(false);
        },
      });
    } catch (authError: unknown) {
      setError(toUserFacingError(authError));
      setLoading(false);
    }

    return () => {
      unsubscribe?.();
    };
  }, [handleAuthState]);

  const execute = useCallback(async (operation: () => Promise<void>): Promise<void> => {
    setError(null);
    setBusy(true);

    try {
      await operation();
    } catch (authError: unknown) {
      setError(toUserFacingError(authError));
    } finally {
      setBusy(false);
    }
  }, []);

  const signInWithEmailHandler = useCallback(
    async (credentials: EmailCredentials): Promise<void> => {
      await execute(async () => {
        const { auth } = getFirebaseServices();
        const result = await signInWithEmail({ auth, credentials });
        await syncAuthenticatedUser({ user: result.user, provider: 'password' });
      });
    },
    [execute, syncAuthenticatedUser],
  );

  const registerWithEmailHandler = useCallback(
    async (credentials: RegistrationCredentials): Promise<void> => {
      await execute(async () => {
        const { auth } = getFirebaseServices();
        const result = await createEmailAccount({ auth, credentials });
        await syncAuthenticatedUser({
          user: result.user,
          provider: 'password',
          preferredName: credentials.name,
        });
      });
    },
    [execute, syncAuthenticatedUser],
  );

  const signInWithGoogleHandler = useCallback(
    async (idToken: string): Promise<void> => {
      await execute(async () => {
        const { auth } = getFirebaseServices();
        const result = await signInWithGoogleIdToken({ auth, idToken });
        await syncAuthenticatedUser({ user: result.user, provider: 'google' });
      });
    },
    [execute, syncAuthenticatedUser],
  );

  const signInWithGooglePopupHandler = useCallback(async (): Promise<void> => {
    await execute(async () => {
      const { auth } = getFirebaseServices();
      const result = await signInWithGooglePopup({ auth });
      await syncAuthenticatedUser({ user: result.user, provider: 'google' });
    });
  }, [execute, syncAuthenticatedUser]);

  const signInWithAppleHandler = useCallback(
    async (
      credentialInput: AppleCredentialInput & { preferredName: string | null },
    ): Promise<void> => {
      await execute(async () => {
        const { auth } = getFirebaseServices();
        const result = await signInWithAppleCredential({
          auth,
          credentialInput,
        });
        await syncAuthenticatedUser({
          user: result.user,
          provider: 'apple',
          preferredName: credentialInput.preferredName,
        });
      });
    },
    [execute, syncAuthenticatedUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    await execute(async () => {
      const { auth } = getFirebaseServices();
      await signOutUser(auth);
      setFirebaseUser(null);
      setCurrentUser(null);
    });
  }, [execute]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const setErrorMessage = useCallback((message: string): void => {
    setError(message);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      firebaseUser,
      loading,
      busy,
      error,
      clearError,
      setErrorMessage,
      signInWithEmail: signInWithEmailHandler,
      registerWithEmail: registerWithEmailHandler,
      signInWithGoogle: signInWithGoogleHandler,
      signInWithGooglePopup: signInWithGooglePopupHandler,
      signInWithApple: signInWithAppleHandler,
      logout,
    }),
    [
      busy,
      clearError,
      currentUser,
      error,
      firebaseUser,
      loading,
      logout,
      registerWithEmailHandler,
      setErrorMessage,
      signInWithAppleHandler,
      signInWithEmailHandler,
      signInWithGoogleHandler,
      signInWithGooglePopupHandler,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
}
