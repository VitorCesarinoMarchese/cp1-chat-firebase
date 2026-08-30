import {
  createUserWithEmailAndPassword as firebaseCreateUser,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  signInWithPopup as firebaseSignInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import type { AuthProvider, ChatUser } from '../types/user';

export type EmailCredentials = {
  email: string;
  password: string;
};

export type RegistrationCredentials = EmailCredentials & {
  name: string;
};

export type AppleCredentialInput = {
  idToken: string;
  rawNonce: string;
};

export async function createEmailAccount({
  auth,
  credentials,
}: {
  auth: Auth;
  credentials: EmailCredentials;
}): Promise<UserCredential> {
  return firebaseCreateUser(
    auth,
    credentials.email.trim().toLowerCase(),
    credentials.password,
  );
}

export async function signInWithEmail({
  auth,
  credentials,
}: {
  auth: Auth;
  credentials: EmailCredentials;
}): Promise<UserCredential> {
  return firebaseSignInWithEmail(
    auth,
    credentials.email.trim().toLowerCase(),
    credentials.password,
  );
}

export async function signInWithGoogleIdToken({
  auth,
  idToken,
}: {
  auth: Auth;
  idToken: string;
}): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export async function signInWithGooglePopup({ auth }: { auth: Auth }): Promise<UserCredential> {
  return firebaseSignInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithAppleCredential({
  auth,
  credentialInput,
}: {
  auth: Auth;
  credentialInput: AppleCredentialInput;
}): Promise<UserCredential> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: credentialInput.idToken,
    rawNonce: credentialInput.rawNonce,
  });

  return signInWithCredential(auth, credential);
}

export async function signOutUser(auth: Auth): Promise<void> {
  await firebaseSignOut(auth);
}

export async function setUserDisplayName({
  user,
  name,
}: {
  user: User;
  name: string;
}): Promise<void> {
  const normalizedName = name.trim();
  if (normalizedName.length === 0) {
    return;
  }

  await updateProfile(user, { displayName: normalizedName });
}

export function authProviderFromFirebaseId(providerId: string | null): AuthProvider | null {
  switch (providerId) {
    case 'password':
      return 'password';
    case 'google.com':
      return 'google';
    case 'apple.com':
      return 'apple';
    default:
      return null;
  }
}

export function getAuthProviderForUser(user: User): AuthProvider | null {
  for (const providerData of user.providerData) {
    const provider = authProviderFromFirebaseId(providerData.providerId);
    if (provider !== null) {
      return provider;
    }
  }

  return authProviderFromFirebaseId(user.providerId);
}

export function createChatUser(
  user: User,
  provider: AuthProvider,
  preferredName?: string | null,
): ChatUser {
  const fallbackName = user.email?.split('@')[0] ?? `Usuário ${user.uid.slice(0, 6)}`;
  const possibleNames: Array<string | null | undefined> = [
    preferredName,
    user.displayName,
    fallbackName,
  ];

  let name = fallbackName;
  for (const possibleName of possibleNames) {
    if (possibleName !== null && possibleName !== undefined && possibleName.trim().length > 0) {
      name = possibleName.trim();
      break;
    }
  }

  return {
    uid: user.uid,
    name,
    email: user.email,
    provider,
    photoUrl: user.photoURL,
  };
}

export function subscribeToAuthState({
  auth,
  onUser,
  onError,
}: {
  auth: Auth;
  onUser: (user: User | null) => void;
  onError: (error: Error) => void;
}): () => void {
  return onAuthStateChanged(auth, onUser, onError);
}
