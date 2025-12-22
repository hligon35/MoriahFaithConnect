export type WordOfDay = {
  title: string;
  word: string;
  message: string;
};

const words: Array<Omit<WordOfDay, 'title'>> = [
  {
    word: 'Faith',
    message: 'Choose trust over fear today.',
  },
  {
    word: 'Hope',
    message: 'Hold on—better days can still come.',
  },
  {
    word: 'Grace',
    message: 'Give and receive kindness freely.',
  },
  {
    word: 'Peace',
    message: 'Slow down and breathe; you are not alone.',
  },
  {
    word: 'Love',
    message: 'Lead with compassion in every conversation.',
  },
];

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getWordOfDay(date: Date = new Date()): WordOfDay {
  const index = dayOfYear(date) % words.length;
  const selection = words[index] ?? words[0];

  return {
    title: 'Word of the Day',
    ...selection,
  };
}
