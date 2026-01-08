import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { useAdmin } from '../state/AdminContext';
import {
  loadArchiveCategories,
  loadArchiveItems,
  saveArchiveCategories,
  saveArchiveItems,
  type ArchiveCategory,
  type ArchiveItem,
  type ArchiveMedia,
} from '../storage/watchAdminStore';

const defaultArchiveCategories: ArchiveCategory[] = [
  {
    id: 'sunday-sermons',
    title: 'Sunday Sermons',
    description: 'Weekly messages and series.',
  },
  {
    id: 'guest-ministry',
    title: 'Guest Ministry',
    description: 'Special guests and visiting speakers.',
  },
  {
    id: 'youth-events',
    title: 'Youth Events',
    description: 'Youth services and special events.',
  },
];

const WEBSITE_URL = 'https://www.mmmbc.com/';

export function WatchScreen() {
  const { adminEnabled, adminViewOnly } = useAdmin();
  const [categories, setCategories] = useState<ArchiveCategory[]>(defaultArchiveCategories);
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [adminDraft, setAdminDraft] = useState({ title: '', description: '' });

  const [isRecording, setIsRecording] = useState(false);
  const recordPulse = useRef(new Animated.Value(0)).current;
  const [liveConnections, setLiveConnections] = useState({
    facebook: false,
    instagram: false,
    youtube: false,
    web: false,
  });

  type ConnectionKey = keyof typeof liveConnections;
  const connectionMeta: Record<ConnectionKey, { title: string; icon: any }> = {
    facebook: { title: 'Facebook', icon: require('../../assets/icons/facebookIcon.png') },
    instagram: { title: 'Instagram', icon: require('../../assets/icons/instagramIcon.png') },
    youtube: { title: 'YouTube', icon: require('../../assets/icons/youtubeIcon.png') },
    web: { title: 'Website', icon: require('../../assets/icon.png') },
  };

  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [activeConnectionKey, setActiveConnectionKey] = useState<ConnectionKey | null>(null);
  const [signInDraft, setSignInDraft] = useState({ username: '', password: '' });
  const [websiteCheck, setWebsiteCheck] = useState<
    | { state: 'idle' }
    | { state: 'running' }
    | { state: 'ok'; httpStatus: number; durationMs: number; checkedAtIso: string }
    | { state: 'error'; message: string; durationMs?: number; checkedAtIso: string }
  >({ state: 'idle' });

  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [categoryManageOpen, setCategoryManageOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [itemEditOpen, setItemEditOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState({ title: '', details: '', location: '' });
  const [itemDraftMedia, setItemDraftMedia] = useState<ArchiveMedia[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await loadArchiveCategories();
      if (stored && stored.length) setCategories(stored);

      const storedItems = await loadArchiveItems();
      if (storedItems && storedItems.length) setArchiveItems(storedItems);
    })();
  }, []);

  useEffect(() => {
    if (!isRecording) {
      recordPulse.stopAnimation();
      recordPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recordPulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(recordPulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [isRecording, recordPulse]);

  const adminSave = async (next: ArchiveCategory[]) => {
    setCategories(next);
    await saveArchiveCategories(next);
  };

  const adminSaveItems = async (next: ArchiveItem[]) => {
    setArchiveItems(next);
    await saveArchiveItems(next);
  };

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  const itemsForSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return archiveItems
      .filter((i) => i.categoryId === selectedCategoryId)
      .sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());
  }, [archiveItems, selectedCategoryId]);

  const openItemEditorForNewUpload = async (categoryId: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const assets = (result as any).assets as Array<{ uri: string; name?: string; mimeType?: string }> | undefined;
    const picked = (assets ?? [])
      .filter((a) => !!a?.uri)
      .map((a) => ({
        id: `media-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        uri: a.uri,
        name: a.name ?? 'file',
        mimeType: a.mimeType,
      } satisfies ArchiveMedia));

    if (!picked.length) return;

    setSelectedCategoryId(categoryId);
    setEditingItemId(null);
    setItemDraft({ title: '', details: '', location: '' });
    setItemDraftMedia(picked);
    setItemEditOpen(true);
  };

  const toggleConnection = (key: keyof typeof liveConnections) => {
    setLiveConnections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openConnectionModal = (key: ConnectionKey) => {
    setActiveConnectionKey(key);
    setConnectionModalOpen(true);
    setSignInDraft({ username: '', password: '' });
  };

  const closeConnectionModal = () => {
    setConnectionModalOpen(false);
    setActiveConnectionKey(null);
    setSignInDraft({ username: '', password: '' });
  };

  const runWebsiteCheck = async () => {
    const startedAt = Date.now();
    const checkedAtIso = new Date().toISOString();
    setWebsiteCheck({ state: 'running' });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(WEBSITE_URL, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);

      const durationMs = Date.now() - startedAt;
      if (response.ok) {
        setWebsiteCheck({ state: 'ok', httpStatus: response.status, durationMs, checkedAtIso });
        setLiveConnections((prev) => ({ ...prev, web: true }));
      } else {
        const message = `HTTP ${response.status}`;
        setWebsiteCheck({ state: 'error', message, durationMs, checkedAtIso });
        setLiveConnections((prev) => ({ ...prev, web: false }));
      }
    } catch (e: any) {
      const durationMs = Date.now() - startedAt;
      const message = typeof e?.message === 'string' ? e.message : 'Connection failed';
      setWebsiteCheck({ state: 'error', message, durationMs, checkedAtIso });
      setLiveConnections((prev) => ({ ...prev, web: false }));
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.containerTight}>
      <View style={styles.liveCardWrap} accessibilityRole="summary">
        <View style={styles.liveRow}>
          <View style={styles.liveTextCol}>
            <View style={styles.liveTextTop}>
              <View style={styles.liveTitleRow}>
                <Text style={styles.liveTitle} allowFontScaling>
                  Go Live!
                </Text>

                {adminEnabled && adminViewOnly && (
                  <View style={styles.recordGroup}>
                    <View style={styles.recordButtonWrap}>
                      {isRecording && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.recordPulseHalo,
                            {
                              opacity: recordPulse.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.25, 0.6],
                              }),
                              transform: [
                                {
                                  scale: recordPulse.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.22],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                      )}

                      <IconButton
                        icon={isRecording ? 'stop' : 'fiber-manual-record'}
                        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
                        onPress={() => setIsRecording((v) => !v)}
                        iconSize={22}
                        buttonSize={34}
                        variant="outlined"
                        iconColor={isRecording ? colors.danger : colors.text}
                        outlineColor={isRecording ? colors.danger : undefined}
                      />
                    </View>
                    <Text style={styles.recordLabel} allowFontScaling pointerEvents="none">
                      {isRecording ? 'Recording' : 'Record'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {adminEnabled && adminViewOnly && (
              <View style={styles.liveAdminControls}>
                <Text style={styles.liveAdminSubLabel} allowFontScaling>
                  Connections
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.socialRowBottom}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open Facebook connection"
                    onPress={() => openConnectionModal('facebook')}
                    style={({ pressed }) => [styles.socialTile, pressed && styles.archiveCardPressed]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Image
                        source={connectionMeta.facebook.icon}
                        style={styles.socialIconImage}
                        accessibilityLabel="Facebook"
                      />
                      <View
                        style={[
                          styles.statusDot,
                          liveConnections.facebook ? styles.statusDotOn : styles.statusDotOff,
                        ]}
                      />
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open Instagram connection"
                    onPress={() => openConnectionModal('instagram')}
                    style={({ pressed }) => [styles.socialTile, pressed && styles.archiveCardPressed]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Image
                        source={connectionMeta.instagram.icon}
                        style={styles.socialIconImage}
                        accessibilityLabel="Instagram"
                      />
                      <View
                        style={[
                          styles.statusDot,
                          liveConnections.instagram ? styles.statusDotOn : styles.statusDotOff,
                        ]}
                      />
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open YouTube connection"
                    onPress={() => openConnectionModal('youtube')}
                    style={({ pressed }) => [styles.socialTile, pressed && styles.archiveCardPressed]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Image
                        source={connectionMeta.youtube.icon}
                        style={styles.socialIconImage}
                        accessibilityLabel="YouTube"
                      />
                      <View
                        style={[
                          styles.statusDot,
                          liveConnections.youtube ? styles.statusDotOn : styles.statusDotOff,
                        ]}
                      />
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open Website connection"
                    onPress={() => openConnectionModal('web')}
                    style={({ pressed }) => [styles.socialTile, pressed && styles.archiveCardPressed]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Image
                        source={connectionMeta.web.icon}
                        style={styles.socialIconImage}
                        accessibilityLabel="Website"
                      />
                      <View
                        style={[styles.statusDot, liveConnections.web ? styles.statusDotOn : styles.statusDotOff]}
                      />
                    </View>
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.liveThumbFrame}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.liveThumbImage}
              accessibilityLabel="Live stream thumbnail"
            />
          </View>
        </View>
      </View>

      <SectionCard
        title={adminViewOnly ? 'Sermon Archive' : 'Sermon Archive'}
        headerRight={
          adminEnabled && adminViewOnly ? (
            <IconButton
              icon="add"
              accessibilityLabel="Add sermon archive category"
              onPress={() => {
                setEditingCategoryId(null);
                setAdminDraft({ title: '', description: '' });
                setAdminAddOpen(true);
              }}
              iconColor={colors.primary}
              variant="outlined"
              iconSize={22}
              buttonSize={34}
            />
          ) : undefined
        }
      >
        <Text style={styles.bodyText} allowFontScaling>
          {adminViewOnly ? 'Manage sermon archive categories.' : 'Browse by category.'}
        </Text>

        <View style={styles.archiveList}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={`${category.title}. Coming soon.`}
              onPress={() => {
                if (adminEnabled && adminViewOnly) {
                  setSelectedCategoryId(category.id);
                  setCategoryManageOpen(true);
                }
              }}
              style={({ pressed }) => [styles.archiveCard, pressed && styles.archiveCardPressed]}
            >
              {adminEnabled && adminViewOnly && (
                <View style={styles.archiveAdminRow}>
                  <IconButton
                    icon="file-upload"
                    accessibilityLabel={`Upload to ${category.title}`}
                    onPress={() => openItemEditorForNewUpload(category.id)}
                    iconSize={22}
                    buttonSize={34}
                    variant="outlined"
                  />

                  <IconButton
                    icon="edit"
                    accessibilityLabel={`Edit category ${category.title}`}
                    onPress={() => {
                      setEditingCategoryId(category.id);
                      setAdminDraft({ title: category.title, description: category.description });
                      setAdminAddOpen(true);
                    }}
                    iconSize={22}
                    buttonSize={34}
                    variant="outlined"
                  />

                  <IconButton
                    icon="delete"
                    accessibilityLabel={`Delete category ${category.title}`}
                    onPress={() => {
                      Alert.alert('Delete category?', category.title, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            const nextCategories = categories.filter((c) => c.id !== category.id);
                            await adminSave(nextCategories);

                            const nextItems = archiveItems.filter((i) => i.categoryId !== category.id);
                            await adminSaveItems(nextItems);

                            if (selectedCategoryId === category.id) {
                              setSelectedCategoryId(null);
                              setCategoryManageOpen(false);
                            }
                          },
                        },
                      ]);
                    }}
                    iconSize={22}
                    buttonSize={34}
                    variant="outlined"
                  />
                </View>
              )}
              <Text style={styles.archiveTitle} allowFontScaling>
                {category.title}
              </Text>
              <Text style={styles.archiveDescription} allowFontScaling>
                {category.description}
              </Text>
              <Text style={styles.archiveMeta} allowFontScaling>
                Coming soon
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <Modal
        visible={connectionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeConnectionModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  {activeConnectionKey ? `${connectionMeta[activeConnectionKey].title} Connection` : 'Connection'}
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  {activeConnectionKey
                    ? liveConnections[activeConnectionKey]
                      ? 'Connected'
                      : 'Not connected'
                    : ''}
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close"
                onPress={closeConnectionModal}
                iconSize={22}
                buttonSize={36}
              />
            </View>

            <View style={styles.modalDivider} />

            {activeConnectionKey && (
              <View style={styles.connectionHeaderRow}>
                <View style={styles.connectionIconWrap}>
                  <Image
                    source={connectionMeta[activeConnectionKey].icon}
                    style={styles.connectionIcon}
                    accessibilityLabel={connectionMeta[activeConnectionKey].title}
                  />
                </View>
                <Text style={styles.bodyText} allowFontScaling>
                  {connectionMeta[activeConnectionKey].title}
                </Text>
              </View>
            )}

            {activeConnectionKey && activeConnectionKey !== 'web' && (
              <>
                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Username / Email
                </Text>
                <TextInput
                  value={signInDraft.username}
                  onChangeText={(t) => setSignInDraft((d) => ({ ...d, username: t }))}
                  style={styles.modalInput}
                  accessibilityLabel="Username"
                  autoCapitalize="none"
                />

                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Password
                </Text>
                <TextInput
                  value={signInDraft.password}
                  onChangeText={(t) => setSignInDraft((d) => ({ ...d, password: t }))}
                  style={styles.modalInput}
                  accessibilityLabel="Password"
                  secureTextEntry
                />
              </>
            )}

            {activeConnectionKey === 'web' && (
              <View style={styles.websiteDebugWrap}>
                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Website URL
                </Text>
                <Text style={styles.websiteUrl} allowFontScaling>
                  {WEBSITE_URL}
                </Text>

                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Connection Check
                </Text>
                {websiteCheck.state === 'idle' && (
                  <Text style={styles.websiteDebugText} allowFontScaling>
                    Run a check to see if the app can reach the website.
                  </Text>
                )}
                {websiteCheck.state === 'running' && (
                  <Text style={styles.websiteDebugText} allowFontScaling>
                    Checking...
                  </Text>
                )}
                {websiteCheck.state === 'ok' && (
                  <Text style={styles.websiteDebugText} allowFontScaling>
                    OK {websiteCheck.httpStatus} in {websiteCheck.durationMs}ms
                  </Text>
                )}
                {websiteCheck.state === 'error' && (
                  <Text style={styles.websiteDebugText} allowFontScaling>
                    Error: {websiteCheck.message}
                  </Text>
                )}
                {websiteCheck.state !== 'idle' && websiteCheck.state !== 'running' && (
                  <Text style={styles.websiteDebugText} allowFontScaling>
                    Checked: {websiteCheck.checkedAtIso}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.modalActionRow}>
              {activeConnectionKey === 'web' ? (
                <PrimaryButton title="Run Website Check" onPress={runWebsiteCheck} />
              ) : (
                <PrimaryButton
                  title={activeConnectionKey && liveConnections[activeConnectionKey] ? 'Disconnect' : 'Sign In'}
                  onPress={() => {
                    if (!activeConnectionKey) return;
                    toggleConnection(activeConnectionKey);
                  }}
                />
              )}
              <PrimaryButton title="Close" onPress={closeConnectionModal} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={adminAddOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminAddOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  {editingCategoryId ? 'Edit Archive Category' : 'Add Archive Category'}
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Add/edit sermon archive sections.
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close"
                onPress={() => {
                  setAdminAddOpen(false);
                  setEditingCategoryId(null);
                }}
                iconSize={22}
                buttonSize={36}
              />
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Title
            </Text>
            <TextInput
              value={adminDraft.title}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, title: t }))}
              style={styles.modalInput}
              accessibilityLabel="Category title"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Description
            </Text>
            <TextInput
              value={adminDraft.description}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, description: t }))}
              style={styles.modalTextArea}
              multiline
              accessibilityLabel="Category description"
            />

            <View style={styles.modalActionRow}>
              <PrimaryButton
                title="Cancel"
                onPress={() => {
                  setAdminAddOpen(false);
                  setEditingCategoryId(null);
                }}
              />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  const title = adminDraft.title.trim();
                  const description = adminDraft.description.trim();
                  if (!title) return;

                  if (editingCategoryId) {
                    const updated = categories.map((c) =>
                      c.id === editingCategoryId ? { ...c, title, description } : c
                    );
                    await adminSave(updated);
                  } else {
                    const next: ArchiveCategory = {
                      id: `cat-${Date.now()}`,
                      title,
                      description,
                    };
                    await adminSave([next, ...categories]);
                  }

                  setAdminAddOpen(false);
                  setEditingCategoryId(null);
                }}
                disabled={!adminDraft.title.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryManageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryManageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling numberOfLines={1}>
                  {selectedCategory?.title ?? 'Category'}
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Upload and manage sermon files.
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <IconButton
                  icon="file-upload"
                  accessibilityLabel="Upload files"
                  onPress={() => {
                    if (!selectedCategoryId) return;
                    openItemEditorForNewUpload(selectedCategoryId);
                  }}
                  iconSize={22}
                  buttonSize={36}
                />
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setCategoryManageOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {itemsForSelectedCategory.length === 0 ? (
                <Text style={styles.bodyText} allowFontScaling>
                  No uploaded items yet.
                </Text>
              ) : (
                itemsForSelectedCategory.map((item) => (
                  <View key={item.id} style={styles.archiveItemRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${item.title}`}
                      onPress={() => {
                        setEditingItemId(item.id);
                        setItemDraft({ title: item.title, details: item.details, location: item.location });
                        setItemDraftMedia(item.media ?? []);
                        setItemEditOpen(true);
                      }}
                      style={styles.archiveItemMain}
                    >
                      <Text style={styles.archiveItemTitle} allowFontScaling numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!!item.location && (
                        <Text style={styles.archiveItemMeta} allowFontScaling numberOfLines={1}>
                          {item.location}
                        </Text>
                      )}
                      <Text style={styles.archiveItemMeta} allowFontScaling numberOfLines={1}>
                        Files: {item.media?.length ?? 0}
                      </Text>
                    </Pressable>

                    <IconButton
                      icon="edit"
                      accessibilityLabel={`Edit ${item.title}`}
                      onPress={() => {
                        setEditingItemId(item.id);
                        setItemDraft({ title: item.title, details: item.details, location: item.location });
                        setItemDraftMedia(item.media ?? []);
                        setItemEditOpen(true);
                      }}
                      iconSize={22}
                      buttonSize={34}
                      variant="outlined"
                    />
                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Delete ${item.title}`}
                      onPress={() => {
                        Alert.alert('Delete item?', item.title, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const next = archiveItems.filter((x) => x.id !== item.id);
                              await adminSaveItems(next);
                            },
                          },
                        ]);
                      }}
                      iconSize={22}
                      buttonSize={34}
                      variant="outlined"
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <PrimaryButton title="Close" onPress={() => setCategoryManageOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={itemEditOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setItemEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  {editingItemId ? 'Edit Archive Item' : 'New Archive Item'}
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Edit title, details, and location.
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close"
                onPress={() => {
                  setItemEditOpen(false);
                  setEditingItemId(null);
                }}
                iconSize={22}
                buttonSize={36}
              />
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Title
            </Text>
            <TextInput
              value={itemDraft.title}
              onChangeText={(t) => setItemDraft((d) => ({ ...d, title: t }))}
              style={styles.modalInput}
              accessibilityLabel="Archive item title"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Details
            </Text>
            <TextInput
              value={itemDraft.details}
              onChangeText={(t) => setItemDraft((d) => ({ ...d, details: t }))}
              style={styles.modalTextArea}
              multiline
              accessibilityLabel="Archive item details"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Location
            </Text>
            <TextInput
              value={itemDraft.location}
              onChangeText={(t) => setItemDraft((d) => ({ ...d, location: t }))}
              style={styles.modalInput}
              accessibilityLabel="Archive item location"
            />

            <Text style={styles.archiveMeta} allowFontScaling>
              Selected files: {itemDraftMedia.length}
            </Text>

            <View style={styles.modalActionRow}>
              <PrimaryButton
                title="Cancel"
                onPress={() => {
                  setItemEditOpen(false);
                  setEditingItemId(null);
                }}
              />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  if (!selectedCategoryId) return;
                  const title = itemDraft.title.trim();
                  if (!title) return;

                  const details = itemDraft.details.trim();
                  const location = itemDraft.location.trim();

                  if (editingItemId) {
                    const next = archiveItems.map((it) =>
                      it.id === editingItemId ? { ...it, title, details, location } : it
                    );
                    await adminSaveItems(next);
                  } else {
                    const nextItem: ArchiveItem = {
                      id: `item-${Date.now()}`,
                      categoryId: selectedCategoryId,
                      title,
                      details,
                      location,
                      createdAtIso: new Date().toISOString(),
                      media: itemDraftMedia,
                    };
                    await adminSaveItems([nextItem, ...archiveItems]);
                  }

                  setItemEditOpen(false);
                  setEditingItemId(null);
                  setItemDraft({ title: '', details: '', location: '' });
                  setItemDraftMedia([]);
                }}
                disabled={!itemDraft.title.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  containerTight: {
    gap: 8,
  },
  bodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  liveCardWrap: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 104,
  },
  liveTextCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  liveTextTop: {
    gap: 6,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  recordGroup: {
    marginLeft: 20,
    marginTop: 2,
    position: 'relative',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordPulseHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: colors.danger,
  },
  recordLabel: {
    position: 'absolute',
    top: 36,
    left: -16,
    right: -16,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  liveTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  liveMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  liveThumbFrame: {
    width: 96,
    height: 104,
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  liveThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  liveAdminControls: {
    gap: 8,
  },
  liveAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveAdminLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  liveAdminSubLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  socialRowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingRight: 2,
  },
  socialTile: {
    alignSelf: 'flex-start',
    position: 'relative',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    gap: 0,
    alignItems: 'flex-start',
  },
  socialIconWrap: {
    width: 26,
    height: 26,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.text,
    position: 'absolute',
    top: -2,
    right: -2,
  },
  statusDotOn: {
    backgroundColor: colors.success,
  },
  statusDotOff: {
    backgroundColor: colors.danger,
  },
  socialTileTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  archiveList: {
    gap: 8,
  },
  archiveCard: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  archiveAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    gap: 8,
  },
  archiveCardPressed: {
    opacity: 0.9,
  },
  archiveTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  archiveDescription: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  archiveMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  archiveItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  archiveItemMain: {
    flex: 1,
    gap: 2,
  },
  archiveItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  archiveItemMeta: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalScrollContent: {
    gap: 10,
    paddingVertical: 2,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.primary,
  },
  modalFieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalInput: {
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
  modalTextArea: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 96,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  modalActionRow: {
    gap: 10,
  },

  connectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  websiteDebugWrap: {
    gap: 6,
  },
  websiteUrl: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  websiteDebugText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
