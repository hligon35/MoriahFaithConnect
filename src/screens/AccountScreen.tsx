import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AvatarCircle } from '../components/AvatarCircle';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import {
  disableLiveStreamStartAlert,
  enableLiveStreamStartAlert,
  ensureNotificationPermissions,
  formatLocalDateTime,
  getLiveStreamAlertStatus,
} from '../notifications/notifications';
import {
  defaultPrivacySettings,
  loadPrivacySettings,
  savePrivacySettings,
  type PrivacySettings,
} from '../storage/privacyPrefs';

export function AccountScreen() {
  const displayName = 'Moriah Member';
  const displayEmail = 'member@moriahfaithconnect.org';

  const [liveAlertsEnabled, setLiveAlertsEnabled] = useState(false);
  const [liveAlertsBusy, setLiveAlertsBusy] = useState(false);
  const [liveAlertNext, setLiveAlertNext] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');

  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacySettings);
  const [privacyLoaded, setPrivacyLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await getLiveStreamAlertStatus();
      setLiveAlertsEnabled(status.enabled);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const p = await loadPrivacySettings();
      setPrivacy(p);
      setPrivacyLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!privacyLoaded) return;
    savePrivacySettings(privacy).catch(() => {});
  }, [privacy, privacyLoaded]);

  const setLiveAlertsEnabledSafe = async (nextEnabled: boolean) => {
    if (liveAlertsBusy) return;

    setStatusText('');
    setLiveAlertsEnabled(nextEnabled);
    setLiveAlertsBusy(true);

    try {
      const ok = await ensureNotificationPermissions();
      if (!ok) {
        setLiveAlertsEnabled(false);
        setLiveAlertNext('');
        setStatusText('Notifications are disabled. Enable them in your device settings.');
        return;
      }

      if (!nextEnabled) {
        await disableLiveStreamStartAlert();
        setLiveAlertsEnabled(false);
        setLiveAlertNext('');
        setStatusText('Live alerts disabled.');
        return;
      }

      const scheduled = await enableLiveStreamStartAlert();
      setLiveAlertsEnabled(true);
      setLiveAlertNext(formatLocalDateTime(scheduled.scheduledFor));
      setStatusText('Live alert scheduled.');
    } finally {
      setLiveAlertsBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.lead} allowFontScaling>
        Manage your account.
      </Text>

      <SectionCard title="Account">
        <View style={styles.accountRow} accessibilityRole="summary" accessibilityLabel="Account information">
          <AvatarCircle name={displayName} size={64} />
          <View style={styles.accountInfo}>
            <Text style={styles.accountName} allowFontScaling numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.accountMeta} allowFontScaling numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>
      </SectionCard>

      <View style={styles.givingRow}>
        <View style={styles.givingColumn}>
          <SectionCard title="Donate" style={styles.givingCard}>
            <Text style={styles.bodyText} allowFontScaling>
              Donate your offering.
            </Text>
            <PrimaryButton title="Donate (Coming Soon)" onPress={() => {}} disabled />
          </SectionCard>
        </View>

        <View style={styles.givingColumn}>
          <SectionCard title="Tithe" style={styles.givingCard}>
            <Text style={styles.bodyText} allowFontScaling>
              Tithe your 10%.
            </Text>
            <PrimaryButton title="Tithe (Coming Soon)" onPress={() => {}} disabled />
          </SectionCard>
        </View>
      </View>

      <SectionCard title="Settings">
        <Text style={styles.bodyText} allowFontScaling>
          Manage your directory privacy and app preferences.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel} allowFontScaling>
            Show email
          </Text>
          <Switch
            value={privacy.email}
            onValueChange={(v) => setPrivacy((p) => ({ ...p, email: v }))}
            disabled={!privacyLoaded}
            trackColor={{ false: colors.highlight, true: colors.button }}
            thumbColor={colors.background}
            accessibilityLabel="Toggle email visibility"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel} allowFontScaling>
            Show phone
          </Text>
          <Switch
            value={privacy.phone}
            onValueChange={(v) => setPrivacy((p) => ({ ...p, phone: v }))}
            disabled={!privacyLoaded}
            trackColor={{ false: colors.highlight, true: colors.button }}
            thumbColor={colors.background}
            accessibilityLabel="Toggle phone visibility"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel} allowFontScaling>
            Show address
          </Text>
          <Switch
            value={privacy.address}
            onValueChange={(v) => setPrivacy((p) => ({ ...p, address: v }))}
            disabled={!privacyLoaded}
            trackColor={{ false: colors.highlight, true: colors.button }}
            thumbColor={colors.background}
            accessibilityLabel="Toggle address visibility"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel} allowFontScaling>
            Enable Live Alerts
          </Text>
          <Switch
            value={liveAlertsEnabled}
            onValueChange={(v) => setLiveAlertsEnabledSafe(v)}
            disabled={liveAlertsBusy}
            trackColor={{ false: colors.highlight, true: colors.button }}
            thumbColor={colors.background}
            accessibilityLabel="Toggle live stream alerts"
          />
        </View>

        {!!statusText && (
          <Text style={styles.statusText} allowFontScaling>
            {statusText}
          </Text>
        )}
        {!!liveAlertNext && (
          <Text style={styles.statusText} allowFontScaling>
            Next alert: {liveAlertNext}
          </Text>
        )}
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  accountMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  givingRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  givingColumn: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 170,
  },
  givingCard: {
    flex: 1,
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
