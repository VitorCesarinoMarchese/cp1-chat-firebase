import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../types/chat';
import { colors, paperLineHeight, spacing } from '../theme';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
};

export function ChatMessageBubble({
  message,
  isMine,
}: ChatMessageBubbleProps): React.ReactElement {
  const time =
    message.createdAt > 0
      ? new Date(message.createdAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';

  return (
    <View style={[styles.row, isMine ? styles.myRow : styles.theirRow]}>
      <View style={[styles.note, isMine ? styles.myNote : styles.theirNote]}>
        <View style={styles.noteHeader}>
          <Text style={styles.author}>{isMine ? 'Você' : 'Seu amigo'}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.text}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  author: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  myNote: {
    borderRightColor: colors.primary,
    borderRightWidth: 2,
    paddingRight: spacing.md,
  },
  myRow: {
    alignItems: 'flex-end',
  },
  note: {
    maxWidth: '92%',
    paddingHorizontal: spacing.sm,
  },
  noteHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: paperLineHeight,
    justifyContent: 'space-between',
    minWidth: 120,
  },
  row: {
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  text: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: paperLineHeight,
  },
  theirNote: {
    borderLeftColor: colors.paperEdge,
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
  },
  theirRow: {
    alignItems: 'flex-start',
  },
  time: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 11,
    lineHeight: 16,
    marginLeft: spacing.md,
  },
});
