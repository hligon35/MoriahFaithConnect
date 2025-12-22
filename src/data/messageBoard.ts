export type MessageBoardPost = {
  id: string;
  title: string;
  body: string;
  postedAtIso: string;
  pinned?: boolean;
};

export function getMessageBoardPosts(date: Date = new Date()): MessageBoardPost[] {
  // Placeholder content. Replace with backend data later.
  // Keep posts short and actionable for congregation updates.
  const year = date.getFullYear();

  return [
    {
      id: 'msg-pinned-service-time',
      title: 'Service Time Reminder',
      body: 'Morning Worship starts at 11:00 AM. Invite someone to join you in person or online.',
      postedAtIso: `${year}-12-01T09:00:00.000Z`,
      pinned: true,
    },
    {
      id: 'msg-weather-parking',
      title: 'Parking & Weather',
      body: 'Please use extra caution in the lot. Overflow parking is available near the Fellowship Hall.',
      postedAtIso: `${year}-12-10T18:30:00.000Z`,
    },
    {
      id: 'msg-youth-announcement',
      title: 'Youth Announcement',
      body: 'Youth Focus meets today at 5:00 PM in the Youth Center. Parents are welcome to attend.',
      postedAtIso: `${year}-12-15T16:00:00.000Z`,
    },
  ];
}
