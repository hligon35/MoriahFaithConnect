import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';
import { events } from '../data/events';
import { ensureNotificationPermissions, formatLocalDateTime, isEventReminderEnabled, toggleEventReminder } from '../notifications/notifications';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [reminderEnabledById, setReminderEnabledById] = useState<Record<string, boolean>>({});
  const [statusText, setStatusText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [rsvpById, setRsvpById] = useState<Record<string, boolean>>({});

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, []);

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

  return (
    <ScreenContainer>
      <SectionCard title="Calendar">
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
      </SectionCard>

      <SectionCard title="Outreach">
        <Text style={styles.bodyText} allowFontScaling>
          Outreach opportunities will appear here.
        </Text>
        <PrimaryButton title="View Outreach (Coming Soon)" onPress={() => {}} disabled />
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
});
