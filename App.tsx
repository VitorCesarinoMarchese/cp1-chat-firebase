import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LoadingView } from './src/components/LoadingView';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import type { ChatUser } from './src/types/user';

function AppNavigator(): React.ReactElement {
  const auth = useAuth();
  const [selectedContact, setSelectedContact] = useState<ChatUser | null>(null);

  useEffect(() => {
    setSelectedContact(null);
  }, [auth.currentUser?.uid]);

  if (auth.loading) {
    return <LoadingView message="Carregando sua sessão..." />;
  }

  if (auth.currentUser === null) {
    return <LoginScreen />;
  }

  if (selectedContact !== null) {
    return <ChatScreen contact={selectedContact} onBack={() => setSelectedContact(null)} />;
  }

  return <UsersScreen onSelectUser={setSelectedContact} />;
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}
