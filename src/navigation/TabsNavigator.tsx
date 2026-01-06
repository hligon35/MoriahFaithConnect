import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

function TabsHeader({ onPressAccount }: { onPressAccount: () => void }) {
  const insets = useSafeAreaInsets();
  const extraDrop = Math.round(56 * 0.25);

  return (
    <View style={[styles.headerWrap, { height: insets.top + 56 + extraDrop }]}
      accessibilityRole="header"
    >
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} allowFontScaling>
            Moriah Faith Connect
          </Text>
          <View style={styles.headerRight}>
            <IconButton
              icon="account-circle"
              accessibilityLabel="Account"
              onPress={onPressAccount}
              iconColor={colors.primary}
              iconSize={42}
              buttonSize={60}
            />
          </View>
        </View>
      </SafeAreaView>
      <View style={[styles.headerDrop, { height: extraDrop }]} />
    </View>
  );
}

export function TabsNavigator() {
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <TabsHeader onPressAccount={() => stackNav.navigate('Account')} />,

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

const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: colors.text,
  },
  headerSafe: {
    backgroundColor: colors.text,
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 16,
  },
  headerDrop: {
    backgroundColor: colors.text,
  },
});
