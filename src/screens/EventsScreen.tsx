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

export function EventsScreen() {
  const { adminEnabled, adminViewOnly } = useAdmin();

  const [eventItems, setEventItems] = useState<ChurchEvent[]>(events);
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [adminDraft, setAdminDraft] = useState({ title: '', startsAt: '', location: '' });

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
      {adminEnabled && (
        <SectionCard
          title="Admin: Events"
          headerRight={
            <IconButton
              icon="add"
              accessibilityLabel="Add event"
              onPress={() => {
                setAdminDraft({ title: '', startsAt: new Date().toISOString(), location: '' });
                setAdminAddOpen(true);
              }}
              iconColor={colors.primary}
              variant="outlined"
              iconSize={22}
              buttonSize={34}
            />
          }
        >
          <Text style={styles.bodyText} allowFontScaling>
            Add/edit/remove calendar events.
          </Text>

          <View style={styles.adminEventList}>
            {sorted.slice(0, 12).map((item) => {
              const startsAt = new Date(item.startsAt);
              return (
                <View key={item.id} style={styles.adminEventRow}>
                  <View style={styles.adminEventInfo}>
                    <Text style={styles.adminEventTitle} allowFontScaling numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.adminEventMeta} allowFontScaling numberOfLines={1}>
                      {formatLocalDateTime(startsAt)} · {item.location}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    accessibilityLabel={`Delete event ${item.title}`}
                    onPress={async () => {
                      const remaining = sorted.filter((e) => e.id !== item.id);
                      await adminSave(remaining);
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
      )}

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
                  Add Event
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Use an ISO timestamp for start time.
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close"
                onPress={() => setAdminAddOpen(false)}
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
              placeholder="Bible Study"
              placeholderTextColor={colors.text}
              style={styles.modalInput}
              accessibilityLabel="Event title"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Starts At (ISO)
            </Text>
            <TextInput
              value={adminDraft.startsAt}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, startsAt: t }))}
              placeholder={new Date().toISOString()}
              placeholderTextColor={colors.text}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Event start time"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Location
            </Text>
            <TextInput
              value={adminDraft.location}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, location: t }))}
              placeholder="Fellowship Hall"
              placeholderTextColor={colors.text}
              style={styles.modalInput}
              accessibilityLabel="Event location"
            />

            <View style={styles.modalActionRow}>
              <PrimaryButton title="Cancel" onPress={() => setAdminAddOpen(false)} />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  const title = adminDraft.title.trim();
                  const location = adminDraft.location.trim();
                  const startsAt = adminDraft.startsAt.trim();
                  if (!title || !location || !startsAt) return;

                  const dt = new Date(startsAt);
                  if (Number.isNaN(dt.getTime())) return;

                  const next: ChurchEvent = {
                    id: `e-admin-${Date.now()}`,
                    title,
                    startsAt: dt.toISOString(),
                    location,
                  };
                  await adminSave([next, ...eventItems]);
                  setAdminAddOpen(false);
                }}
                disabled={!adminDraft.title.trim() || !adminDraft.location.trim() || !adminDraft.startsAt.trim()}
              />
            </View>
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
