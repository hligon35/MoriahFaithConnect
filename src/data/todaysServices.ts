export type TodayService = {
  id: string;
  title: string;
  timeLabel: string;
  locationLabel: string;
  itinerary?: string[];
};

export function getTodaysServices(date: Date = new Date()): TodayService[] {
  // Placeholder logic. Replace with real schedule from backend later.
  // JS: 0=Sunday ... 6=Saturday
  const day = date.getDay();

  if (day === 0) {
    return [
      {
        id: 'svc-sun-school',
        title: 'Sunday School',
        timeLabel: '9:30 AM',
        locationLabel: 'Education Wing',
        itinerary: ['Welcome', 'Lesson', 'Discussion', 'Prayer'],
      },
      {
        id: 'svc-sun-worship',
        title: 'Morning Worship',
        timeLabel: '11:00 AM',
        locationLabel: 'Sanctuary / Live Stream',
        itinerary: ['Welcome', 'Prayer', 'Worship', 'Message', 'Benediction'],
      },
      {
        id: 'svc-sun-youth',
        title: 'Youth Focus',
        timeLabel: '5:00 PM',
        locationLabel: 'Youth Center',
        itinerary: ['Welcome', 'Worship', 'Message', 'Small Groups', 'Closing Prayer'],
      },
    ];
  }

  if (day === 3) {
    return [
      {
        id: 'svc-wed-study',
        title: 'Bible Study',
        timeLabel: '6:30 PM',
        locationLabel: 'Fellowship Hall',
        itinerary: ['Welcome', 'Study', 'Discussion', 'Prayer'],
      },
    ];
  }

  return [
    {
      id: 'svc-prayer',
      title: 'Prayer',
      timeLabel: 'Today',
      locationLabel: 'See Events for schedule',
      itinerary: ['Itinerary coming soon.'],
    },
  ];
}
