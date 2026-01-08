import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { AccountScreen } from '../screens/AccountScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { useAuth } from '../state/AuthContext';
import { TabsNavigator } from './TabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { signedIn } = useAuth();
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
          headerTitleAlign: 'center',
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      >
        {!signedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        )}
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            title: 'Account',
            headerRight: () => (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.highlight,
                  borderColor: colors.primary,
                  borderWidth: 1,
                }}
              >
                <MaterialIcons name="account-circle" size={28} color={colors.primary} />
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Tools' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
