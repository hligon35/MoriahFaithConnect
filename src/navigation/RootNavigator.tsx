import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { AccountScreen } from '../screens/AccountScreen';
import { TabsNavigator } from './TabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      primary: colors.primary,
      text: colors.text,
      card: colors.text,
      border: colors.primary,
      notification: colors.button,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTitle: 'Moriah Faith Connect',
          headerStyle: { backgroundColor: colors.text },
          headerTitleStyle: {
            color: colors.primary,
            fontSize: 20,
            fontWeight: '900',
          },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ title: 'Account' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
