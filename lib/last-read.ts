// Track the last chapter the user was reading so we can offer "Continue" on home.

const KEY = "bible-last-read";

export type LastRead = {
  bibleId: string;
  bookId: string;
  bookName: string;
  chapter: string;
  ts: number;
};

export function saveLastRead(v: LastRead): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore quota errors */
  }
}

export function readLastRead(): LastRead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as LastRead;
    if (typeof v.bibleId === "string" && typeof v.chapter === "string") return v;
  } catch {
    /* ignore */
  }
  return null;
}
