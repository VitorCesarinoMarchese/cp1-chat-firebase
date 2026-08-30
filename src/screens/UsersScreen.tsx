import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingView } from '../components/LoadingView';
import { UserItem } from '../components/UserItem';
import { getFirebaseServices } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUsers } from '../services/userService';
import type { ChatUser } from '../types/user';
import { authProviderLabel } from '../types/user';
import { compatibleProviders, isCompatibleProvider } from '../utils/chatRules';
import { toUserFacingError } from '../utils/errors';
import { colors, spacing } from '../theme';

type UsersScreenProps = {
  onSelectUser: (user: ChatUser) => void;
};

export function UsersScreen({ onSelectUser }: UsersScreenProps): React.ReactElement {
  const auth = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const currentProvider = auth.currentUser?.provider ?? null;

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    if (currentProvider === null) {
      setLoadingUsers(false);
      return () => {
        active = false;
      };
    }

    try {
      const { database } = getFirebaseServices();
      unsubscribe = subscribeToUsers({
        database,
        providers: compatibleProviders(currentProvider),
        onUsers: (nextUsers) => {
          if (!active) {
            return;
          }
          setUsers(nextUsers);
          setLoadingUsers(false);
          setUsersError(null);
        },
        onError: (error) => {
          if (!active) {
            return;
          }
          setUsersError(toUserFacingError(error));
          setLoadingUsers(false);
        },
      });
    } catch (error: unknown) {
      if (active) {
        setUsersError(toUserFacingError(error));
        setLoadingUsers(false);
      }
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [currentProvider]);

  const signedInUser = auth.currentUser;
  const compatibleUsers = useMemo(() => {
    if (signedInUser === null) {
      return [];
    }

    return users
      .filter(
        (user) =>
          user.uid !== signedInUser.uid &&
          isCompatibleProvider(signedInUser.provider, user.provider),
      )
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
  }, [signedInUser, users]);

  const handleSelectUser = useCallback(
    (user: ChatUser): void => {
      onSelectUser(user);
    },
    [onSelectUser],
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    await auth.logout();
  }, [auth]);

  const renderUser = useCallback(
    ({ item }: { item: ChatUser }): React.ReactElement => (
      <UserItem user={item} onPress={handleSelectUser} />
    ),
    [handleSelectUser],
  );

  const listHeader = useMemo(() => {
    if (auth.currentUser === null) {
      return null;
    }

    return (
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Para quem você quer escrever?</Text>
        <Text style={styles.sectionDescription}>
          Escolha um amigo para abrir uma nova carta. Você entrou com{' '}
          {authProviderLabel(auth.currentUser.provider)}.
        </Text>
      </View>
    );
  }, [auth.currentUser]);

  const listEmpty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nenhuma carta encontrada</Text>
      <Text style={styles.emptyDescription}>
        Quando outro usuário compatível criar uma conta, ele aparecerá aqui.
      </Text>
    </View>
  );

  const visibleError = usersError ?? auth.error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Minhas cartas</Text>
          <Text style={styles.headerSubtitle}>Correspondência em tempo real</Text>
        </View>
        <Pressable
          onPress={handleLogout}
          disabled={auth.busy}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Text style={styles.logoutText}>{auth.busy ? '...' : 'Sair'}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {visibleError ? (
          <ErrorBanner
            message={visibleError}
            onDismiss={usersError ? () => setUsersError(null) : auth.clearError}
          />
        ) : null}
        {loadingUsers ? (
          <LoadingView message="Procurando seus amigos..." />
        ) : (
          <FlatList
            data={compatibleUsers}
            keyExtractor={(item) => item.uid}
            renderItem={renderUser}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            contentContainerStyle={compatibleUsers.length === 0 ? styles.emptyList : undefined}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appName: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  emptyDescription: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 310,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.paperEdge,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerSubtitle: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 12,
    marginTop: 2,
  },
  listHeader: {
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
  },
  logoutButton: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  logoutPressed: {
    opacity: 0.55,
  },
  logoutText: {
    color: colors.primaryDark,
    fontFamily: 'Georgia',
    fontSize: 14,
    fontWeight: '700',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionDescription: {
    color: colors.muted,
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
  },
});
