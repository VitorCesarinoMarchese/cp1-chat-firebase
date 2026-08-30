import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { SocialAuthCancelledError } from '../utils/errors';

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useGoogleSignIn(): {
  start: () => Promise<string>;
  isConfigured: boolean;
  isReady: boolean;
} {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const currentClientId =
    Platform.OS === 'ios' ? iosClientId : Platform.OS === 'android' ? androidClientId : webClientId;

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId,
      iosClientId,
      androidClientId,
      selectAccount: true,
    },
    { scheme: 'cp1chat' },
  );

  const start = useCallback(async (): Promise<string> => {
    if (currentClientId === undefined || currentClientId.trim().length === 0) {
      throw new Error('Configure o client ID do Google no arquivo .env.');
    }

    if (request === null) {
      throw new Error('AUTH_NOT_READY');
    }

    const result = await promptAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new SocialAuthCancelledError();
    }

    if (result.type !== 'success') {
      throw new Error('O Google não concluiu o login.');
    }

    const idToken = result.params.id_token;
    if (idToken === undefined || idToken.trim().length === 0) {
      throw new Error('O Google não retornou um token de autenticação.');
    }

    return idToken;
  }, [currentClientId, promptAsync, request]);

  return {
    start,
    isConfigured: currentClientId !== undefined && currentClientId.trim().length > 0,
    isReady:
      request !== null && currentClientId !== undefined && currentClientId.trim().length > 0,
  };
}
