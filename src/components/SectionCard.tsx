import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type SectionCardProps = {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  titleRight?: ReactNode;
  headerRight?: ReactNode;
};

export function SectionCard({ title, children, style, titleRight, headerRight }: SectionCardProps) {
  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} allowFontScaling>
            {title}
          </Text>
          {!!titleRight && <View style={styles.titleRight}>{titleRight}</View>}
        </View>
        {!!headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </View>
      <View style={styles.titleDivider} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  header: {
    position: 'relative',
    justifyContent: 'center',
    minHeight: 44,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 42,
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  titleRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleDivider: {
    alignSelf: 'center',
    width: '60%',
    height: 1,
    backgroundColor: colors.text,
  },
  body: {
    gap: 10,
  },
});
