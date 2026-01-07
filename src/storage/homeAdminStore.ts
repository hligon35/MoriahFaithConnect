import AsyncStorage from '@react-native-async-storage/async-storage';

export type WordScheduleEntry = {
  id: string;
  dateKey: string; // YYYY-MM-DD
  scripture: string;
  message: string;
};

export type AnnouncementDraft = {
  id: string;
  title: string;
  body: string;
  postedAtIso: string;
  pinned?: boolean;
};

export type ServiceExtra = {
  id: string;
  title: string;
  timeLabel: string;
  locationLabel: string;
  itinerary?: string[];
};

const WORD_KEY = 'mfc.admin.wordSchedule.v1';
const ANNOUNCEMENTS_KEY = 'mfc.admin.announcements.v1';
const SERVICE_EXTRAS_KEY = 'mfc.admin.serviceExtrasByDate.v1';
const SERVICE_ITINERARY_KEY = 'mfc.admin.serviceItineraryById.v1';

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadWordSchedule(): Promise<WordScheduleEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WORD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `w-${Date.now()}`,
        dateKey: typeof x.dateKey === 'string' ? x.dateKey : '',
        scripture: typeof x.scripture === 'string' ? x.scripture : '',
        message: typeof x.message === 'string' ? x.message : '',
      }))
      .filter((x) => !!x.dateKey && !!x.scripture && !!x.message);
  } catch {
    return [];
  }
}

export async function saveWordSchedule(entries: WordScheduleEntry[]): Promise<void> {
  await AsyncStorage.setItem(WORD_KEY, JSON.stringify(entries));
}

export async function loadAnnouncements(): Promise<AnnouncementDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `a-${Date.now()}`,
        title: typeof x.title === 'string' ? x.title : '',
        body: typeof x.body === 'string' ? x.body : '',
        postedAtIso: typeof x.postedAtIso === 'string' ? x.postedAtIso : new Date().toISOString(),
        pinned: typeof x.pinned === 'boolean' ? x.pinned : undefined,
      }))
      .filter((x) => !!x.title && !!x.body);
  } catch {
    return [];
  }
}

export async function saveAnnouncements(posts: AnnouncementDraft[]): Promise<void> {
  await AsyncStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(posts));
}

export async function loadServiceExtrasByDate(): Promise<Record<string, ServiceExtra[]>> {
  try {
    const raw = await AsyncStorage.getItem(SERVICE_EXTRAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, ServiceExtra[]>;
  } catch {
    return {};
  }
}

export async function saveServiceExtrasByDate(map: Record<string, ServiceExtra[]>): Promise<void> {
  await AsyncStorage.setItem(SERVICE_EXTRAS_KEY, JSON.stringify(map));
}

export async function loadServiceItineraryById(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(SERVICE_ITINERARY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

export async function saveServiceItineraryById(map: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(SERVICE_ITINERARY_KEY, JSON.stringify(map));
}
