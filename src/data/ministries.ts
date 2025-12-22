export type Ministry = {
  id: string;
  name: string;
  summary: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  meetingSchedule: string;
  members: string[];
};

export const ministries: Ministry[] = [
  {
    id: 'min-ushers',
    name: 'Ushers Ministry',
    summary: 'Hospitality and seating support during worship services.',
    contactName: 'Deacon James Harris',
    contactRole: 'Ministry Lead',
    contactEmail: 'ushers@moriahfaithconnect.org',
    contactPhone: '+1 (555) 010-1200',
    meetingSchedule: '1st Saturday • 10:00 AM • Fellowship Hall',
    members: ['Sister Johnson', 'Brother Williams', 'Sister Clark', 'Brother Davis'],
  },
  {
    id: 'min-music',
    name: 'Music Ministry',
    summary: 'Praise team, musicians, and worship planning.',
    contactName: 'Minister Alicia Thompson',
    contactRole: 'Worship Leader',
    contactEmail: 'music@moriahfaithconnect.org',
    contactPhone: '+1 (555) 010-1300',
    meetingSchedule: 'Wednesdays • 7:30 PM • Sanctuary',
    members: ['Praise Team', 'Choir', 'Band'],
  },
  {
    id: 'min-youth',
    name: 'Youth Ministry',
    summary: 'Discipleship, events, and mentorship for youth.',
    contactName: 'Sister Naomi Green',
    contactRole: 'Youth Director',
    contactEmail: 'youth@moriahfaithconnect.org',
    contactPhone: '+1 (555) 010-1400',
    meetingSchedule: 'Sundays • 5:00 PM • Youth Center',
    members: ['Youth Leaders', 'Young Adults Team'],
  },
];
