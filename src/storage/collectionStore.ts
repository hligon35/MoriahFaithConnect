import AsyncStorage from '@react-native-async-storage/async-storage';

export type CollectionKind = 'donation' | 'tithe';

export type CollectionEntry = {
  id: string;
  kind: CollectionKind;
  amountCents: number;
  recordedAtIso: string;
  userId?: string;
};

export type CollectionTotals = {
  donationsCents: number;
  tithesCents: number;
};

const STORAGE_KEY = 'mfc.collection.entries.v1';

export function computeTotals(entries: CollectionEntry[]): CollectionTotals {
  let donationsCents = 0;
  let tithesCents = 0;

  for (const entry of entries) {
    if (entry.kind === 'donation') donationsCents += entry.amountCents;
    if (entry.kind === 'tithe') tithesCents += entry.amountCents;
  }

  return { donationsCents, tithesCents };
}

export async function loadCollectionEntries(): Promise<CollectionEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((e) => e && typeof e === 'object')
      .map((e: any) => {
        const kind = e.kind === 'donation' || e.kind === 'tithe' ? e.kind : 'donation';
        const amountCents = Number.isFinite(Number(e.amountCents)) ? Math.max(0, Math.trunc(Number(e.amountCents))) : 0;
        const recordedAtIso = typeof e.recordedAtIso === 'string' ? e.recordedAtIso : new Date().toISOString();
        const id = typeof e.id === 'string' ? e.id : `col-${Date.now()}`;
        const userId = typeof e.userId === 'string' ? e.userId : undefined;

        return { id, kind, amountCents, recordedAtIso, userId } as CollectionEntry;
      });
  } catch {
    return [];
  }
}

export async function saveCollectionEntries(entries: CollectionEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function addCollectionEntry(input: {
  kind: CollectionKind;
  amountCents: number;
  userId?: string;
  recordedAt?: Date;
}): Promise<CollectionEntry[]> {
  const entries = await loadCollectionEntries();
  const next: CollectionEntry = {
    id: `col-${Date.now()}`,
    kind: input.kind,
    amountCents: Math.max(0, Math.trunc(input.amountCents)),
    recordedAtIso: (input.recordedAt ?? new Date()).toISOString(),
    userId: input.userId,
  };

  const updated = [next, ...entries];
  await saveCollectionEntries(updated);
  return updated;
}

function csvEscape(value: string) {
  const v = value.replace(/\r?\n/g, ' ');
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportCollectionCsv(entries: CollectionEntry[]): string {
  const header = ['id', 'kind', 'amountCents', 'recordedAtIso', 'userId'].join(',');
  const lines = entries.map((e) => {
    return [
      csvEscape(e.id),
      csvEscape(e.kind),
      String(e.amountCents),
      csvEscape(e.recordedAtIso),
      csvEscape(e.userId ?? ''),
    ].join(',');
  });
  return [header, ...lines].join('\n');
}
