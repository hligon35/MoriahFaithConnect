import AsyncStorage from '@react-native-async-storage/async-storage';

export type ArchiveCategory = {
  id: string;
  title: string;
  description: string;
};

const STORAGE_KEY = 'mfc.admin.watch.archiveCategories.v1';

export async function loadArchiveCategories(): Promise<ArchiveCategory[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : `cat-${Date.now()}`,
        title: typeof x.title === 'string' ? x.title : 'Category',
        description: typeof x.description === 'string' ? x.description : '',
      }));
  } catch {
    return null;
  }
}

export async function saveArchiveCategories(categories: ArchiveCategory[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}
