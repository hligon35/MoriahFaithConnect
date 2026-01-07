import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DirectoryMember } from '../data/churchDirectory';
import type { Ministry } from '../data/ministries';
import type { PrayerWallEntry } from '../data/prayerWall';

const DIRECTORY_KEY = 'mfc.admin.community.directory.v1';
const MINISTRIES_KEY = 'mfc.admin.community.ministries.v1';
const PRAYERS_KEY = 'mfc.admin.community.prayers.v1';

type DirectoryMemberNoPhoto = Omit<DirectoryMember, 'photo'>;

export async function loadDirectoryOverride(): Promise<DirectoryMemberNoPhoto[] | null> {
  try {
    const raw = await AsyncStorage.getItem(DIRECTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `m-${Date.now()}`,
        name: typeof x.name === 'string' ? x.name : 'Member',
        role: typeof x.role === 'string' ? x.role : 'Member',
        email: typeof x.email === 'string' ? x.email : '',
        phone: typeof x.phone === 'string' ? x.phone : '',
        address: typeof x.address === 'string' ? x.address : '',
      }));
  } catch {
    return null;
  }
}

export async function saveDirectoryOverride(members: DirectoryMemberNoPhoto[]): Promise<void> {
  await AsyncStorage.setItem(DIRECTORY_KEY, JSON.stringify(members));
}

export async function loadMinistriesOverride(): Promise<Ministry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(MINISTRIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `min-${Date.now()}`,
        name: typeof x.name === 'string' ? x.name : 'Ministry',
        summary: typeof x.summary === 'string' ? x.summary : '',
        contactName: typeof x.contactName === 'string' ? x.contactName : '',
        contactRole: typeof x.contactRole === 'string' ? x.contactRole : '',
        contactEmail: typeof x.contactEmail === 'string' ? x.contactEmail : '',
        contactPhone: typeof x.contactPhone === 'string' ? x.contactPhone : '',
        meetingSchedule: typeof x.meetingSchedule === 'string' ? x.meetingSchedule : '',
        members: Array.isArray(x.members) ? x.members.filter((m: any) => typeof m === 'string') : [],
      }));
  } catch {
    return null;
  }
}

export async function saveMinistriesOverride(items: Ministry[]): Promise<void> {
  await AsyncStorage.setItem(MINISTRIES_KEY, JSON.stringify(items));
}

export async function loadPrayersOverride(): Promise<PrayerWallEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(PRAYERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `pw-${Date.now()}`,
        name: typeof x.name === 'string' ? x.name : '',
        createdAt: typeof x.createdAt === 'string' ? x.createdAt : new Date().toISOString(),
      }))
      .filter((x) => !!x.name);
  } catch {
    return null;
  }
}

export async function savePrayersOverride(entries: PrayerWallEntry[]): Promise<void> {
  await AsyncStorage.setItem(PRAYERS_KEY, JSON.stringify(entries));
}
