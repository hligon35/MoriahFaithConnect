import { useState } from 'react';
import { Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';
import { useAdmin } from '../state/AdminContext';
import { exportCollectionCsv } from '../storage/collectionStore';

export function GiveScreen() {
  const { adminEnabled, collectionEntries, collectionTotals, recordCollection } = useAdmin();
  const [donationDraft, setDonationDraft] = useState('');
  const [titheDraft, setTitheDraft] = useState('');
  const [statusText, setStatusText] = useState('');

  function parseMoneyToCents(text: string) {
    const clean = text.replace(/[^0-9.]/g, '').trim();
    if (!clean) return 0;
    const value = Number(clean);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value * 100);
  }

  const money = (cents: number) => {
    const dollars = (cents ?? 0) / 100;
    return dollars.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };

  return (
    <ScreenContainer>
      <Text style={styles.lead} allowFontScaling>
        Give securely and conveniently from your phone.
      </Text>

      {adminEnabled && (
        <SectionCard title="Admin: Collections">
          <Text style={styles.bodyText} allowFontScaling>
            Record donations and tithes, then export totals and reports.
          </Text>

          <View style={styles.adminTotalsRow} accessibilityRole="summary">
            <Text style={styles.adminTotalText} allowFontScaling>
              Donations: {money(collectionTotals.donationsCents)}
            </Text>
            <Text style={styles.adminTotalText} allowFontScaling>
              Tithes: {money(collectionTotals.tithesCents)}
            </Text>
          </View>

          <View style={styles.adminInputRow}>
            <Text style={styles.adminFieldLabel} allowFontScaling>
              Donation ($)
            </Text>
            <TextInput
              value={donationDraft}
              onChangeText={setDonationDraft}
              placeholder="0.00"
              placeholderTextColor={colors.text}
              keyboardType="decimal-pad"
              style={styles.adminInput}
              accessibilityLabel="Donation amount"
            />
            <PrimaryButton
              title="Add"
              onPress={async () => {
                setStatusText('');
                const cents = parseMoneyToCents(donationDraft);
                if (cents <= 0) {
                  setStatusText('Enter a donation amount.');
                  return;
                }
                await recordCollection({ kind: 'donation', amountCents: cents });
                setDonationDraft('');
                setStatusText('Donation recorded.');
              }}
              disabled={parseMoneyToCents(donationDraft) <= 0}
            />
          </View>

          <View style={styles.adminInputRow}>
            <Text style={styles.adminFieldLabel} allowFontScaling>
              Tithe ($)
            </Text>
            <TextInput
              value={titheDraft}
              onChangeText={setTitheDraft}
              placeholder="0.00"
              placeholderTextColor={colors.text}
              keyboardType="decimal-pad"
              style={styles.adminInput}
              accessibilityLabel="Tithe amount"
            />
            <PrimaryButton
              title="Add"
              onPress={async () => {
                setStatusText('');
                const cents = parseMoneyToCents(titheDraft);
                if (cents <= 0) {
                  setStatusText('Enter a tithe amount.');
                  return;
                }
                await recordCollection({ kind: 'tithe', amountCents: cents });
                setTitheDraft('');
                setStatusText('Tithe recorded.');
              }}
              disabled={parseMoneyToCents(titheDraft) <= 0}
            />
          </View>

          <View style={styles.adminActions}>
            <PrimaryButton
              title="Share Total Collection Report"
              onPress={async () => {
                const text = [
                  `Total Donations: ${money(collectionTotals.donationsCents)}`,
                  `Total Tithes: ${money(collectionTotals.tithesCents)}`,
                  `Generated: ${new Date().toLocaleString()}`,
                ].join('\n');
                await Share.share({ message: text });
              }}
            />
            <PrimaryButton
              title="Export Collection CSV"
              onPress={async () => {
                const csv = exportCollectionCsv(collectionEntries);
                await Share.share({ message: csv });
              }}
              disabled={collectionEntries.length === 0}
            />
          </View>

          {!!statusText && (
            <Text style={styles.statusText} allowFontScaling>
              {statusText}
            </Text>
          )}
        </SectionCard>
      )}

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
  adminTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  adminTotalText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  adminInputRow: {
    gap: 8,
  },
  adminFieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  adminInput: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  adminActions: {
    gap: 10,
  },
  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
