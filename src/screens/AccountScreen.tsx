import { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AvatarCircle } from '../components/AvatarCircle';
import { IconButton } from '../components/IconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { churchDirectory } from '../data/churchDirectory';
import { MaterialIcons } from '@expo/vector-icons';
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

function passwordStrengthScore(password: string) {
  const p = password ?? '';
  if (!p) return 0;

  let score = 0;
  if (p.length >= 8) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score += 1;
  return Math.min(3, score);
}

function passwordStrengthLabel(score: number) {
  if (score <= 0) return '';
  if (score === 1) return 'Weak';
  if (score === 2) return 'Medium';
  return 'Strong';
}

export function AccountScreen() {
  const directoryMe = useMemo(() => churchDirectory.find((m) => m.id === 'm-001'), []);
  const defaultAvatarMode = directoryMe?.photo ? 'directory' : 'initials';

  const [profile, setProfile] = useState(() => ({
    name: directoryMe?.name ?? 'Moriah Member',
    email: directoryMe?.email ?? 'member@moriahfaithconnect.org',
    phone: directoryMe?.phone ?? '',
    address: directoryMe?.address ?? '',
    avatarMode: defaultAvatarMode as 'directory' | 'initials' | 'uploaded',
    avatarUri: '' as string,
    password: '',
    passwordConfirm: '',
  }));

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [editError, setEditError] = useState('');

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
      <SectionCard
        title="Account"
        headerRight={
          <IconButton
            icon="edit"
            accessibilityLabel="Edit account"
            onPress={() => {
              setEditError('');
              setDraft(profile);
              setEditOpen(true);
            }}
            iconColor={colors.primary}
            variant="outlined"
            iconSize={22}
            buttonSize={34}
          />
        }
      >
        <View style={styles.accountRow} accessibilityRole="summary" accessibilityLabel="Account information">
          <AvatarCircle
            name={profile.name}
            size={72}
            source={
              profile.avatarMode === 'uploaded' && profile.avatarUri
                ? { uri: profile.avatarUri }
                : profile.avatarMode === 'directory'
                  ? directoryMe?.photo
                  : undefined
            }
          />
          <View style={styles.accountInfo}>
            <Text style={styles.accountName} allowFontScaling numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.accountMeta} allowFontScaling numberOfLines={1}>
              {profile.email}
            </Text>
            {!!profile.address && (
              <Text style={styles.accountMeta} allowFontScaling numberOfLines={1}>
                {profile.address}
              </Text>
            )}
          </View>
        </View>
      </SectionCard>

      <View style={styles.givingRow}>
        <View style={styles.givingColumn}>
          <SectionCard title="Donate" style={styles.givingCard}>
            <Text style={styles.bodyText} allowFontScaling>
              Donate your offering.
            </Text>
            <PrimaryButton title="Donate" onPress={() => {}} disabled />
          </SectionCard>
        </View>

        <View style={styles.givingColumn}>
          <SectionCard title="Tithe" style={styles.givingCard}>
            <Text style={styles.bodyText} allowFontScaling>
              Tithe your 10%.
            </Text>
            <PrimaryButton title="Tithe" onPress={() => {}} disabled />
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

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  Edit Account
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Update your info.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setEditOpen(false)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.avatarEditRow} accessibilityRole="summary">
              <AvatarCircle
                name={draft.name}
                size={72}
                source={
                  draft.avatarMode === 'uploaded' && draft.avatarUri
                    ? { uri: draft.avatarUri }
                    : draft.avatarMode === 'directory'
                      ? directoryMe?.photo
                      : undefined
                }
              />

              <View style={styles.avatarOptions}>
                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Avatar
                </Text>
                <View style={styles.avatarToggleWithUploadRow}>
                  <View style={[styles.avatarToggleRow, styles.avatarToggleRowFlex]}>
                    <Text style={styles.avatarToggleLabel} allowFontScaling>
                      Use directory photo
                    </Text>
                    <Switch
                      value={draft.avatarMode === 'directory'}
                      onValueChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          avatarMode: v && directoryMe?.photo ? 'directory' : d.avatarMode === 'directory' ? 'initials' : d.avatarMode,
                        }))
                      }
                      disabled={!directoryMe?.photo}
                      trackColor={{ false: colors.highlight, true: colors.button }}
                      thumbColor={colors.background}
                      accessibilityLabel="Toggle directory photo avatar"
                    />
                  </View>

                  <IconButton
                    icon="file-upload"
                    accessibilityLabel="Upload photo"
                    onPress={async () => {
                      setEditError('');
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) {
                        setEditError('Photo permission is off. Please enable Photos access in Settings.');
                        try {
                          await Linking.openSettings();
                        } catch {
                          // If opening settings fails, the message above still guides the user.
                        }
                        return;
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                      });

                      if (result.canceled) return;
                      const uri = result.assets?.[0]?.uri;
                      if (!uri) return;

                      setDraft((d) => ({ ...d, avatarMode: 'uploaded', avatarUri: uri }));
                    }}
                    iconColor={colors.primary}
                    variant="outlined"
                    iconSize={24}
                    buttonSize={36}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel} allowFontScaling>
                Email
              </Text>
              <TextInput
                value={draft.email}
                onChangeText={(v) => setDraft((d) => ({ ...d, email: v }))}
                placeholder="Email"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel} allowFontScaling>
                Phone
              </Text>
              <TextInput
                value={draft.phone}
                onChangeText={(v) => setDraft((d) => ({ ...d, phone: v }))}
                placeholder="Phone"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                accessibilityLabel="Phone"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel} allowFontScaling>
                Address
              </Text>
              <TextInput
                value={draft.address}
                onChangeText={(v) => setDraft((d) => ({ ...d, address: v }))}
                placeholder="Address"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Address"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel} allowFontScaling>
                Password
              </Text>
              <TextInput
                value={draft.password}
                onChangeText={(v) => setDraft((d) => ({ ...d, password: v }))}
                placeholder="New password"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Password"
              />
            </View>

            <View style={styles.passwordStrengthRow}>
              <Text style={styles.passwordStrengthLabel} allowFontScaling>
                {draft.password ? `Strength: ${passwordStrengthLabel(passwordStrengthScore(draft.password))}` : ''}
              </Text>
              <View style={styles.passwordStrengthBars}>
                {Array.from({ length: 3 }).map((_, idx) => {
                  const active = idx < passwordStrengthScore(draft.password);
                  return (
                    <View
                      key={idx}
                      style={[styles.passwordStrengthBar, active && styles.passwordStrengthBarActive]}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel} allowFontScaling>
                Confirm Password
              </Text>
              <TextInput
                value={draft.passwordConfirm}
                onChangeText={(v) => setDraft((d) => ({ ...d, passwordConfirm: v }))}
                placeholder="Confirm password"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Confirm password"
              />
            </View>

            {((draft.password && draft.passwordConfirm && draft.password !== draft.passwordConfirm) || !!editError) && (
              <Text style={styles.editErrorText} allowFontScaling>
                {editError || 'Passwords do not match.'}
              </Text>
            )}

            <View style={styles.modalActions}>
              <PrimaryButton
                title="Cancel"
                onPress={() => {
                  setDraft(profile);
                  setEditOpen(false);
                }}
              />
              <PrimaryButton
                title="Save"
                onPress={() => {
                  if (draft.password && draft.password !== draft.passwordConfirm) return;
                  setProfile(draft);
                  setEditOpen(false);
                }}
                disabled={!!draft.password && draft.password !== draft.passwordConfirm}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderColor: colors.primary,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarOptions: {
    flex: 1,
    gap: 8,
  },
  avatarToggleRow: {
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
  avatarToggleRowFlex: {
    flex: 1,
  },
  avatarToggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarToggleWithUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  modalInput: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editErrorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  passwordStrengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  passwordStrengthLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: 6,
  },
  passwordStrengthBar: {
    width: 22,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  passwordStrengthBarActive: {
    backgroundColor: colors.button,
  },
});
