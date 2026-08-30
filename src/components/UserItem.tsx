import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChatUser } from '../types/user';
import { authProviderLabel } from '../types/user';
import { colors, spacing } from '../theme';

type UserItemProps = {
  user: ChatUser;
  onPress: (user: ChatUser) => void;
};

export function UserItem({ user, onPress }: UserItemProps): React.ReactElement {
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      onPress={() => onPress(user)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Escrever uma carta para ${user.name}`}
    >
      {user.photoUrl ? (
        <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.provider}>{authProviderLabel(user.provider)}</Text>
      </View>
      <Text style={styles.arrow}>✎</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  arrow: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 23,
    paddingLeft: spacing.sm,
  },
  avatar: {
    borderColor: colors.paperEdge,
    borderRadius: 4,
    borderWidth: 2,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.paperEdge,
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.paperEdge,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    borderRadius: 3,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
  provider: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 13,
    marginTop: 3,
  },
});
