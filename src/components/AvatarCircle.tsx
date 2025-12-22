import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type AvatarCircleProps = {
  name: string;
  size?: number;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function AvatarCircle({ name, size = 54 }: AvatarCircleProps) {
  const initials = initialsFromName(name);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.initials} allowFontScaling>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primary,
    borderColor: colors.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
});
