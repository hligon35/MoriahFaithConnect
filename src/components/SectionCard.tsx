import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type SectionCardProps = {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  headerRight?: ReactNode;
};

export function SectionCard({ title, children, style, headerRight }: SectionCardProps) {
  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <View style={styles.header}>
        <Text style={styles.title} allowFontScaling>
          {title}
        </Text>
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
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    top: -6,
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
