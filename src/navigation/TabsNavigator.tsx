import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootTabParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { WatchScreen } from '../screens/WatchScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { EventsScreen } from '../screens/EventsScreen';

import { colors } from '../../theme/colors';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MaterialIcons } from '@expo/vector-icons';
import { useAdmin } from '../state/AdminContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabsHeader({ onPressAccount, onPressDev }: { onPressAccount: () => void; onPressDev: () => void }) {
  const insets = useSafeAreaInsets();
  const extraDrop = Math.round(56 * 0.25);
  const { adminEnabled, collectionTotals } = useAdmin();

  const money = (cents: number) => {
    const dollars = (cents ?? 0) / 100;
    return dollars.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };

  return (
    <View style={[styles.headerWrap, { height: insets.top + 56 + extraDrop }]}
      accessibilityRole="header"
    >
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="developer-mode"
              accessibilityLabel="Developer menu"
              onPress={onPressDev}
              iconColor={colors.primary}
              iconSize={28}
              buttonSize={44}
            />
          </View>
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

      {adminEnabled && (
        <View style={styles.headerTotals} accessibilityRole="summary" accessibilityLabel="Collection totals">
          <Text style={styles.headerTotalsText} allowFontScaling>
            Donations: {money(collectionTotals.donationsCents)}
          </Text>
          <Text style={styles.headerTotalsText} allowFontScaling>
            Tithes: {money(collectionTotals.tithesCents)}
          </Text>
        </View>
      )}

      <View style={[styles.headerDrop, { height: extraDrop }]} />
    </View>
  );
}

export function TabsNavigator() {
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const extraDrop = Math.round(56 * 0.25);
  const devMenuTop = insets.top + 56 + extraDrop;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          header: () => (
            <TabsHeader
              onPressAccount={() => stackNav.navigate('Account')}
              onPressDev={() => setDevMenuOpen(true)}
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

      <Modal
        visible={devMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDevMenuOpen(false)}
      >
        <Pressable
          style={styles.devBackdrop}
          accessibilityRole="button"
          accessibilityLabel="Close developer menu"
          onPress={() => setDevMenuOpen(false)}
        />
        <View style={[styles.devMenuCard, { top: devMenuTop, left: 16 }]}>
          <Text style={styles.devMenuTitle} allowFontScaling>
            Developer
          </Text>
          <View style={styles.devMenuDivider} />
          <View style={styles.devMenuButtons}>
            <PrimaryButton
              title="User View"
              onPress={() => {
                setDevMenuOpen(false);
                stackNav.navigate('Tabs');
              }}
            />
            <PrimaryButton
              title="Admin View"
              onPress={() => {
                setDevMenuOpen(false);
                stackNav.navigate('Admin');
              }}
            />
          </View>
        </View>
      </Modal>
    </>
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
  headerLeft: {
    position: 'absolute',
    left: 16,
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
  headerTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 12,
  },
  headerTotalsText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  devBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  devMenuCard: {
    position: 'absolute',
    width: 220,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  devMenuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  devMenuDivider: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  devMenuButtons: {
    gap: 10,
  },
});
