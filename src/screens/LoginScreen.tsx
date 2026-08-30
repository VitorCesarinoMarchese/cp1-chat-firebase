import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../contexts/AuthContext';
import { useAppleSignIn } from '../hooks/useAppleSignIn';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { colors, spacing } from '../theme';
import { toUserFacingError } from '../utils/errors';

export function LoginScreen(): React.ReactElement {
  const auth = useAuth();
  const googleSignIn = useGoogleSignIn();
  const appleSignIn = useAppleSignIn();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [socialBusy, setSocialBusy] = useState(false);
  const formBusy = auth.busy || socialBusy;

  const canSubmit = useMemo(
    () =>
      email.trim().length > 0 &&
      password.length > 0 &&
      (!isRegistering || name.trim().length > 0),
    [email, isRegistering, name, password],
  );

  const clearFormError = useCallback((): void => {
    setLocalError(null);
    auth.clearError();
  }, [auth]);

  const handleEmailAuth = useCallback(async (): Promise<void> => {
    if (!canSubmit) {
      setLocalError(
        isRegistering
          ? 'Preencha nome, e-mail e senha para criar sua conta.'
          : 'Preencha e-mail e senha para entrar.',
      );
      return;
    }

    setLocalError(null);
    auth.clearError();
    if (isRegistering) {
      await auth.registerWithEmail({ name, email, password });
      return;
    }

    await auth.signInWithEmail({ email, password });
  }, [auth, canSubmit, email, isRegistering, name, password]);

  const handleGoogleAuth = useCallback(async (): Promise<void> => {
    setLocalError(null);
    auth.clearError();
    setSocialBusy(true);

    try {
      if (Platform.OS === 'web') {
        await auth.signInWithGooglePopup();
      } else {
        const idToken = await googleSignIn.start();
        await auth.signInWithGoogle(idToken);
      }
    } catch (error: unknown) {
      auth.setErrorMessage(toUserFacingError(error));
    } finally {
      setSocialBusy(false);
    }
  }, [auth, googleSignIn]);

  const handleAppleAuth = useCallback(async (): Promise<void> => {
    setLocalError(null);
    auth.clearError();
    setSocialBusy(true);

    try {
      const credential = await appleSignIn.start();
      await auth.signInWithApple(credential);
    } catch (error: unknown) {
      auth.setErrorMessage(toUserFacingError(error));
    } finally {
      setSocialBusy(false);
    }
  }, [appleSignIn, auth]);

  const toggleMode = useCallback((): void => {
    setIsRegistering((currentMode) => !currentMode);
    setLocalError(null);
    auth.clearError();
  }, [auth]);

  const visibleError = localError ?? auth.error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.paperSheet}>
            <View style={styles.brandMark}>
              <Text style={styles.brandGlyph}>✉</Text>
            </View>
            <Text style={styles.eyebrow}>CORRESPONDÊNCIA DIGITAL</Text>
            <Text style={styles.title}>Conversa</Text>
            <Text style={styles.subtitle}>
              {isRegistering
                ? 'Escreva seu nome para abrir uma nova caixa de cartas.'
                : 'Abra sua caixa de cartas e escreva para um amigo.'}
            </Text>

            {visibleError ? (
              <ErrorBanner
                message={visibleError}
                onDismiss={localError ? () => setLocalError(null) : auth.clearError}
              />
            ) : null}

            {isRegistering ? (
              <TextInput
                value={name}
                onChangeText={clearFormErrorAnd(setName, clearFormError)}
                placeholder="Nome"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                style={styles.input}
                editable={!formBusy}
                accessibilityLabel="Nome"
              />
            ) : null}
            <TextInput
              value={email}
              onChangeText={clearFormErrorAnd(setEmail, clearFormError)}
              placeholder="E-mail"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              editable={!formBusy}
              accessibilityLabel="E-mail"
            />
            <TextInput
              value={password}
              onChangeText={clearFormErrorAnd(setPassword, clearFormError)}
              placeholder="Senha"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              editable={!formBusy}
              accessibilityLabel="Senha"
            />

            <Pressable
              onPress={handleEmailAuth}
              disabled={formBusy}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !formBusy && styles.primaryButtonPressed,
                formBusy && styles.disabledButton,
              ]}
              accessibilityRole="button"
            >
              {formBusy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegistering ? 'Criar conta' : 'Entrar com e-mail'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={toggleMode} disabled={formBusy} style={styles.modeButton}>
              <Text style={styles.modeText}>
                {isRegistering ? 'Já tenho uma conta' : 'Criar uma conta'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou assine com</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={handleGoogleAuth}
              disabled={formBusy}
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.socialButtonPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.googleLogo}>G</Text>
              <Text style={styles.socialText}>Continuar com Google</Text>
            </Pressable>

            <Pressable
              onPress={handleAppleAuth}
              disabled={formBusy}
              style={({ pressed }) => [
                styles.socialButton,
                styles.appleButton,
                pressed && styles.appleButtonPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.appleLogo}></Text>
              <Text style={styles.appleText}>Continuar com Apple</Text>
            </Pressable>

            <Text style={styles.providerHint}>
              Depois de entrar, escolha um amigo e escreva sua carta em tempo real.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function clearFormErrorAnd(
  setValue: (value: string) => void,
  clearError: () => void,
): (value: string) => void {
  return (value: string): void => {
    setValue(value);
    clearError();
  };
}

const styles = StyleSheet.create({
  appleButton: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  appleButtonPressed: {
    backgroundColor: '#443B35',
  },
  appleLogo: {
    color: colors.white,
    fontSize: 20,
    marginRight: spacing.sm,
  },
  appleText: {
    color: colors.white,
    fontFamily: 'Georgia',
    fontSize: 15,
    fontWeight: '700',
  },
  brandGlyph: {
    color: colors.white,
    fontSize: 25,
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderRadius: 34,
    borderWidth: 3,
    elevation: 2,
    height: 62,
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.paperShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    width: 62,
  },
  divider: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: spacing.lg,
  },
  dividerText: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 12,
    marginHorizontal: spacing.sm,
  },
  disabledButton: {
    opacity: 0.65,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  googleLogo: {
    color: '#4285F4',
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 17,
    height: 54,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  keyboardView: {
    flex: 1,
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  modeText: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 14,
    fontWeight: '700',
  },
  paperSheet: {
    backgroundColor: colors.paper,
    borderColor: colors.paperEdge,
    borderRadius: 4,
    borderWidth: 1,
    elevation: 2,
    maxWidth: 480,
    padding: spacing.lg,
    shadowColor: colors.paperShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 54,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '700',
  },
  providerHint: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.paperEdge,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  socialButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  socialText: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
