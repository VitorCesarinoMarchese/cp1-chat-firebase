import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type LoadingViewProps = {
  message?: string;
};

export function LoadingView({ message = 'Carregando...' }: LoadingViewProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 15,
    marginTop: spacing.md,
  },
});
