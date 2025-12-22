import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrivacySettings = {
  email: boolean;
  phone: boolean;
  address: boolean;
};

const STORAGE_KEY = 'mfc.privacy.settings.v1';

export const defaultPrivacySettings: PrivacySettings = {
  email: true,
  phone: true,
  address: true,
};

export async function loadPrivacySettings(): Promise<PrivacySettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrivacySettings;

    const parsed = JSON.parse(raw) as Partial<PrivacySettings>;
    return {
      email: typeof parsed.email === 'boolean' ? parsed.email : defaultPrivacySettings.email,
      phone: typeof parsed.phone === 'boolean' ? parsed.phone : defaultPrivacySettings.phone,
      address: typeof parsed.address === 'boolean' ? parsed.address : defaultPrivacySettings.address,
    };
  } catch {
    return defaultPrivacySettings;
  }
}

export async function savePrivacySettings(next: PrivacySettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
