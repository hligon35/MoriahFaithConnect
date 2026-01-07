import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AdminProvider } from './src/state/AdminContext';
import { colors } from './theme/colors';

export default function App() {
  return (
    <>
      <AdminProvider>
        <RootNavigator />
      </AdminProvider>
      <StatusBar style="light" backgroundColor={colors.text} />
    </>
  );
}
