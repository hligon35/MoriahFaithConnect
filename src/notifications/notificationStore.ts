import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENT_REMINDERS_KEY = 'mfc.notifications.eventReminders';
const LIVE_ALERT_KEY = 'mfc.notifications.liveAlertId';
const EXPO_PUSH_TOKEN_KEY = 'mfc.notifications.expoPushToken';

type EventReminderMap = Record<string, string>; // eventId -> notificationId

export async function getEventReminderMap(): Promise<EventReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(EVENT_REMINDERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as EventReminderMap;
  } catch {
    return {};
  }
}

export async function setEventReminderMap(map: EventReminderMap): Promise<void> {
  await AsyncStorage.setItem(EVENT_REMINDERS_KEY, JSON.stringify(map));
}

export async function getLiveAlertId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LIVE_ALERT_KEY);
  } catch {
    return null;
  }
}

export async function setLiveAlertId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(LIVE_ALERT_KEY);
    return;
  }
  await AsyncStorage.setItem(LIVE_ALERT_KEY, id);
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setExpoPushToken(token: string | null): Promise<void> {
  if (!token) {
    await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
}
