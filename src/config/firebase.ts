import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { createPlatformAuth } from './authPlatform';
import type { Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredEnvironment: ReadonlyArray<readonly [string, string | undefined]> = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['EXPO_PUBLIC_FIREBASE_DATABASE_URL', firebaseConfig.databaseURL],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
];

const missingEnvironment = requiredEnvironment
  .filter(([, value]) => value === undefined || value.trim().length === 0)
  .map(([name]) => name);

export const firebaseConfigError =
  missingEnvironment.length > 0
    ? `Configure estas variáveis no arquivo .env: ${missingEnvironment.join(', ')}`
    : null;

export class FirebaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigurationError';
  }
}

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
};

let services: FirebaseServices | null = null;

export function getFirebaseServices(): FirebaseServices {
  if (firebaseConfigError !== null) {
    throw new FirebaseConfigurationError(firebaseConfigError);
  }

  if (services !== null) {
    return services;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = createPlatformAuth(app);
  const database = getDatabase(app, firebaseConfig.databaseURL);

  services = { app, auth, database };
  return services;
}
