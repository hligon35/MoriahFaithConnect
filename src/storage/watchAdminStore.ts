import AsyncStorage from '@react-native-async-storage/async-storage';

export type ArchiveCategory = {
  id: string;
  title: string;
  description: string;
};

export type ArchiveMedia = {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
};

export type ArchiveItem = {
  id: string;
  categoryId: string;
  title: string;
  details: string;
  location: string;
  createdAtIso: string;
  media: ArchiveMedia[];
};

const STORAGE_KEY = 'mfc.admin.watch.archiveCategories.v1';
const ITEMS_KEY = 'mfc.admin.watch.archiveItems.v1';

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

export async function loadArchiveItems(): Promise<ArchiveItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => {
        const mediaRaw = Array.isArray(x.media) ? x.media : [];
        const media = mediaRaw
          .filter((m: any) => m && typeof m === 'object')
          .map((m: any) => ({
            id: typeof m.id === 'string' ? m.id : `media-${Date.now()}`,
            uri: typeof m.uri === 'string' ? m.uri : '',
            name: typeof m.name === 'string' ? m.name : 'file',
            mimeType: typeof m.mimeType === 'string' ? m.mimeType : undefined,
          }))
          .filter((m: any) => !!m.uri);

        return {
          id: typeof x.id === 'string' ? x.id : `item-${Date.now()}`,
          categoryId: typeof x.categoryId === 'string' ? x.categoryId : '',
          title: typeof x.title === 'string' ? x.title : '',
          details: typeof x.details === 'string' ? x.details : '',
          location: typeof x.location === 'string' ? x.location : '',
          createdAtIso: typeof x.createdAtIso === 'string' ? x.createdAtIso : new Date().toISOString(),
          media,
        } as ArchiveItem;
      })
      .filter((x) => !!x.categoryId && !!x.title);
  } catch {
    return null;
  }
}

export async function saveArchiveItems(items: ArchiveItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}
