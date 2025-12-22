import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './theme/colors';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="light" backgroundColor={colors.text} />
    </>
  );
}
