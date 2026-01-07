import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, FlatList, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { getTodaysServices } from '../data/todaysServices';
import { getMessageBoardPosts } from '../data/messageBoard';
import { getWordOfDay } from '../data/wordOfDay';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import { useAdmin } from '../state/AdminContext';
import { MaterialIcons } from '@expo/vector-icons';
import {
  loadAnnouncements,
  loadServiceExtrasByDate,
  loadServiceExtrasByWeekday,
  loadServiceItineraryById,
  loadServiceTitleOptions,
  loadWordSchedule,
  saveAnnouncements,
  saveServiceExtrasByDate,
  saveServiceExtrasByWeekday,
  saveServiceItineraryById,
  saveServiceTitleOptions,
  saveWordSchedule,
  toDateKey,
  type AnnouncementDraft,
  type ServiceExtra,
  type WordScheduleEntry,
} from '../storage/homeAdminStore';

function weekdayLabel(day: number) {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return labels[day] ?? 'Sunday';
}

function parseClockTimeLabel(baseDate: Date, timeLabel: string) {
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hours12 = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hours12) || Number.isNaN(minutes)) return null;
  if (hours12 < 1 || hours12 > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  let hours24 = hours12 % 12;
  if (meridiem === 'PM') hours24 += 12;

  const dt = new Date(baseDate);
  dt.setHours(hours24, minutes, 0, 0);
  return dt;
}

function isServiceLive(service: { timeLabel: string }, now: Date) {
  const start = parseClockTimeLabel(now, service.timeLabel);
  if (!start) return false;

  const startsAt = start.getTime();
  const windowStart = startsAt - 15 * 60 * 1000;
  const windowEnd = startsAt + 90 * 60 * 1000;
  const t = now.getTime();

  return t >= windowStart && t <= windowEnd;
}

