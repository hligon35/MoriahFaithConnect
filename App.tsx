import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AdminProvider, useAdmin } from './src/state/AdminContext';
import { colors } from './theme/colors';

function AppShell() {
  const { hydrated } = useAdmin();
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.text }} />;
  return <RootNavigator />;
}

export default function App() {
  return (
    <>
      <SafeAreaProvider>
        <AdminProvider>
          <AppShell />
        </AdminProvider>
      </SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.text} />
    </>
  );
}
