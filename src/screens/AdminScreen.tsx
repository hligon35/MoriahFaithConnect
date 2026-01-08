import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';

export function AdminScreen() {
  return (
    <ScreenContainer>
      <SectionCard title="Tools">
        <Text style={styles.bodyText} allowFontScaling>
          Controls will appear here.
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
