import { StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';

export function GiveScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.lead} allowFontScaling>
        Give securely and conveniently from your phone.
      </Text>

      <SectionCard title="Donations">
        <Text style={styles.bodyText} allowFontScaling>
          Donation options will appear here.
        </Text>
        <PrimaryButton title="Give Now (Coming Soon)" onPress={() => {}} disabled />
      </SectionCard>

      <SectionCard title="Receipts">
        <Text style={styles.bodyText} allowFontScaling>
          Your giving history and receipts will appear here.
        </Text>
        <PrimaryButton title="View Receipts (Coming Soon)" onPress={() => {}} disabled />
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
