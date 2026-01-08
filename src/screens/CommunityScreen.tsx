import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Alert,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { IconButton } from '../components/IconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';
import { churchDirectory, type DirectoryMember } from '../data/churchDirectory';
import { AvatarCircle } from '../components/AvatarCircle';
import { MaterialIcons } from '@expo/vector-icons';
import { defaultPrivacySettings, loadPrivacySettings, type PrivacySettings } from '../storage/privacyPrefs';
import { prayerWallEntries, type PrayerWallEntry } from '../data/prayerWall';
import { ministries, type Ministry } from '../data/ministries';
import { useAdmin } from '../state/AdminContext';
import {
  loadDirectoryOverride,
  loadMinistriesOverride,
  loadPrayersOverride,
  saveDirectoryOverride,
  saveMinistriesOverride,
  savePrayersOverride,
} from '../storage/communityAdminStore';

function formatPrayerAge(createdAt: string, now: Date) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return '';

  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) return `${Math.max(1, hours)}hr`;
  const days = Math.floor(hours / 24);
  return `${Math.max(1, days)}d`;
}

function sanitizePhoneForLinking(phone: string) {
  // Keep leading + and digits only
  return phone.replace(/(?!^)\D+/g, '').replace(/^00/, '+');
}

async function openEmail(email: string) {
  const url = `mailto:${encodeURIComponent(email)}`;
  await Linking.openURL(url);
}

async function openCall(phone: string) {
  const sanitized = sanitizePhoneForLinking(phone);
  const url = `tel:${sanitized}`;
  await Linking.openURL(url);
}

async function openText(phone: string) {
  const sanitized = sanitizePhoneForLinking(phone);
  const url = `sms:${sanitized}`;
  await Linking.openURL(url);
}

async function openMaps(address: string) {
  const query = encodeURIComponent(address);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  await Linking.openURL(url);
}

