import type { ReactNode } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundSource?: ImageSourcePropType;
};

export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  backgroundSource,
}: ScreenContainerProps) {
  const source = backgroundSource ?? require('../../assets/mmmbcbg.png');
  if (!scroll) {
    return (
      <ImageBackground
        source={source}
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
      source={source}
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
