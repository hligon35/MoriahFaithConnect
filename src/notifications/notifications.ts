import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { getEventReminderMap, getLiveAlertId, setEventReminderMap, setLiveAlertId } from './notificationStore';

// Keep notifications predictable in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  // On simulators, notifications may be limited.
  // Still request permissions so the UX is consistent.
  if (!Device.isDevice) {
    // Allow on emulator; Expo will still show local notifications in many cases.
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;

  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

export function formatLocalDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function scheduleTestNotification(): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Moriah Faith Connect',
      body: 'Test alert delivered successfully.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
}

function nextSundayAt(hour: number, minute: number) {
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);

  // JS: 0=Sunday ... 6=Saturday
  const daysUntilSunday = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(hour, minute, 0, 0);

  // If it's already past that time today, jump to next week.
  if (d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 7);
  }

  return d;
}

export async function enableLiveStreamStartAlert(): Promise<{ id: string; scheduledFor: Date }> {
  const scheduledFor = nextSundayAt(11, 0);

  const existingId = await getLiveAlertId();
  if (existingId) {
    // Cancel old one so users don't stack duplicates.
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {
      // ignore
    }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Live stream starting',
      body: 'Tap to open Watch in Moriah Faith Connect.',
      data: { deepLink: 'watch' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledFor,
    },
  });

  await setLiveAlertId(id);
  return { id, scheduledFor };
}

export async function disableLiveStreamStartAlert(): Promise<void> {
  const id = await getLiveAlertId();
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
  await setLiveAlertId(null);
}

export async function getLiveStreamAlertStatus(): Promise<{ enabled: boolean; id?: string }> {
  const id = await getLiveAlertId();
  return { enabled: !!id, id: id ?? undefined };
}

export async function toggleEventReminder(eventId: string, title: string, startsAt: Date): Promise<{ enabled: boolean }>{
  const map = await getEventReminderMap();
  const existing = map[eventId];

  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing);
    } catch {
      // ignore
    }
    const next = { ...map };
    delete next[eventId];
    await setEventReminderMap(next);
    return { enabled: false };
  }

  // Default reminder: 1 hour before (but never in the past)
  const remindAt = new Date(startsAt.getTime() - 60 * 60 * 1000);
  const now = new Date();
  const triggerDate = remindAt.getTime() > now.getTime() ? remindAt : new Date(now.getTime() + 5 * 1000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Event reminder',
      body: `${title} starts soon.`,
      data: { deepLink: 'events', eventId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  await setEventReminderMap({ ...map, [eventId]: id });
  return { enabled: true };
}

export async function isEventReminderEnabled(eventId: string): Promise<boolean> {
  const map = await getEventReminderMap();
  return !!map[eventId];
}
