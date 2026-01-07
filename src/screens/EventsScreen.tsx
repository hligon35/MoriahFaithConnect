import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';
import { events, type ChurchEvent } from '../data/events';
import { ensureNotificationPermissions, formatLocalDateTime, isEventReminderEnabled, toggleEventReminder } from '../notifications/notifications';
import { MaterialIcons } from '@expo/vector-icons';
import { IconButton } from '../components/IconButton';
import { useAdmin } from '../state/AdminContext';
import { loadAdminEvents, saveAdminEvents } from '../storage/eventsAdminStore';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatSelectedDayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map((v) => Number(v));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function parseClockTimeLabel(baseDate: Date, timeLabel: string) {
  const match = timeLabel.trim().match(/^([0-1]?\d):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return null;

  const hours12 = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (Number.isNaN(hours12) || Number.isNaN(minutes)) return null;
  if (hours12 < 1 || hours12 > 12) return null;

  let hours24 = hours12 % 12;
  if (meridiem === 'PM') hours24 += 12;

  const dt = new Date(baseDate);
  dt.setHours(hours24, minutes, 0, 0);
  return dt;
}

function dateFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function EventsScreen() {
  const { adminEnabled, adminViewOnly } = useAdmin();

  const [eventItems, setEventItems] = useState<ChurchEvent[]>(events);
  const [adminDayOpen, setAdminDayOpen] = useState(false);
  const [adminDayKey, setAdminDayKey] = useState<string | undefined>(undefined);
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [adminEditDraft, setAdminEditDraft] = useState({ id: '', title: '', timeLabel: '', location: '' });

  const [reminderEnabledById, setReminderEnabledById] = useState<Record<string, boolean>>({});
  const [statusText, setStatusText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [rsvpById, setRsvpById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const stored = await loadAdminEvents();
      if (stored && stored.length) setEventItems(stored);
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...eventItems].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [eventItems]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string; dotColor?: string }> = {};

    for (const event of sorted) {
      const dayKey = toLocalDateKey(new Date(event.startsAt));
      marks[dayKey] = {
        ...marks[dayKey],
        marked: true,
        dotColor: colors.primary,
      };
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.text,
        dotColor: colors.primary,
      };
    }

    return marks;
  }, [sorted, selectedDate]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return sorted.filter((e) => toLocalDateKey(new Date(e.startsAt)) === selectedDate);
  }, [sorted, selectedDate]);

  const eventsForAdminDay = useMemo(() => {
    if (!adminDayKey) return [];
    return sorted.filter((e) => toLocalDateKey(new Date(e.startsAt)) === adminDayKey);
  }, [adminDayKey, sorted]);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        sorted.map(async (e) => [e.id, await isEventReminderEnabled(e.id)] as const)
      );
      setReminderEnabledById(Object.fromEntries(entries));
    })();
  }, [sorted]);

  const adminSave = async (next: ChurchEvent[]) => {
    setEventItems(next);
    await saveAdminEvents(next);
  };

  return (
    <ScreenContainer>
      {adminEnabled && adminViewOnly && (
        <SectionCard title="Admin: Events">
          <Text style={styles.bodyText} allowFontScaling>
            Tap a date to view that day.
          </Text>

          <Calendar
            accessibilityLabel="Admin monthly calendar"
            markedDates={markedDates}
            onDayPress={(day) => {
              setAdminDayKey(day.dateString);
              setAdminEditMode(false);
              setAdminEditDraft({ id: '', title: '', timeLabel: '', location: '' });
              setAdminDayOpen(true);
            }}
            theme={
              {
                calendarBackground: colors.background,
                textSectionTitleColor: colors.text,
                dayTextColor: colors.text,
                monthTextColor: colors.text,
                arrowColor: colors.text,
                todayTextColor: colors.button,
                selectedDayTextColor: colors.primary,
                textDayFontWeight: '700',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '800',
              } as any
            }
            style={styles.calendar}
          />
        </SectionCard>
      )}

      <Modal
        visible={adminDayOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminDayOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  {adminDayKey ? formatSelectedDayLabel(adminDayKey) : 'Day'}
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  {adminEditMode ? 'Edit details, then save.' : 'View events for this day.'}
                </Text>
              </View>

              {!adminEditMode ? (
                <IconButton
                  icon="edit"
                  accessibilityLabel="Edit day"
                  onPress={() => {
                    setAdminEditMode(true);
                    setAdminEditDraft({ id: '', title: '', timeLabel: '', location: '' });
                  }}
                  iconSize={22}
                  buttonSize={36}
                />
              ) : (
                <IconButton
                  icon="close"
                  accessibilityLabel="Close"
                  onPress={() => setAdminDayOpen(false)}
                  iconSize={22}
                  buttonSize={36}
                />
              )}
            </View>

            <View style={styles.modalDivider} />

            {!adminEditMode ? (
              <View style={{ gap: 10 }}>
                {eventsForAdminDay.length === 0 ? (
                  <Text style={styles.bodyText} allowFontScaling>
                    No events for this day.
                  </Text>
                ) : (
                  eventsForAdminDay.map((item) => {
                    const startsAt = new Date(item.startsAt);
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${item.title}`}
                        onPress={() => {
                          const t = startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                          setAdminEditDraft({ id: item.id, title: item.title, timeLabel: t, location: item.location });
                          setAdminEditMode(true);
                        }}
                        style={({ pressed }) => [styles.adminEventRow, pressed && styles.pressed]}
                      >
                        <View style={styles.adminEventInfo}>
                          <Text style={styles.adminEventTitle} allowFontScaling numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.adminEventMeta} allowFontScaling numberOfLines={1}>
                            {formatLocalDateTime(startsAt)} · {item.location}
                          </Text>
                        </View>
                        <MaterialIcons name="edit" size={22} color={colors.text} />
                      </Pressable>
                    );
                  })
                )}

                <View style={styles.modalActionRow}>
                  <PrimaryButton title="Close" onPress={() => setAdminDayOpen(false)} />
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Title
                </Text>
                <TextInput
                  value={adminEditDraft.title}
                  onChangeText={(t) => setAdminEditDraft((d) => ({ ...d, title: t }))}
                  placeholder="Bible Study"
                  placeholderTextColor={colors.text}
                  style={styles.modalInput}
                  accessibilityLabel="Event title"
                />

                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Time
                </Text>
                <TextInput
                  value={adminEditDraft.timeLabel}
                  onChangeText={(t) => setAdminEditDraft((d) => ({ ...d, timeLabel: t }))}
                  placeholder="6:30 PM"
                  placeholderTextColor={colors.text}
                  style={styles.modalInput}
                  accessibilityLabel="Event time"
                />

                <Text style={styles.modalFieldLabel} allowFontScaling>
                  Location
                </Text>
                <TextInput
                  value={adminEditDraft.location}
                  onChangeText={(t) => setAdminEditDraft((d) => ({ ...d, location: t }))}
                  placeholder="Fellowship Hall"
                  placeholderTextColor={colors.text}
                  style={styles.modalInput}
                  accessibilityLabel="Event location"
                />

                <View style={styles.modalActionRow}>
                  <PrimaryButton
                    title="Cancel"
                    onPress={() => {
                      setAdminEditMode(false);
                      setAdminEditDraft({ id: '', title: '', timeLabel: '', location: '' });
                    }}
                  />
                  <PrimaryButton
                    title="Save"
                    onPress={async () => {
                      if (!adminDayKey) return;
                      const title = adminEditDraft.title.trim();
                      const location = adminEditDraft.location.trim();
                      const timeLabel = adminEditDraft.timeLabel.trim();
                      if (!title || !location || !timeLabel) return;

                      const baseDate = dateFromKey(adminDayKey);
                      const dt = parseClockTimeLabel(baseDate, timeLabel);
                      if (!dt || Number.isNaN(dt.getTime())) return;

                      const nextEvent: ChurchEvent = {
                        id: adminEditDraft.id || `e-admin-${Date.now()}`,
                        title,
                        startsAt: dt.toISOString(),
                        location,
                      };

                      const remaining = sorted.filter((e) => e.id !== nextEvent.id);
                      await adminSave([nextEvent, ...remaining]);

                      setAdminEditMode(false);
                      setAdminEditDraft({ id: '', title: '', timeLabel: '', location: '' });
                    }}
                    disabled={!adminEditDraft.title.trim() || !adminEditDraft.timeLabel.trim() || !adminEditDraft.location.trim()}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {!adminViewOnly && <SectionCard title="Calendar">
        <Text style={styles.bodyText} allowFontScaling>
          Tap a day to see events.
        </Text>

        <Calendar
          accessibilityLabel="Monthly calendar"
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            calendarBackground: colors.background,
            textSectionTitleColor: colors.text,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            arrowColor: colors.text,
            todayTextColor: colors.button,
            selectedDayTextColor: colors.primary,
            textDayFontWeight: '700',
            textMonthFontWeight: '900',
            textDayHeaderFontWeight: '800',
          }}
          style={styles.calendar}
        />

        {!!selectedDate && (
          <View style={styles.dayEventsSection}>
            <Text style={styles.dayEventsTitle} allowFontScaling>
              {formatSelectedDayLabel(selectedDate)}
            </Text>

            {eventsForSelectedDay.length === 0 ? (
              <Text style={styles.bodyText} allowFontScaling>
                No events for this day.
              </Text>
            ) : (
              <FlatList
                horizontal
                data={eventsForSelectedDay}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayEventsList}
                renderItem={({ item }) => {
                  const startsAt = new Date(item.startsAt);
                  const reminderOn = !!reminderEnabledById[item.id];
                  const rsvpOn = !!rsvpById[item.id];

                  return (
                    <View style={styles.dayEventCard}>
                      <View style={styles.dayEventInfo}>
                        <Text style={styles.eventTitle} allowFontScaling numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.eventMeta} allowFontScaling numberOfLines={1}>
                          {formatLocalDateTime(startsAt)}
                        </Text>
                        <Text style={styles.eventMeta} allowFontScaling numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>

                      <View style={styles.dayEventActions}>
                        {adminEnabled && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete event ${item.title}`}
                            onPress={async () => {
                              const remaining = sorted.filter((e) => e.id !== item.id);
                              await adminSave(remaining);
                            }}
                            hitSlop={10}
                            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                          >
                            <MaterialIcons name="delete" size={26} color={colors.text} />
                          </Pressable>
                        )}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={reminderOn ? `Disable reminder for ${item.title}` : `Enable reminder for ${item.title}`}
                          onPress={async () => {
                            setStatusText('');
                            const ok = await ensureNotificationPermissions();
                            if (!ok) {
                              setStatusText('Notifications are disabled. Enable them in your device settings.');
                              return;
                            }

                            const next = await toggleEventReminder(item.id, item.title, startsAt);
                            setReminderEnabledById((current) => ({ ...current, [item.id]: next.enabled }));
                            setStatusText(next.enabled ? 'Event reminder scheduled.' : 'Event reminder removed.');
                          }}
                          hitSlop={10}
                          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                        >
                          <MaterialIcons
                            name={reminderOn ? 'notifications-active' : 'notifications-none'}
                            size={26}
                            color={reminderOn ? colors.primary : colors.text}
                          />
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={rsvpOn ? `Remove RSVP for ${item.title}` : `RSVP for ${item.title}`}
                          onPress={() => setRsvpById((current) => ({ ...current, [item.id]: !rsvpOn }))}
                          hitSlop={10}

                          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                        >
                          <MaterialIcons
                            name={rsvpOn ? 'how-to-reg' : 'how-to-vote'}
                            size={26}
                            color={rsvpOn ? colors.primary : colors.text}
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}

        {!!statusText && (
          <Text style={styles.statusText} allowFontScaling>
            {statusText}
          </Text>
        )}
      </SectionCard>}

      {!adminViewOnly && <SectionCard title="Outreach">
        <Text style={styles.bodyText} allowFontScaling>
          Outreach opportunities will appear here.
        </Text>
        <PrimaryButton title="View Outreach (Coming Soon)" onPress={() => {}} disabled />
      </SectionCard>}
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
  adminEventList: {
    marginTop: 10,
    gap: 10,
  },
  adminEventRow: {
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
  adminEventInfo: {
    flex: 1,
    gap: 2,
  },
  adminEventTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  adminEventMeta: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  calendar: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dayEventsSection: {
    gap: 10,
  },
  dayEventsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  dayEventsList: {
    gap: 12,
    paddingRight: 6,
  },
  dayEventCard: {
    alignSelf: 'flex-start',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  dayEventInfo: {
    gap: 3,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  eventMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dayEventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  pressed: {
    opacity: 0.9,
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
  modalActionRow: {
    gap: 10,
  },
});
