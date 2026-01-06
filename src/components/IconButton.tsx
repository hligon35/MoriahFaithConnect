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
  iconSize?: number;
  buttonSize?: number;
  variant?: 'plain' | 'outlined';
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled,
  iconColor,
  iconSize = 28,
  buttonSize = 44,
  variant = 'plain',
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        variant === 'outlined' && styles.buttonOutlined,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.iconWrap, { width: buttonSize, height: buttonSize }]}>
        <MaterialIcons name={icon} size={iconSize} color={iconColor ?? colors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
  },
  buttonOutlined: {
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface,
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
