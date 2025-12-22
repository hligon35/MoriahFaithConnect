import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type TileProps = {
  title: string;
  description?: string;
  onPress: () => void;
  mode?: 'navigate' | 'customize';
  isHidden?: boolean;
};

export function Tile({ title, description, onPress, mode = 'navigate', isHidden }: TileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        mode === 'customize'
          ? `${title}. ${isHidden ? 'Hidden' : 'Visible'}. Tap to toggle.`
          : title
      }
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <Text style={styles.title} allowFontScaling>
          {title}
        </Text>
        {!!description && (
          <Text style={styles.description} allowFontScaling>
            {description}
          </Text>
        )}
        {mode === 'customize' && (
          <Text style={styles.customizeHint} allowFontScaling>
            {isHidden ? 'Hidden (tap to show)' : 'Visible (tap to hide)'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderColor: colors.button,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  description: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  customizeHint: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
