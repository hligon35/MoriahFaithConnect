import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mfc.admin.enabled.v1';
const VIEW_KEY = 'mfc.admin.viewOnly.v1';

export async function loadAdminEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { enabled?: unknown };
    return typeof parsed.enabled === 'boolean' ? parsed.enabled : false;
  } catch {
    return false;
  }
}

export async function saveAdminEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled }));
}

export async function loadAdminViewOnly(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(VIEW_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { viewOnly?: unknown };
    return typeof parsed.viewOnly === 'boolean' ? parsed.viewOnly : false;
  } catch {
    return false;
  }
}

export async function saveAdminViewOnly(viewOnly: boolean): Promise<void> {
  await AsyncStorage.setItem(VIEW_KEY, JSON.stringify({ viewOnly }));
}
