// Deterministic "today's chapter" — same passage for everyone, every day.
// Rotates through a curated set of high-impact passages so every day feels
// fresh without requiring server state.

export type DailyPick = {
  bibleId: string;
  bookId: string;
  bookName: string;
  chapter: string;
  blurb: string;
};

// Default canonical Bible to use when "today" needs one. Picked because it
// reliably exists on api.bible. ESV English (de4e12af7f28f599-02 = KJV public).
const DEFAULT_BIBLE = "de4e12af7f28f599-02"; // KJV (PD)

// 31 picks — one per day-of-month. Curated from across the canon.
// Format: [bookId, bookName, chapter, blurb]
const PICKS: [string, string, string, string][] = [
  ["GEN", "Genesis", "1", "The opening — light, sky, sea, beasts, image."],
  ["PSA", "Psalms", "23", "The shepherd and the valley."],
  ["MAT", "Matthew", "5", "The Sermon on the Mount opens."],
  ["JHN", "John", "1", "In the beginning was the Word."],
  ["ECC", "Ecclesiastes", "3", "A time for everything."],
  ["GEN", "Genesis", "3", "The garden, the snake, the question."],
  ["PSA", "Psalms", "139", "Searched and known."],
  ["1CO", "1 Corinthians", "13", "If I have not love."],
  ["MAT", "Matthew", "6", "Lilies, sparrows, the prayer."],
  ["JHN", "John", "15", "I am the vine."],
  ["EXO", "Exodus", "3", "The bush that burned and was not consumed."],
  ["PSA", "Psalms", "1", "The blessed and the chaff."],
  ["LUK", "Luke", "15", "Three lost things."],
  ["ROM", "Romans", "8", "No condemnation, no separation."],
  ["GEN", "Genesis", "12", "Go, from your country."],
  ["PSA", "Psalms", "51", "Have mercy on me."],
  ["MAT", "Matthew", "13", "Parables of the kingdom."],
  ["PHP", "Philippians", "4", "Whatever is true, whatever is honourable."],
  ["ISA", "Isaiah", "40", "Comfort, comfort my people."],
  ["JHN", "John", "11", "I am the resurrection and the life."],
  ["GEN", "Genesis", "22", "The binding."],
  ["PSA", "Psalms", "121", "I lift up my eyes."],
  ["MRK", "Mark", "1", "The beginning of the gospel."],
  ["JAS", "James", "1", "Count it all joy."],
  ["EXO", "Exodus", "20", "The ten words."],
  ["PRO", "Proverbs", "3", "Trust in the LORD with all your heart."],
  ["LUK", "Luke", "10", "The good Samaritan."],
  ["EPH", "Ephesians", "2", "By grace you have been saved."],
  ["PSA", "Psalms", "100", "Make a joyful noise."],
  ["JHN", "John", "3", "For God so loved the world."],
  ["REV", "Revelation", "21", "Behold, I make all things new."],
];

export function todaysPick(date: Date = new Date()): DailyPick {
  const dayOfMonth = date.getDate(); // 1-31
  const idx = (dayOfMonth - 1) % PICKS.length;
  const [bookId, bookName, chapter, blurb] = PICKS[idx];
  return {
    bibleId: DEFAULT_BIBLE,
    bookId,
    bookName,
    chapter,
    blurb,
  };
}

export function todaysISO(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
