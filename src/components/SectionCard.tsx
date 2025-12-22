import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type SectionCardProps = {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionCard({ title, children, style }: SectionCardProps) {
  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <Text style={styles.title} allowFontScaling>
        {title}
      </Text>
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
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    gap: 10,
  },
});
