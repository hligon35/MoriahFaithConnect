import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChurchEvent } from '../data/events';

const STORAGE_KEY = 'mfc.admin.events.v1';

export async function loadAdminEvents(): Promise<ChurchEvent[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const normalized: ChurchEvent[] = parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `e-${Date.now()}`,
        title: typeof x.title === 'string' ? x.title : 'Event',
        startsAt: typeof x.startsAt === 'string' ? x.startsAt : new Date().toISOString(),
        location: typeof x.location === 'string' ? x.location : 'TBD',
      }));

    return normalized;
  } catch {
    return null;
  }
}

export async function saveAdminEvents(events: ChurchEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
