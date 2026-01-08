import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AdminProvider, useAdmin } from './src/state/AdminContext';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { colors } from './theme/colors';

function AppShell() {
  const { hydrated } = useAdmin();
  const auth = useAuth();
  if (!hydrated || !auth.hydrated) return <View style={{ flex: 1, backgroundColor: colors.text }} />;
  return <RootNavigator />;
}

export default function App() {
  return (
    <>
      <SafeAreaProvider>
        <AuthProvider>
          <AdminProvider>
            <AppShell />
          </AdminProvider>
        </AuthProvider>
      </SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.text} />
    </>
  );
}
