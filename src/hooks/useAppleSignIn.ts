import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { SocialAuthCancelledError } from '../utils/errors';

type AppleSignInPayload = {
  idToken: string;
  rawNonce: string;
  preferredName: string | null;
};

type AppleNonce = {
  raw: string;
  hashed: string;
};

async function createAppleNonce(): Promise<AppleNonce> {
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

function nameFromAppleCredential(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null {
  if (fullName === null) {
    return null;
  }

  const parts = [fullName.givenName, fullName.middleName, fullName.familyName].filter(
    (part): part is string => part !== null && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(' ') : null;
}

function isAppleCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return error instanceof Error && error.message.includes('canceled');
  }

  const code = error.code;
  return typeof code === 'string' && code === 'ERR_REQUEST_CANCELED';
}

export function useAppleSignIn(): {
  start: () => Promise<AppleSignInPayload>;
  isConfigured: boolean;
  isReady: boolean;
  usesNativeApple: boolean;
} {
  const appleServiceId = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID;
  const hostedRedirectUri = process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI;
  const discovery = useAutoDiscovery('https://appleid.apple.com');
  const redirectUri = makeRedirectUri({ scheme: 'cp1chat', path: 'auth' });
  const needsHostedRedirect = Platform.OS === 'android' || Platform.OS === 'ios';
  const fallbackRedirectUri = needsHostedRedirect ? hostedRedirectUri ?? redirectUri : redirectUri;
  const fallbackRedirectIsConfigured =
    !needsHostedRedirect ||
    (hostedRedirectUri !== undefined && hostedRedirectUri.startsWith('https://'));
  const [nonceVersion, setNonceVersion] = useState(0);
  const [nonce, setNonce] = useState<AppleNonce | null>(null);
  const [nonceError, setNonceError] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: appleServiceId ?? '',
      redirectUri: fallbackRedirectUri,
      responseType: ResponseType.IdToken,
      scopes: ['name', 'email'],
      usePKCE: false,
      extraParams: { response_mode: 'fragment', nonce: nonce?.hashed ?? 'pending' },
    },
    discovery,
  );

  useEffect(() => {
    let active = true;
    setNonce(null);
    setNonceError(false);

    void createAppleNonce()
      .then((createdNonce) => {
        if (active) {
          setNonce(createdNonce);
        }
      })
      .catch(() => {
        if (active) {
          setNonceError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [nonceVersion]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    let active = true;
    void AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (active) {
          setNativeAvailable(available);
        }
      })
      .catch(() => {
        if (active) {
          setNativeAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const start = useCallback(async (): Promise<AppleSignInPayload> => {
    try {
      if (Platform.OS === 'ios' && nativeAvailable) {
        const nativeNonce = await createAppleNonce();
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: nativeNonce.hashed,
        });

        if (credential.identityToken === null || credential.identityToken.trim().length === 0) {
          throw new Error('A Apple não retornou um token de autenticação.');
        }

        return {
          idToken: credential.identityToken,
          rawNonce: nativeNonce.raw,
          preferredName: nameFromAppleCredential(credential.fullName),
        };
      }

      if (
        appleServiceId === undefined ||
        appleServiceId.trim().length === 0 ||
        !fallbackRedirectIsConfigured ||
        request === null ||
        nonce === null
      ) {
        if (nonceError) {
          throw new Error('Não foi possível preparar o login da Apple.');
        }
        if (!fallbackRedirectIsConfigured) {
          throw new Error('Configure um redirect HTTPS da Apple no arquivo .env.');
        }
        throw new Error('Configure o Apple Service ID no arquivo .env.');
      }

      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new SocialAuthCancelledError();
      }

      if (result.type !== 'success') {
        throw new Error('A Apple não concluiu o login.');
      }

      const idToken = result.params.id_token;
      if (idToken === undefined || idToken.trim().length === 0) {
        throw new Error('A Apple não retornou um token de autenticação.');
      }

      return {
        idToken,
        rawNonce: nonce.raw,
        preferredName: null,
      };
    } catch (error: unknown) {
      if (isAppleCancellation(error)) {
        throw new SocialAuthCancelledError();
      }
      throw error;
    } finally {
      setNonceVersion((version) => version + 1);
    }
  }, [
    appleServiceId,
    fallbackRedirectIsConfigured,
    nativeAvailable,
    nonce,
    nonceError,
    promptAsync,
    request,
  ]);

  return {
    start,
    isConfigured:
      nativeAvailable ||
      (appleServiceId !== undefined &&
        appleServiceId.trim().length > 0 &&
        fallbackRedirectIsConfigured),
    isReady:
      nativeAvailable ||
      (appleServiceId !== undefined &&
        appleServiceId.trim().length > 0 &&
        request !== null &&
        nonce !== null &&
        fallbackRedirectIsConfigured),
    usesNativeApple: nativeAvailable,
  };
}

export type { AppleSignInPayload };
