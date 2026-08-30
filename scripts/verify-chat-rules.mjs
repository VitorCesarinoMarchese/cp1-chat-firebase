import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import {
  connectDatabaseEmulator,
  getDatabase,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';

const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: 'demo-cp1.firebaseapp.com',
  databaseURL: 'https://demo-cp1-default-rtdb.firebaseio.com',
  projectId: 'demo-cp1',
});
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const database = getDatabase(app);
connectDatabaseEmulator(database, '127.0.0.1', 9000);

const passwordUser = await createUserWithEmailAndPassword(
  auth,
  `password-${crypto.randomUUID()}@example.com`,
  'password123',
);
const passwordUid = passwordUser.user.uid;
const googleUid = `google-${crypto.randomUUID()}`;
const participants = [passwordUid, googleUid].sort();
const conversationId = participants.join('__');

await set(ref(database, `users/${passwordUid}`), {
  uid: passwordUid,
  name: 'Password User',
  email: passwordUser.user.email,
  provider: 'password',
  photoURL: '',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const googleProfileResponse = await fetch(
  `http://127.0.0.1:9000/users/${googleUid}.json?ns=demo-cp1-default-rtdb`,
  {
    method: 'PUT',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: googleUid,
      name: 'Google User',
      email: 'google@example.com',
      provider: 'google',
      photoURL: '',
      createdAt: 1,
      updatedAt: 1,
    }),
  },
);
if (!googleProfileResponse.ok) {
  throw new Error(`Could not seed Google profile: ${googleProfileResponse.status}`);
}

await set(ref(database, `conversations/${conversationId}`), {
  participantOne: participants[0],
  participantTwo: participants[1],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

await update(ref(database), {
  [`messages/${conversationId}/message-1`]: {
    id: 'message-1',
    conversationId,
    senderId: passwordUid,
    receiverId: googleUid,
    text: 'hello',
    createdAt: serverTimestamp(),
  },
  [`conversations/${conversationId}/updatedAt`]: serverTimestamp(),
});

try {
  await set(ref(database, `conversations/${conversationId}`), {
    participantOne: participants[0],
    participantTwo: participants[1],
    createdAt: 1,
    updatedAt: 1,
    unexpected: true,
  });
  throw new Error('Unknown conversation fields were accepted');
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('PERMISSION_DENIED')) {
    throw error;
  }
}

console.log('PASS authenticated profile, conversation, atomic message, and schema rejection paths');
await auth.signOut();
process.exit(0);