export function HomeScreen() {
  type HomeNav = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >;

  const navigation = useNavigation<HomeNav>();

  const { adminEnabled, adminViewOnly } = useAdmin();

  const [itineraryOpen, setItineraryOpen] = useState(false);

  const [itineraryEditOpen, setItineraryEditOpen] = useState(false);
  const [itineraryEditDraft, setItineraryEditDraft] = useState('');

  const [adminWordOpen, setAdminWordOpen] = useState(false);
  const [adminWordDraft, setAdminWordDraft] = useState({ dateKey: '', scripture: '', message: '' });
  const [wordSchedule, setWordSchedule] = useState<WordScheduleEntry[]>([]);

  const [adminAnnouncementOpen, setAdminAnnouncementOpen] = useState(false);
  const [adminAnnouncementDraft, setAdminAnnouncementDraft] = useState({ title: '', body: '', pinned: false });
  const [announcementsOverride, setAnnouncementsOverride] = useState<AnnouncementDraft[] | null>(null);

  const [adminServiceOpen, setAdminServiceOpen] = useState(false);
  const [adminServiceDraft, setAdminServiceDraft] = useState({ title: '', timeLabel: '', locationLabel: '', itineraryText: '' });
  const [serviceExtrasByDate, setServiceExtrasByDate] = useState<Record<string, ServiceExtra[]>>({});
  const [serviceExtrasByWeekday, setServiceExtrasByWeekday] = useState<Record<string, ServiceExtra[]>>({});
  const [serviceItineraryById, setServiceItineraryById] = useState<Record<string, string[]>>({});
  const [serviceTitleOptions, setServiceTitleOptions] = useState<string[]>([]);

  const [adminServiceDay, setAdminServiceDay] = useState<number>(new Date().getDay());
  const [serviceTitlePickerOpen, setServiceTitlePickerOpen] = useState(false);
  const [serviceDayPickerOpen, setServiceDayPickerOpen] = useState(false);
  const [serviceLocationPickerOpen, setServiceLocationPickerOpen] = useState(false);
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newServiceTitleDraft, setNewServiceTitleDraft] = useState('');
  const [offsiteOpen, setOffsiteOpen] = useState(false);
  const [offsiteLocationDraft, setOffsiteLocationDraft] = useState('');

  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => toDateKey(today), [today]);

  useEffect(() => {
    (async () => {
      const schedule = await loadWordSchedule();
      setWordSchedule(schedule);

      const announcements = await loadAnnouncements();
      setAnnouncementsOverride(announcements.length ? announcements : null);

      const extras = await loadServiceExtrasByDate();
      setServiceExtrasByDate(extras);

      const weekly = await loadServiceExtrasByWeekday();
      setServiceExtrasByWeekday(weekly);

      const itineraries = await loadServiceItineraryById();
      setServiceItineraryById(itineraries);

      const storedTitles = await loadServiceTitleOptions();
      if (storedTitles.length) {
        setServiceTitleOptions(storedTitles);
      } else {
        // Seed from built-in schedule across weekdays.
        const seedDates = [0, 1, 2, 3, 4, 5, 6].map((dow) => new Date(2020, 0, 5 + dow));
        const seed = Array.from(
          new Set(seedDates.flatMap((d) => getTodaysServices(d).map((s) => s.title.trim()).filter(Boolean)))
        );
        setServiceTitleOptions(seed);
        await saveServiceTitleOptions(seed);
      }
    })();
  }, []);

  const wordOfDay = useMemo(() => {
    const scheduled = wordSchedule.find((w) => w.dateKey === dateKey);
    if (!scheduled) return getWordOfDay(today);
    return {
      title: 'Word of the Day',
      word: scheduled.scripture,
      message: scheduled.message,
    };
  }, [dateKey, today, wordSchedule]);

  const messageBoardPosts = useMemo(() => {
    if (announcementsOverride && announcementsOverride.length) return announcementsOverride;
    return getMessageBoardPosts(today);
  }, [announcementsOverride, today]);

  const todaysServices = useMemo(() => {
    const base = getTodaysServices(today);
    const extrasByDate = serviceExtrasByDate[dateKey] ?? [];
    const dowKey = String(today.getDay());
    const extrasByDow = serviceExtrasByWeekday[dowKey] ?? [];
    const merged = [...extrasByDate, ...extrasByDow, ...base];
    return merged.map((svc) => {
      const itinerary = serviceItineraryById[svc.id];
      return itinerary ? { ...svc, itinerary } : svc;
    });
  }, [dateKey, serviceExtrasByDate, serviceExtrasByWeekday, serviceItineraryById, today]);

  const itineraryService = useMemo(() => {
    return todaysServices.find((service) => (service.itinerary?.length ?? 0) > 0) ?? todaysServices[0];
  }, [todaysServices]);

  useEffect(() => {
    if (!itineraryOpen) {
      setItineraryEditOpen(false);
      setItineraryEditDraft('');
      return;
    }

    if (!itineraryService) return;
    setItineraryEditDraft((itineraryService.itinerary ?? []).join('\n'));
  }, [itineraryOpen, itineraryService]);

  const watchPulse = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(watchPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(watchPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    anim.start();
    return () => anim.stop();
  }, [watchPulse]);

  const watchPulseStyle = useMemo(() => {
    const scale = watchPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
    const opacity = watchPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });
    return { transform: [{ scale }], opacity };
  }, [watchPulse]);

  return (
    <ScreenContainer scroll={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!(adminEnabled && adminViewOnly) && (
          <>
            <View style={styles.header}>
              <View style={styles.bannerRow}>
                <View style={styles.wordBanner} accessibilityRole="summary">
                  <Text style={styles.bannerTitle} allowFontScaling>
                    {wordOfDay.title}
                  </Text>
                  <View style={styles.bannerDivider} />
                  <Text style={styles.bannerWord} allowFontScaling>
                    {wordOfDay.word}
                  </Text>
                  <Text style={styles.bannerMessage} allowFontScaling>
                    {wordOfDay.message}
                  </Text>
                </View>
              </View>
            </View>

            <SectionCard
              title="Today’s Services"
              style={styles.servicesCard}
              headerRight={
                <IconButton
                  icon="event-note"
                  accessibilityLabel="Open service itinerary"
                  onPress={() => setItineraryOpen(true)}
                  iconSize={22}
                  buttonSize={36}
                  variant="outlined"
                />
              }
            >
          {todaysServices.length <= 4 ? (
            <View style={styles.servicesGridRow}>
              {todaysServices.map((item) => {
                const live = isServiceLive(item, new Date());
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.timeLabel}.`}
                    onPress={() => navigation.navigate('Watch')}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      styles.serviceCardGrid,
                      pressed && styles.pressed,
                    ]}
                  >
                    {live && (
                      <Animated.View style={[styles.watchBadgeWrap, watchPulseStyle]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Watch ${item.title} live`}
                          onPress={() => navigation.navigate('Watch')}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.watchBadge,
                            pressed && styles.watchBadgePressed,
                          ]}
                        >
                          <Text style={styles.watchBadgeText} allowFontScaling>
                            WATCH
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}

                    <Text style={styles.serviceCardTitle} allowFontScaling numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.timeLabel}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <FlatList
              horizontal
              data={todaysServices}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesList}
              renderItem={({ item }) => {
                const live = isServiceLive(item, new Date());
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.timeLabel}.`}
                    onPress={() => navigation.navigate('Watch')}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      styles.serviceCardCarousel,
                      pressed && styles.pressed,
                    ]}
                  >
                    {live && (
                      <Animated.View style={[styles.watchBadgeWrap, watchPulseStyle]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Watch ${item.title} live`}
                          onPress={() => navigation.navigate('Watch')}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.watchBadge,
                            pressed && styles.watchBadgePressed,
                          ]}
                        >
                          <Text style={styles.watchBadgeText} allowFontScaling>
                            WATCH
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}

                    <Text style={styles.serviceCardTitle} allowFontScaling numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.timeLabel}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
            </SectionCard>

        <Modal
          visible={itineraryOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setItineraryOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    Service Itinerary
                  </Text>
                  {!!itineraryService && (
                    <Text style={styles.modalSubtitle} allowFontScaling>
                      {itineraryService.title} • {itineraryService.timeLabel}
                    </Text>
                  )}
                </View>
                <View style={styles.modalHeaderActions}>
                  {adminEnabled && (
                    <IconButton
                      icon={itineraryEditOpen ? 'visibility' : 'edit'}
                      accessibilityLabel={itineraryEditOpen ? 'View itinerary' : 'Edit itinerary'}
                      onPress={() => setItineraryEditOpen((v) => !v)}
                      iconSize={22}
                      buttonSize={36}
                      variant="outlined"
                    />
                  )}
                  <IconButton
                    icon="close"
                    accessibilityLabel="Close itinerary"
                    onPress={() => setItineraryOpen(false)}
                    iconSize={22}
                    buttonSize={36}
                  />
                </View>
              </View>

              <View style={styles.modalDivider} />

              <ScrollView contentContainerStyle={styles.itineraryList}>
                {!!itineraryService && (
                  <Text style={styles.itineraryMeta} allowFontScaling>
                    {itineraryService.locationLabel}
                  </Text>
                )}

                {itineraryEditOpen ? (
                  <>
                    <Text style={styles.modalFieldLabel} allowFontScaling>
                      Program (one line per item)
                    </Text>
                    <TextInput
                      value={itineraryEditDraft}
                      onChangeText={setItineraryEditDraft}
                      placeholder="Welcome\nPrayer\nWorship\nMessage\nBenediction"
                      placeholderTextColor={colors.text}
                      style={styles.modalTextArea}
                      multiline
                      accessibilityLabel="Service itinerary"
                    />
                    <View style={styles.modalActionRow}>
                      <PrimaryButton
                        title="Cancel"
                        onPress={() => {
                          setItineraryEditOpen(false);
                          setItineraryEditDraft((itineraryService?.itinerary ?? []).join('\n'));
                        }}
                      />
                      <PrimaryButton
                        title="Save"
                        onPress={async () => {
                          if (!itineraryService) return;

                          const lines = itineraryEditDraft
                            .split(/\r?\n/)
                            .map((l) => l.trim())
                            .filter(Boolean);

                          const next = { ...serviceItineraryById, [itineraryService.id]: lines };
                          setServiceItineraryById(next);
                          await saveServiceItineraryById(next);
                          setItineraryEditOpen(false);
                        }}
                        disabled={!itineraryEditDraft.trim()}
                      />
                    </View>
                  </>
                ) : (
                  (itineraryService?.itinerary ?? []).map((line: string, idx: number) => (
                    <Text key={`${itineraryService?.id ?? 'svc'}-it-${idx}`} style={styles.itineraryItem} allowFontScaling>
                      • {line}
                    </Text>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <SectionCard title="Announcements" style={styles.messageBoardCard}>
          <Text style={styles.messageBoardLead} allowFontScaling>
            Important updates from the church.
          </Text>

          <View style={styles.messageBoardList}>
            {messageBoardPosts.map((post) => (
              <View
                key={post.id}
                style={styles.messageBoardPost}
                accessibilityRole="text"
                accessibilityLabel={`${post.title}. ${post.body}`}
              >
                <Text style={styles.messageBoardTitle} allowFontScaling>
                  {post.pinned ? 'Pinned: ' : ''}
                  {post.title}
                </Text>
                <Text style={styles.messageBoardBody} allowFontScaling>
                  {post.body}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
          </>
        )}

        {adminEnabled && (
          <>
            <SectionCard
              title="Admin: Word of the Day"
              headerRight={
                <IconButton
                  icon="add"
                  accessibilityLabel="Schedule word of the day"
                  onPress={() => {
                    setAdminWordDraft({ dateKey, scripture: '', message: '' });
                    setAdminWordOpen(true);
                  }}
                  iconColor={colors.primary}
                  variant="outlined"
                  iconSize={22}
                  buttonSize={34}
                />
              }
            >
              <Text style={styles.adminBodyText} allowFontScaling>
                Scheduled entries: {wordSchedule.length}
              </Text>
            </SectionCard>

            <SectionCard
              title="Admin: Announcements"
              headerRight={
                <IconButton
                  icon="add"
                  accessibilityLabel="Add announcement"
                  onPress={() => {
                    setAdminAnnouncementDraft({ title: '', body: '', pinned: false });
                    setAdminAnnouncementOpen(true);
                  }}
                  iconColor={colors.primary}
                  variant="outlined"
                  iconSize={22}
                  buttonSize={34}
                />
              }
            >
              <Text style={styles.adminBodyText} allowFontScaling>
                Current announcements: {messageBoardPosts.length}
              </Text>
              <View style={styles.adminList}>
                {messageBoardPosts.slice(0, 3).map((p) => (
                  <View key={p.id} style={styles.adminRow}>
                    <Text style={styles.adminRowText} allowFontScaling numberOfLines={1}>
                      {p.pinned ? 'Pinned: ' : ''}
                      {p.title}
                    </Text>
                    <IconButton
                      icon="delete"
                      accessibilityLabel={`Delete announcement ${p.title}`}
                      onPress={async () => {
                        const remaining = messageBoardPosts.filter((x) => x.id !== p.id);
                        setAnnouncementsOverride(remaining);
                        await saveAnnouncements(remaining);
                      }}
                      iconSize={22}
                      buttonSize={34}
                      variant="outlined"
                    />
                  </View>
                ))}
              </View>
            </SectionCard>

            <SectionCard
              title="Admin: Services"
              headerRight={
                <IconButton
                  icon="add"
                  accessibilityLabel="Add service for today"
                  onPress={() => {
                    setAdminServiceDay(today.getDay());
                    setAdminServiceDraft({ title: '', timeLabel: '', locationLabel: '', itineraryText: '' });
                    setAdminServiceOpen(true);
                  }}
                  iconColor={colors.primary}
                  variant="outlined"
                  iconSize={22}
                  buttonSize={34}
                />
              }
            >
              <Text style={styles.adminBodyText} allowFontScaling>
                Services shown today: {todaysServices.length}
              </Text>
            </SectionCard>
          </>
        )}

        <Modal
          visible={adminWordOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAdminWordOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    Schedule Word of the Day
                  </Text>
                  <Text style={styles.modalSubtitle} allowFontScaling>
                    Set scripture + message for a specific date.
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setAdminWordOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={adminWordDraft.dateKey}
                onChangeText={(t) => setAdminWordDraft((d) => ({ ...d, dateKey: t }))}
                placeholder={dateKey}
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Word of the day date"
              />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Scripture
              </Text>
              <TextInput
                value={adminWordDraft.scripture}
                onChangeText={(t) => setAdminWordDraft((d) => ({ ...d, scripture: t }))}
                placeholder="Isaiah 40:31 (KJV)"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                accessibilityLabel="Scripture reference"
              />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Message
              </Text>
              <TextInput
                value={adminWordDraft.message}
                onChangeText={(t) => setAdminWordDraft((d) => ({ ...d, message: t }))}
                placeholder="Verse text"
                placeholderTextColor={colors.text}
                style={styles.modalTextArea}
                multiline
                accessibilityLabel="Word of the day message"
              />

              <View style={styles.modalActionRow}>
                <PrimaryButton title="Cancel" onPress={() => setAdminWordOpen(false)} />
                <PrimaryButton
                  title="Save"
                  onPress={async () => {
                    const entry: WordScheduleEntry = {
                      id: `w-${Date.now()}`,
                      dateKey: adminWordDraft.dateKey.trim(),
                      scripture: adminWordDraft.scripture.trim(),
                      message: adminWordDraft.message.trim(),
                    };

                    if (!entry.dateKey || !entry.scripture || !entry.message) return;

                    const next = [entry, ...wordSchedule.filter((w) => w.dateKey !== entry.dateKey)];
                    setWordSchedule(next);
                    await saveWordSchedule(next);
                    setAdminWordOpen(false);
                  }}
                  disabled={!adminWordDraft.dateKey.trim() || !adminWordDraft.scripture.trim() || !adminWordDraft.message.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={adminAnnouncementOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAdminAnnouncementOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    Add Announcement
                  </Text>
                  <Text style={styles.modalSubtitle} allowFontScaling>
                    Post an update for the congregation.
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setAdminAnnouncementOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Title
              </Text>
              <TextInput
                value={adminAnnouncementDraft.title}
                onChangeText={(t) => setAdminAnnouncementDraft((d) => ({ ...d, title: t }))}
                placeholder="Service Time Reminder"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                accessibilityLabel="Announcement title"
              />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Body
              </Text>
              <TextInput
                value={adminAnnouncementDraft.body}
                onChangeText={(t) => setAdminAnnouncementDraft((d) => ({ ...d, body: t }))}
                placeholder="Announcement details"
                placeholderTextColor={colors.text}
                style={styles.modalTextArea}
                multiline
                accessibilityLabel="Announcement body"
              />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel} allowFontScaling>
                  Pin
                </Text>
                <Switch
                  value={adminAnnouncementDraft.pinned}
                  onValueChange={(v) => setAdminAnnouncementDraft((d) => ({ ...d, pinned: v }))}
                  trackColor={{ false: colors.highlight, true: colors.button }}
                  thumbColor={colors.background}
                  accessibilityLabel="Pin announcement"
                />
              </View>

              <View style={styles.modalActionRow}>
                <PrimaryButton title="Cancel" onPress={() => setAdminAnnouncementOpen(false)} />
                <PrimaryButton
                  title="Save"
                  onPress={async () => {
                    const post: AnnouncementDraft = {
                      id: `msg-${Date.now()}`,
                      title: adminAnnouncementDraft.title.trim(),
                      body: adminAnnouncementDraft.body.trim(),
                      postedAtIso: new Date().toISOString(),
                      pinned: adminAnnouncementDraft.pinned || undefined,
                    };

                    if (!post.title || !post.body) return;

                    const current = announcementsOverride ?? getMessageBoardPosts(today);
                    const next = [post, ...current];
                    setAnnouncementsOverride(next);
                    await saveAnnouncements(next);
                    setAdminAnnouncementOpen(false);
                  }}
                  disabled={!adminAnnouncementDraft.title.trim() || !adminAnnouncementDraft.body.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={adminServiceOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAdminServiceOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    Add Service
                  </Text>
                  <Text style={styles.modalSubtitle} allowFontScaling>
                    Create a service and its program.
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setAdminServiceOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Title
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select service title"
                onPress={() => setServiceTitlePickerOpen(true)}
                style={({ pressed }) => [styles.modalSelect, pressed && styles.modalSelectPressed]}
              >
                <Text style={styles.modalSelectText} allowFontScaling numberOfLines={1}>
                  {adminServiceDraft.title || 'Select a service title'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
              </Pressable>

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Day
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select service day"
                onPress={() => setServiceDayPickerOpen(true)}
                style={({ pressed }) => [styles.modalSelect, pressed && styles.modalSelectPressed]}
              >
                <Text style={styles.modalSelectText} allowFontScaling numberOfLines={1}>
                  {weekdayLabel(adminServiceDay)}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
              </Pressable>

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Time
              </Text>
              <TextInput
                value={adminServiceDraft.timeLabel}
                onChangeText={(t) => setAdminServiceDraft((d) => ({ ...d, timeLabel: t }))}
                placeholder="11:00 AM"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                accessibilityLabel="Service time"
              />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Location
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select service location"
                onPress={() => setServiceLocationPickerOpen(true)}
                style={({ pressed }) => [styles.modalSelect, pressed && styles.modalSelectPressed]}
              >
                <Text style={styles.modalSelectText} allowFontScaling numberOfLines={1}>
                  {adminServiceDraft.locationLabel || 'Select location'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
              </Pressable>

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Program (one line per item)
              </Text>
              <TextInput
                value={adminServiceDraft.itineraryText}
                onChangeText={(t) => setAdminServiceDraft((d) => ({ ...d, itineraryText: t }))}
                placeholder="Welcome\nPrayer\nWorship\nMessage\nBenediction"
                placeholderTextColor={colors.text}
                style={styles.modalTextArea}
                multiline
                accessibilityLabel="Service itinerary"
              />

              <View style={styles.modalActionRow}>
                <PrimaryButton title="Cancel" onPress={() => setAdminServiceOpen(false)} />
                <PrimaryButton
                  title="Save"
                  onPress={async () => {
                    const service: ServiceExtra = {
                      id: `svc-admin-${Date.now()}`,
                      title: adminServiceDraft.title.trim(),
                      timeLabel: adminServiceDraft.timeLabel.trim(),
                      locationLabel: adminServiceDraft.locationLabel.trim(),
                    };

                    const lines = adminServiceDraft.itineraryText
                      .split(/\r?\n/)
                      .map((l) => l.trim())
                      .filter(Boolean);

                    if (!service.title || !service.timeLabel || !service.locationLabel) return;

                    const dowKey = String(adminServiceDay);
                    const nextWeekly = {
                      ...serviceExtrasByWeekday,
                      [dowKey]: [...(serviceExtrasByWeekday[dowKey] ?? []), service],
                    };
                    setServiceExtrasByWeekday(nextWeekly);
                    await saveServiceExtrasByWeekday(nextWeekly);

                    if (lines.length) {
                      const nextIt = { ...serviceItineraryById, [service.id]: lines };
                      setServiceItineraryById(nextIt);
                      await saveServiceItineraryById(nextIt);
                    }

                    setAdminServiceOpen(false);
                  }}
                  disabled={!adminServiceDraft.title.trim() || !adminServiceDraft.timeLabel.trim() || !adminServiceDraft.locationLabel.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={serviceTitlePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setServiceTitlePickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setServiceTitlePickerOpen(false)} />
          <View style={styles.pickerCard} accessibilityViewIsModal>
            <Text style={styles.pickerTitle} allowFontScaling>
              Service Title
            </Text>
            <View style={styles.pickerDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New service"
              onPress={() => {
                setServiceTitlePickerOpen(false);
                setNewServiceTitleDraft('');
                setNewServiceOpen(true);
              }}
              style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
            >
              <Text style={styles.pickerRowText} allowFontScaling>
                New service
              </Text>
            </Pressable>

            {serviceTitleOptions.map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`Select ${t}`}
                onPress={() => {
                  setAdminServiceDraft((d) => ({ ...d, title: t }));
                  setServiceTitlePickerOpen(false);
                }}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
              >
                <Text style={styles.pickerRowText} allowFontScaling numberOfLines={1}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        <Modal
          visible={serviceDayPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setServiceDayPickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setServiceDayPickerOpen(false)} />
          <View style={styles.pickerCard} accessibilityViewIsModal>
            <Text style={styles.pickerTitle} allowFontScaling>
              Day of Week
            </Text>
            <View style={styles.pickerDivider} />
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`Select ${weekdayLabel(d)}`}
                onPress={() => {
                  setAdminServiceDay(d);
                  setServiceDayPickerOpen(false);
                }}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
              >
                <Text style={styles.pickerRowText} allowFontScaling>
                  {weekdayLabel(d)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        <Modal
          visible={serviceLocationPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setServiceLocationPickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setServiceLocationPickerOpen(false)} />
          <View style={styles.pickerCard} accessibilityViewIsModal>
            <Text style={styles.pickerTitle} allowFontScaling>
              Location
            </Text>
            <View style={styles.pickerDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="On-site"
              onPress={() => {
                setAdminServiceDraft((d) => ({ ...d, locationLabel: 'On-site' }));
                setServiceLocationPickerOpen(false);
              }}
              style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
            >
              <Text style={styles.pickerRowText} allowFontScaling>
                On-site
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Off-site"
              onPress={() => {
                setServiceLocationPickerOpen(false);
                setOffsiteLocationDraft('');
                setOffsiteOpen(true);
              }}
              style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
            >
              <Text style={styles.pickerRowText} allowFontScaling>
                Off-site
              </Text>
            </Pressable>
          </View>
        </Modal>

        <Modal
          visible={newServiceOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setNewServiceOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    New Service
                  </Text>
                  <Text style={styles.modalSubtitle} allowFontScaling>
                    Add a new service title.
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setNewServiceOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Title
              </Text>
              <TextInput
                value={newServiceTitleDraft}
                onChangeText={setNewServiceTitleDraft}
                placeholder="New Service Name"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                accessibilityLabel="New service title"
              />

              <View style={styles.modalActionRow}>
                <PrimaryButton title="Cancel" onPress={() => setNewServiceOpen(false)} />
                <PrimaryButton
                  title="Save"
                  onPress={async () => {
                    const title = newServiceTitleDraft.trim();
                    if (!title) return;

                    const next = [...serviceTitleOptions.filter((t) => t.toLowerCase() !== title.toLowerCase()), title];
                    setServiceTitleOptions(next);
                    await saveServiceTitleOptions(next);
                    setAdminServiceDraft((d) => ({ ...d, title }));
                    setNewServiceOpen(false);
                  }}
                  disabled={!newServiceTitleDraft.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={offsiteOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setOffsiteOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard} accessibilityViewIsModal>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle} allowFontScaling>
                    Off-site Location
                  </Text>
                  <Text style={styles.modalSubtitle} allowFontScaling>
                    Enter the location.
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setOffsiteOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalFieldLabel} allowFontScaling>
                Location
              </Text>
              <TextInput
                value={offsiteLocationDraft}
                onChangeText={setOffsiteLocationDraft}
                placeholder="Community Center"
                placeholderTextColor={colors.text}
                style={styles.modalInput}
                accessibilityLabel="Off-site location"
              />

              <View style={styles.modalActionRow}>
                <PrimaryButton title="Cancel" onPress={() => setOffsiteOpen(false)} />
                <PrimaryButton
                  title="Save"
                  onPress={() => {
                    const loc = offsiteLocationDraft.trim();
                    if (!loc) return;
                    setAdminServiceDraft((d) => ({ ...d, locationLabel: loc }));
                    setOffsiteOpen(false);
                  }}
                  disabled={!offsiteLocationDraft.trim()}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 25,
    gap: 10,
  },
  modalSelect: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSelectPressed: {
    opacity: 0.9,
  },
  modalSelectText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  pickerCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 120,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  pickerDivider: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  pickerRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pickerRowPressed: {
    backgroundColor: colors.highlight,
  },
  pickerRowText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    gap: 10,
  },
  bannerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  wordBanner: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerDivider: {
    alignSelf: 'center',
    width: '60%',
    height: 1,
    backgroundColor: colors.text,
  },
  bannerWord: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerMessage: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  servicesCard: {
    gap: 10,
  },
  servicesList: {
    gap: 12,
    paddingRight: 6,
  },
  servicesGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  serviceCardCarousel: {
    width: 240,
  },
  serviceCardGrid: {
    flex: 1,
  },
  serviceCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  serviceCardMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  watchBadgeWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  watchBadge: {
    backgroundColor: colors.button,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  watchBadgePressed: {
    opacity: 0.9,
  },
  watchBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
  messageBoardCard: {
    gap: 10,
  },
  messageBoardLead: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  messageBoardList: {
    gap: 10,
  },
  messageBoardPost: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  messageBoardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  messageBoardBody: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
    alignItems: 'center',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  adminBodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  adminList: {
    gap: 8,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  adminRowText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  itineraryList: {
    gap: 8,
    paddingBottom: 6,
  },
  itineraryMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  itineraryItem: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
