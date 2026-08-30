import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type ErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps): React.ReactElement {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Fechar mensagem de erro">
          <Text style={styles.dismiss}>Fechar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.dangerBackground,
    borderColor: '#E6B8A7',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    color: colors.danger,
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 14,
    lineHeight: 20,
  },
  dismiss: {
    color: colors.danger,
    fontFamily: 'Georgia',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
