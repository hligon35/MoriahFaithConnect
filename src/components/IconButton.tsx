import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type IconButtonProps = {
  icon: MaterialIconName;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  iconColor?: string;
};

export function IconButton({ icon, onPress, accessibilityLabel, disabled, iconColor }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={28} color={iconColor ?? colors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
