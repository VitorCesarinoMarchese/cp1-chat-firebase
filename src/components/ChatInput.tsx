import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '../theme';

type ChatInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Escreva sua carta..."
        placeholderTextColor={colors.muted}
        multiline
        maxLength={2000}
        style={styles.input}
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={onSend}
        accessibilityLabel="Mensagem"
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendButton,
          canSend && styles.sendEnabled,
          pressed && canSend && styles.sendPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
      >
        <Text style={[styles.sendText, canSend && styles.sendTextEnabled]}>Enviar carta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 25,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    borderRadius: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sendEnabled: {
    backgroundColor: colors.primary,
  },
  sendPressed: {
    backgroundColor: colors.primaryDark,
  },
  sendText: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 13,
    fontWeight: '700',
  },
  sendTextEnabled: {
    color: colors.white,
  },
});
