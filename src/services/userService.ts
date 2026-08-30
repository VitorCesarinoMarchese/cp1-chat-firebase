import {
  get,
  onValue,
  ref,
  serverTimestamp,
  update,
  type DataSnapshot,
  type Database,
} from 'firebase/database';
import type { AuthProvider, ChatUser } from '../types/user';
import {
  isRecord,
  readAuthProvider,
  readNumber,
  readNullableString,
  readString,
} from '../utils/parsers';

function parseUser(uid: string, value: unknown): ChatUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const storedUid = readString(value.uid);
  const name = readString(value.name);
  const provider = readAuthProvider(value.provider);
  if (storedUid !== uid || name === null || name.trim().length === 0 || provider === null) {
    return null;
  }

  return {
    uid,
    name: name.trim(),
    email: readNullableString(value.email),
    provider,
    photoUrl: readNullableString(value.photoURL),
  };
}

function parseUsersSnapshot(snapshot: DataSnapshot): ChatUser[] {
  const users: ChatUser[] = [];

  snapshot.forEach((child) => {
    const uid = child.key;
    if (uid === null) {
      return false;
    }

    const value: unknown = child.val();
    const user = parseUser(uid, value);
    if (user !== null) {
      users.push(user);
    }

    return false;
  });

  return users;
}

export async function upsertUserProfile({
  database,
  user,
}: {
  database: Database;
  user: ChatUser;
}): Promise<void> {
  const userReference = ref(database, `users/${user.uid}`);
  const profileFields = {
    uid: user.uid,
    name: user.name,
    email: user.email ?? '',
    provider: user.provider,
    photoURL: user.photoUrl ?? '',
  };
  const existingProfile = await get(userReference);
  const existingValue: unknown = existingProfile.val();
  const existingCreatedAt = isRecord(existingValue)
    ? readNumber(existingValue.createdAt)
    : null;
  const createdAt: number | object = existingCreatedAt ?? serverTimestamp();
  const profile = {
    ...profileFields,
    createdAt,
    updatedAt: serverTimestamp(),
  };
  const updates: Record<string, unknown> = {
    [`users/${user.uid}`]: profile,
    [`usersByProvider/${user.provider}/${user.uid}`]: profile,
  };

  await update(ref(database), updates);
}

export function subscribeToUsers({
  database,
  providers,
  onUsers,
  onError,
}: {
  database: Database;
  providers: ReadonlyArray<AuthProvider>;
  onUsers: (users: ChatUser[]) => void;
  onError: (error: Error) => void;
}): () => void {
  const usersByProvider = new Map<AuthProvider, ChatUser[]>();
  const subscriptions: Array<() => void> = [];

  const emitUsers = (): void => {
    const mergedUsers = new Map<string, ChatUser>();
    for (const users of usersByProvider.values()) {
      for (const user of users) {
        mergedUsers.set(user.uid, user);
      }
    }
    onUsers(Array.from(mergedUsers.values()));
  };

  try {
    for (const provider of providers) {
      const unsubscribe = onValue(
        ref(database, `usersByProvider/${provider}`),
        (snapshot) => {
          try {
            usersByProvider.set(provider, parseUsersSnapshot(snapshot));
            emitUsers();
          } catch (error: unknown) {
            onError(error instanceof Error ? error : new Error('Falha ao ler usuários.'));
          }
        },
        onError,
      );
      subscriptions.push(unsubscribe);
    }
  } catch (error: unknown) {
    for (const unsubscribe of subscriptions) {
      unsubscribe();
    }
    onError(error instanceof Error ? error : new Error('Falha ao escutar usuários.'));
  }

  return () => {
    for (const unsubscribe of subscriptions) {
      unsubscribe();
    }
  };
}
