import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { RootTabParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { WatchScreen } from '../screens/WatchScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { EventsScreen } from '../screens/EventsScreen';

import { colors } from '../../theme/colors';
import { IconButton } from '../components/IconButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MaterialIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function TabsNavigator() {
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
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
        headerRight: () => (
          <IconButton
            icon="account-circle"
            accessibilityLabel="Account"
            onPress={() => stackNav.navigate('Account')}
            iconColor={colors.primary}
          />
        ),

        tabBarStyle: {
          backgroundColor: colors.text,
          borderTopColor: colors.primary,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.highlight,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '800' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Watch"
        component={WatchScreen}
        options={{
          title: 'Watch',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="ondemand-video" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="forum" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="event" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
