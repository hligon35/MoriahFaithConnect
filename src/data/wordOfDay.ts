export type WordOfDay = {
  title: string;
  word: string;
  message: string;
};

const words: Array<Omit<WordOfDay, 'title'>> = [
  {
    word: 'Isaiah 40:31 (KJV)',
    message:
      '“But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.”',
  },
  {
    word: 'Jeremiah 29:11 (KJV)',
    message:
      '“For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.”',
  },
  {
    word: 'Proverbs 16:3 (KJV)',
    message:
      '“Commit thy works unto the Lord, and thy thoughts shall be established.”',
  },
  {
    word: 'Isaiah 41:10 (KJV)',
    message:
      '“Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.”',
  },
  {
    word: 'Numbers 6:24–26 (KJV)',
    message:
      '“The Lord bless thee, and keep thee:\nThe Lord make his face shine upon thee, and be gracious unto thee:\nThe Lord lift up his countenance upon thee, and give thee peace.”',
  },
  {
    word: '1 Corinthians 16:14 (KJV)',
    message: '“Let all your things be done with charity.”',
  },
  {
    word: 'Deuteronomy 6:6–7 (KJV)',
    message:
      '“And these words, which I command thee this day, shall be in thine heart:\nAnd thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.”',
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
