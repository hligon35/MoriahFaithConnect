export type ChurchEvent = {
  id: string;
  title: string;
  startsAt: string; // ISO string
  location: string;
};

// Placeholder events (swap for API later)
export const events: ChurchEvent[] = [
  {
    id: 'e-001',
    title: 'Bible Study',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    location: 'Fellowship Hall',
  },
  {
    id: 'e-002',
    title: 'Community Outreach',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    location: 'Church Parking Lot',
  },
  {
    id: 'e-003',
    title: 'Youth Night',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    location: 'Youth Center',
  },
];