export function CommunityScreen() {
  const { adminEnabled, adminViewOnly } = useAdmin();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectoryMember | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [myPrivacy, setMyPrivacy] = useState<PrivacySettings>(defaultPrivacySettings);

  const [directoryMembers, setDirectoryMembers] = useState<DirectoryMember[]>(churchDirectory);
  const [ministryItems, setMinistryItems] = useState<Ministry[]>(ministries);

  const [prayers, setPrayers] = useState<PrayerWallEntry[]>(prayerWallEntries);
  const [addPrayerOpen, setAddPrayerOpen] = useState(false);
  const [prayerNameDraft, setPrayerNameDraft] = useState('');
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [selectedPrayerIds, setSelectedPrayerIds] = useState<Record<string, boolean>>({});

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState({ name: '', role: '', email: '', phone: '', address: '' });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Record<string, boolean>>({});

  const [addMinistryOpen, setAddMinistryOpen] = useState(false);
  const [ministryDraft, setMinistryDraft] = useState({
    name: '',
    summary: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    meetingSchedule: '',
  });
  const [editingMinistryId, setEditingMinistryId] = useState<string | null>(null);
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const loaded = await loadPrivacySettings();
      setMyPrivacy(loaded);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const dir = await loadDirectoryOverride();
      if (dir && dir.length) setDirectoryMembers(dir as DirectoryMember[]);

      const mins = await loadMinistriesOverride();
      if (mins && mins.length) setMinistryItems(mins);

      const pw = await loadPrayersOverride();
      if (pw && pw.length) setPrayers(pw);
    })();
  }, []);

  const filteredDirectory = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return directoryMembers;

    return directoryMembers.filter((m) => {
      const haystack = `${m.name} ${m.role}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, directoryMembers]);

  const selectedVisibility = useMemo(() => {
    return {
      email: myPrivacy.email && !!selected?.email,
      phone: myPrivacy.phone && !!selected?.phone,
      address: myPrivacy.address && !!selected?.address,
    };
  }, [myPrivacy, selected]);

  return (
    <ScreenContainer>
      {adminEnabled && adminViewOnly ? (
        <>
          {Object.values(selectedMemberIds).some(Boolean) && (
            <PrimaryButton
              title="Delete Selected"
              onPress={() => {
                const ids = Object.entries(selectedMemberIds)
                  .filter(([, v]) => !!v)
                  .map(([k]) => k);
                if (!ids.length) return;

                Alert.alert('Delete selected members?', `Count: ${ids.length}`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const next = directoryMembers.filter((x) => !ids.includes(x.id));
                      setDirectoryMembers(next);
                      await saveDirectoryOverride(next);
                      setSelectedMemberIds({});
                    },
                  },
                ]);
              }}
            />
          )}
          <SectionCard
            title="Directory"
            titleRight={
              <View style={styles.titleCountBadge} accessibilityRole="text">
                <Text style={styles.titleCountText} allowFontScaling>
                  {directoryMembers.length}
                </Text>
              </View>
            }
            headerRight={
              <IconButton
                icon="add"
                accessibilityLabel="Add directory member"
                onPress={() => {
                  setEditingMemberId(null);
                  setMemberDraft({ name: '', role: '', email: '', phone: '', address: '' });
                  setAddMemberOpen(true);
                }}
                iconColor={colors.primary}
                variant="outlined"
                iconSize={22}
                buttonSize={34}
              />
            }
          >
            <View style={styles.adminList}>
              {directoryMembers.slice(0, 12).map((m) => {
                const checked = !!selectedMemberIds[m.id];

                return (
                  <View key={m.id} style={styles.adminRow}>
                    <IconButton
                      icon={checked ? 'check-box' : 'check-box-outline-blank'}
                      accessibilityLabel={checked ? `Unselect ${m.name}` : `Select ${m.name}`}
                      onPress={() => setSelectedMemberIds((cur) => ({ ...cur, [m.id]: !cur[m.id] }))}
                      iconSize={22}
                      buttonSize={34}
                      variant="plain"
                    />

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`View ${m.name}`}
                      onPress={() => setSelected(m)}
                      style={({ pressed }) => [styles.adminRowMain, pressed && styles.pressed]}
                    >
                      <Text style={styles.adminRowText} allowFontScaling numberOfLines={1}>
                        {m.name} — {m.role}
                      </Text>
                    </Pressable>

                    <IconButton
                      icon="edit"
                      accessibilityLabel={`Edit directory member ${m.name}`}
                      onPress={() => {
                        setEditingMemberId(m.id);
                        setMemberDraft({
                          name: m.name,
                          role: m.role,
                          email: m.email ?? '',
                          phone: m.phone ?? '',
                          address: m.address ?? '',
                        });
                        setAddMemberOpen(true);
                      }}
                      iconSize={20}
                      buttonSize={34}
                      variant="outlined"
                    />

                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Delete directory member ${m.name}`}
                      onPress={() => {
                        Alert.alert('Delete member?', m.name, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const next = directoryMembers.filter((x) => x.id !== m.id);
                              setDirectoryMembers(next);
                              await saveDirectoryOverride(next);
                              setSelectedMemberIds((cur) => {
                                const copy = { ...cur };
                                delete copy[m.id];
                                return copy;
                              });
                            },
                          },
                        ]);
                      }}
                      iconSize={22}
                      buttonSize={34}
                      variant="outlined"
                    />
                  </View>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard
            title="Ministries"
            titleRight={
              <View style={styles.titleCountBadge} accessibilityRole="text">
                <Text style={styles.titleCountText} allowFontScaling>
                  {ministryItems.length}
                </Text>
              </View>
            }
            headerRight={
              <IconButton
                icon="add"
                accessibilityLabel="Add ministry"
                onPress={() => {
                  setEditingMinistryId(null);
                  setMinistryDraft({
                    name: '',
                    summary: '',
                    contactName: '',
                    contactRole: '',
                    contactEmail: '',
                    contactPhone: '',
                    meetingSchedule: '',
                  });
                  setAddMinistryOpen(true);
                }}
                iconColor={colors.primary}
                variant="outlined"
                iconSize={22}
                buttonSize={34}
              />
            }
          >
            <View style={styles.adminList}>
              {ministryItems.slice(0, 12).map((m) => {
                const checked = !!selectedMinistryIds[m.id];
                return (
                  <View key={m.id} style={styles.adminRow}>
                    <IconButton
                      icon={checked ? 'check-box' : 'check-box-outline-blank'}
                      accessibilityLabel={checked ? `Unselect ${m.name}` : `Select ${m.name}`}
                      onPress={() => setSelectedMinistryIds((cur) => ({ ...cur, [m.id]: !cur[m.id] }))}
                      iconSize={22}
                      buttonSize={34}
                      variant="plain"
                    />

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`View ${m.name}`}
                      onPress={() => setSelectedMinistry(m)}
                      style={({ pressed }) => [styles.adminRowMain, pressed && styles.pressed]}
                    >
                      <Text style={styles.adminRowText} allowFontScaling numberOfLines={1}>
                        {m.name}
                      </Text>
                    </Pressable>

                    <IconButton
                      icon="edit"
                      accessibilityLabel={`Edit ministry ${m.name}`}
                      onPress={() => {
                        setEditingMinistryId(m.id);
                        setMinistryDraft({
                          name: m.name,
                          summary: m.summary ?? '',
                          contactName: m.contactName ?? '',
                          contactRole: m.contactRole ?? '',
                          contactEmail: m.contactEmail ?? '',
                          contactPhone: m.contactPhone ?? '',
                          meetingSchedule: m.meetingSchedule ?? '',
                        });
                        setAddMinistryOpen(true);
                      }}
                      iconSize={20}
                      buttonSize={34}
                      variant="outlined"
                    />

                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Delete ministry ${m.name}`}
                      onPress={() => {
                        Alert.alert('Delete ministry?', m.name, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const next = ministryItems.filter((x) => x.id !== m.id);
                              setMinistryItems(next);
                              await saveMinistriesOverride(next);
                              setSelectedMinistryIds((cur) => {
                                const copy = { ...cur };
                                delete copy[m.id];
                                return copy;
                              });
                            },
                          },
                        ]);
                      }}
                      iconSize={22}
                      buttonSize={34}
                      variant="outlined"
                    />
                  </View>
                );
              })}
            </View>

            {Object.values(selectedMinistryIds).some(Boolean) && (
              <PrimaryButton
                title="Delete Selected"
                onPress={() => {
                  const ids = Object.entries(selectedMinistryIds)
                    .filter(([, v]) => !!v)
                    .map(([k]) => k);
                  if (!ids.length) return;

                  Alert.alert('Delete selected ministries?', `Count: ${ids.length}`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        const next = ministryItems.filter((x) => !ids.includes(x.id));
                        setMinistryItems(next);
                        await saveMinistriesOverride(next);
                        setSelectedMinistryIds({});
                      },
                    },
                  ]);
                }}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Prayer Wall"
            titleRight={
              <View style={styles.titleCountBadge} accessibilityRole="text">
                <Text style={styles.titleCountText} allowFontScaling>
                  {prayers.length}
                </Text>
              </View>
            }
            headerRight={
              <IconButton
                icon="add"
                accessibilityLabel="Add prayer name"
                onPress={() => {
                  setPrayerNameDraft('');
                  setAddPrayerOpen(true);
                }}
                iconColor={colors.primary}
                variant="outlined"
                iconSize={22}
                buttonSize={34}
              />
            }
          >
            <View style={styles.adminList}>
              {prayers.slice(0, 20).map((p) => {
                const checked = !!selectedPrayerIds[p.id];
                return (
                  <View key={p.id} style={styles.adminRow}>
                    <IconButton
                      icon={checked ? 'check-box' : 'check-box-outline-blank'}
                      accessibilityLabel={checked ? `Unselect ${p.name}` : `Select ${p.name}`}
                      onPress={() => setSelectedPrayerIds((cur) => ({ ...cur, [p.id]: !cur[p.id] }))}
                      iconSize={22}
                      buttonSize={34}
                      variant="plain"
                    />

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit prayer name ${p.name}`}
                      onPress={() => {
                        setEditingPrayerId(p.id);
                        setPrayerNameDraft(p.name);
                        setAddPrayerOpen(true);
                      }}
                      style={({ pressed }) => [styles.adminRowMain, pressed && styles.pressed]}
                    >
                      <Text style={styles.adminRowText} allowFontScaling numberOfLines={1}>
                        {p.name}
                      </Text>
                    </Pressable>

                    <IconButton
                      icon="edit"
                      accessibilityLabel={`Edit prayer name ${p.name}`}
                      onPress={() => {
                        setEditingPrayerId(p.id);
                        setPrayerNameDraft(p.name);
                        setAddPrayerOpen(true);
                      }}
                      iconSize={20}
                      buttonSize={34}
                      variant="outlined"
                    />

                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Remove prayer name ${p.name}`}
                      onPress={() => {
                        Alert.alert('Delete name?', p.name, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const next = prayers.filter((x) => x.id !== p.id);
                              setPrayers(next);
                              await savePrayersOverride(next);
                              setSelectedPrayerIds((cur) => {
                                const copy = { ...cur };
                                delete copy[p.id];
                                return copy;
                              });
                            },
                          },
                        ]);
                      }}
                      iconSize={20}
                      buttonSize={34}
                      variant="outlined"
                    />
                  </View>
                );
              })}
            </View>

            {Object.values(selectedPrayerIds).some(Boolean) && (
              <PrimaryButton
                title="Delete Selected"
                onPress={() => {
                  const ids = Object.entries(selectedPrayerIds)
                    .filter(([, v]) => !!v)
                    .map(([k]) => k);
                  if (!ids.length) return;

                  Alert.alert('Delete selected names?', `Count: ${ids.length}`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        const next = prayers.filter((x) => !ids.includes(x.id));
                        setPrayers(next);
                        await savePrayersOverride(next);
                        setSelectedPrayerIds({});
                      },
                    },
                  ]);
                }}
              />
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <View style={styles.directoryCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.directoryTitle} allowFontScaling>
                Church Directory
              </Text>
              {adminEnabled && (
                <IconButton
                  icon="add"
                  accessibilityLabel="Add directory member"
                  onPress={() => {
                    setMemberDraft({ name: '', role: '', email: '', phone: '', address: '' });
                    setAddMemberOpen(true);
                  }}
                  iconColor={colors.primary}
                  variant="outlined"
                  iconSize={22}
                  buttonSize={34}
                />
              )}
            </View>

            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={22} color={colors.text} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel="Search church directory"
              />
              {!!query && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery('')}
                  hitSlop={10}
                >
                  <MaterialIcons name="close" size={22} color={colors.text} />
                </Pressable>
              )}
            </View>

            <FlatList
              horizontal
              data={filteredDirectory}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.directoryList}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open directory profile for ${item.name}`}
                  onPress={() => setSelected(item)}
                  style={({ pressed }) => [styles.memberChip, pressed && styles.pressed]}
                >
                  <AvatarCircle name={item.name} size={52} />
                  <Text style={styles.memberName} allowFontScaling numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.memberRole} allowFontScaling numberOfLines={1}>
                    {item.role}
                  </Text>
                </Pressable>
              )}
            />

            <View style={styles.ministriesSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.directoryTitle} allowFontScaling>
                  Ministries
                </Text>
                {adminEnabled && (
                  <IconButton
                    icon="add"
                    accessibilityLabel="Add ministry"
                    onPress={() => {
                      setMinistryDraft({
                        name: '',
                        summary: '',
                        contactName: '',
                        contactRole: '',
                        contactEmail: '',
                        contactPhone: '',
                        meetingSchedule: '',
                      });
                      setAddMinistryOpen(true);
                    }}
                    iconColor={colors.primary}
                    variant="outlined"
                    iconSize={22}
                    buttonSize={34}
                  />
                )}
              </View>

              <FlatList
                horizontal
                data={ministryItems}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.directoryList}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ministry: ${item.name}`}
                    onPress={() => setSelectedMinistry(item)}
                    style={({ pressed }) => [styles.ministryChip, pressed && styles.pressed]}
                  >
                    <Text style={styles.ministryName} allowFontScaling numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.ministrySummary} allowFontScaling numberOfLines={2}>
                      {item.summary}
                    </Text>
                    {adminEnabled && (
                      <View style={styles.adminInlineAction}>
                        <IconButton
                          icon="delete"
                          accessibilityLabel={`Delete ministry ${item.name}`}
                          onPress={async () => {
                            const next = ministryItems.filter((m) => m.id !== item.id);
                            setMinistryItems(next);
                            await saveMinistriesOverride(next);
                          }}
                          iconSize={22}
                          buttonSize={34}
                          variant="outlined"
                        />
                      </View>
                    )}
                  </Pressable>
                )}
              />
            </View>
          </View>

          <SectionCard
            title="Prayer Wall"
            headerRight={
              <IconButton
                icon="add"
                accessibilityLabel="Add prayer name"
                onPress={() => {
                  setPrayerNameDraft('');
                  setEditingPrayerId(null);
                  setAddPrayerOpen(true);
                }}
                iconColor={colors.primary}
                variant="outlined"
                iconSize={22}
                buttonSize={34}
              />
            }
          >
            <Text style={styles.bodyText} allowFontScaling>
              Names in need of prayer...
            </Text>

            <View style={styles.prayerListWrap}>
              {prayers.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.prayerRow, index === 0 && styles.prayerRowFirst]}
                  accessibilityRole="text"
                  accessibilityLabel={`Prayer name: ${item.name}`}
                >
                  <Text style={styles.prayerName} allowFontScaling numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.prayerRight}>
                    <View style={styles.prayerAgeBadge} accessibilityRole="text">
                      <Text style={styles.prayerAgeText} allowFontScaling>
                        {formatPrayerAge(item.createdAt, new Date())}
                      </Text>
                    </View>
                    {adminEnabled && (
                      <IconButton
                        icon="delete"
                        accessibilityLabel={`Remove prayer name ${item.name}`}
                        onPress={async () => {
                          const next = prayers.filter((p) => p.id !== item.id);
                          setPrayers(next);
                          await savePrayersOverride(next);
                        }}
                        iconSize={20}
                        buttonSize={34}
                        variant="outlined"
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        </>
      )}

      <Modal
        visible={addPrayerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddPrayerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  Add to Prayer Wall
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  Enter a name.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setAddPrayerOpen(false)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              value={prayerNameDraft}
              onChangeText={setPrayerNameDraft}
              style={styles.addPrayerInput}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Prayer name"
            />

            <View style={styles.addPrayerActions}>
              <PrimaryButton
                title="Cancel"
                onPress={() => setAddPrayerOpen(false)}
              />
              <PrimaryButton
                title="Save"
                onPress={() => {
                  const name = prayerNameDraft.trim();
                  if (!name) return;

                  if (editingPrayerId) {
                    setPrayers((current) => {
                      const next = current.map((p) => (p.id === editingPrayerId ? { ...p, name } : p));
                      savePrayersOverride(next).catch(() => {});
                      return next;
                    });
                  } else {
                    const createdAt = new Date().toISOString();
                    setPrayers((current) => {
                      const next = [{ id: `pw-${Date.now()}`, name, createdAt }, ...current];
                      savePrayersOverride(next).catch(() => {});
                      return next;
                    });
                  }

                  setEditingPrayerId(null);
                  setAddPrayerOpen(false);
                }}
                disabled={!prayerNameDraft.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addMemberOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMemberOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {editingMemberId ? 'Edit Directory Member' : 'Add Directory Member'}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  Add/edit/remove directory members.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setAddMemberOpen(false)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              value={memberDraft.name}
              onChangeText={(t) => setMemberDraft((d) => ({ ...d, name: t }))}
              style={styles.addPrayerInput}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Member name"
            />
            <TextInput
              value={memberDraft.role}
              onChangeText={(t) => setMemberDraft((d) => ({ ...d, role: t }))}
              style={styles.addPrayerInput}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Member role"
            />

            <View style={styles.addPrayerActions}>
              <PrimaryButton title="Cancel" onPress={() => setAddMemberOpen(false)} />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  const name = memberDraft.name.trim();
                  const role = memberDraft.role.trim();
                  if (!name || !role) return;

                  if (editingMemberId) {
                    const next = directoryMembers.map((m) =>
                      m.id === editingMemberId
                        ? ({
                            ...m,
                            name,
                            role,
                            email: memberDraft.email ?? '',
                            phone: memberDraft.phone ?? '',
                            address: memberDraft.address ?? '',
                          } as DirectoryMember)
                        : m
                    );
                    setDirectoryMembers(next);
                    await saveDirectoryOverride(next);
                  } else {
                    const next = [
                      {
                        id: `m-admin-${Date.now()}`,
                        name,
                        role,
                        email: memberDraft.email ?? '',
                        phone: memberDraft.phone ?? '',
                        address: memberDraft.address ?? '',
                      } as DirectoryMember,
                      ...directoryMembers,
                    ];
                    setDirectoryMembers(next);
                    await saveDirectoryOverride(next);
                  }

                  setEditingMemberId(null);
                  setAddMemberOpen(false);
                }}
                disabled={!memberDraft.name.trim() || !memberDraft.role.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addMinistryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMinistryOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {editingMinistryId ? 'Edit Ministry' : 'Add Ministry'}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  Add/edit/remove ministries.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setAddMinistryOpen(false)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              value={ministryDraft.name}
              onChangeText={(t) => setMinistryDraft((d) => ({ ...d, name: t }))}
              style={styles.addPrayerInput}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel="Ministry name"
            />
            <TextInput
              value={ministryDraft.summary}
              onChangeText={(t) => setMinistryDraft((d) => ({ ...d, summary: t }))}
              style={styles.addPrayerInput}
              accessibilityLabel="Ministry summary"
            />

            <View style={styles.addPrayerActions}>
              <PrimaryButton title="Cancel" onPress={() => setAddMinistryOpen(false)} />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  const name = ministryDraft.name.trim();
                  if (!name) return;

                  if (editingMinistryId) {
                    const updated = ministryItems.map((m) =>
                      m.id === editingMinistryId
                        ? ({
                            ...m,
                            name,
                            summary: ministryDraft.summary.trim(),
                            contactName: ministryDraft.contactName.trim(),
                            contactRole: ministryDraft.contactRole.trim(),
                            contactEmail: ministryDraft.contactEmail.trim(),
                            contactPhone: ministryDraft.contactPhone.trim(),
                            meetingSchedule: ministryDraft.meetingSchedule.trim(),
                          } as Ministry)
                        : m
                    );
                    setMinistryItems(updated);
                    await saveMinistriesOverride(updated);
                  } else {
                    const next: Ministry = {
                      id: `min-admin-${Date.now()}`,
                      name,
                      summary: ministryDraft.summary.trim(),
                      contactName: ministryDraft.contactName.trim(),
                      contactRole: ministryDraft.contactRole.trim(),
                      contactEmail: ministryDraft.contactEmail.trim(),
                      contactPhone: ministryDraft.contactPhone.trim(),
                      meetingSchedule: ministryDraft.meetingSchedule.trim(),
                      members: [],
                    };

                    const updated = [next, ...ministryItems];
                    setMinistryItems(updated);
                    await saveMinistriesOverride(updated);
                  }

                  setEditingMinistryId(null);
                  setAddMinistryOpen(false);
                }}
                disabled={!ministryDraft.name.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {selected?.name}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  {selected?.role}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close profile"
                onPress={() => setSelected(null)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Email"
                onPress={() => selected && selectedVisibility.email && openEmail(selected.email)}
                disabled={!selectedVisibility.email}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.email && styles.disabled]}
              >
                <MaterialIcons name="email" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Email
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call"
                onPress={() => selected && selectedVisibility.phone && openCall(selected.phone)}
                disabled={!selectedVisibility.phone}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.phone && styles.disabled]}
              >
                <MaterialIcons name="call" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Call
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Text"
                onPress={() => selected && selectedVisibility.phone && openText(selected.phone)}
                disabled={!selectedVisibility.phone}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.phone && styles.disabled]}
              >
                <MaterialIcons name="message" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Text
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Address"
                onPress={() => selected && selectedVisibility.address && openMaps(selected.address)}
                disabled={!selectedVisibility.address}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.address && styles.disabled]}
              >
                <MaterialIcons name="location-on" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Address
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedMinistry}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMinistry(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {selectedMinistry?.name}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  {selectedMinistry?.meetingSchedule}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close ministry"
                onPress={() => setSelectedMinistry(null)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.bodyText} allowFontScaling>
              {selectedMinistry?.summary}
            </Text>

            <View style={styles.ministryMetaBox}>
              <Text style={styles.ministryMetaTitle} allowFontScaling>
                Contact
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactName} • {selectedMinistry?.contactRole}
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactEmail}
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactPhone}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Email contact"
                onPress={() => selectedMinistry && openEmail(selectedMinistry.contactEmail)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="email" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Email
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call contact"
                onPress={() => selectedMinistry && openCall(selectedMinistry.contactPhone)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="call" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Call
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Text contact"
                onPress={() => selectedMinistry && openText(selectedMinistry.contactPhone)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="message" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Text
                </Text>
              </Pressable>
            </View>

            <View style={styles.ministryMetaBox}>
              <Text style={styles.ministryMetaTitle} allowFontScaling>
                Members
              </Text>
              {selectedMinistry?.members.map((m) => (
                <Text key={m} style={styles.ministryMetaLine} allowFontScaling>
                  {m}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  directoryCard: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  directoryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  titleCountBadge: {
    backgroundColor: colors.text,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCountText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  directoryList: {
    gap: 12,
    paddingRight: 6,
  },
  ministriesSection: {
    gap: 10,
  },
  ministryChip: {
    width: 200,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  ministryName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  ministrySummary: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  memberChip: {
    width: 150,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  memberRole: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  adminInlineAction: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
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
  adminList: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  adminRowMain: {
    flex: 1,
    paddingVertical: 6,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopColor: colors.primary,
    borderTopWidth: 1,
  },
  adminRowText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  prayerListWrap: {
    maxHeight: 220,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopColor: colors.primary,
    borderTopWidth: 1,
  },
  prayerRowFirst: {
    borderTopWidth: 0,
  },
  prayerName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  prayerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prayerAgeBadge: {
    marginLeft: 10,
    backgroundColor: colors.text,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  prayerAgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  addPrayerInput: {
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
  addPrayerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  ministryMetaBox: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  ministryMetaTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  ministryMetaLine: {
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
  modalName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  modalRole: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionIcon: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
