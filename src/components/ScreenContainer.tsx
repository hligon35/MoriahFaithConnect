import type { ReactNode } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
}: ScreenContainerProps) {
  if (!scroll) {
    return (
      <ImageBackground
        source={require('../../assets/mmmbcbg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
          {children}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/mmmbcbg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          alwaysBounceVertical={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 25,
    gap: 12,
  },
});
