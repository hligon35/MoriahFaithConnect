export type PrayerWallEntry = {
  id: string;
  name: string;
  createdAt: string;
};

export const prayerWallEntries: PrayerWallEntry[] = [
  { id: 'pw-001', name: 'Sister Johnson', createdAt: '2026-01-06T13:00:00.000Z' },
  { id: 'pw-002', name: 'Brother Williams', createdAt: '2026-01-06T10:00:00.000Z' },
  { id: 'pw-003', name: 'The Smith Family', createdAt: '2026-01-05T15:00:00.000Z' },
  { id: 'pw-004', name: 'Deacon Harris', createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'pw-005', name: 'Mother Thompson', createdAt: '2026-01-04T18:00:00.000Z' },
  { id: 'pw-006', name: 'Pastor & First Lady', createdAt: '2026-01-04T09:00:00.000Z' },
  { id: 'pw-007', name: 'Youth & Young Adults', createdAt: '2026-01-03T12:00:00.000Z' },
  { id: 'pw-008', name: 'Those traveling', createdAt: '2026-01-03T07:00:00.000Z' },
  { id: 'pw-009', name: 'Those recovering', createdAt: '2026-01-02T16:00:00.000Z' },
  { id: 'pw-010', name: 'Our community schools', createdAt: '2026-01-01T20:00:00.000Z' },
];
