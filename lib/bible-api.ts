const BASE = "https://api.scripture.api.bible/v1";

function key() {
  const k = process.env.BIBLE_API_KEY;
  if (!k) throw new Error("BIBLE_API_KEY missing");
  return k;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": key() },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`api.bible ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

export type Bible = {
  id: string;
  name: string;
  nameLocal: string;
  abbreviation: string;
  abbreviationLocal: string;
  description?: string;
  language: { id: string; name: string; nameLocal: string };
};

export type Book = {
  id: string;
  bibleId: string;
  name: string;
  nameLong: string;
  abbreviation: string;
};

export type Chapter = {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
};

export type Passage = {
  id: string;
  bibleId: string;
  reference: string;
  content: string;
  verseCount: number;
  copyright?: string;
};

export const bibleApi = {
  listBibles: (lang?: string) =>
    get<Bible[]>(lang ? `/bibles?language=${encodeURIComponent(lang)}` : "/bibles"),
  listBooks: (bibleId: string) => get<Book[]>(`/bibles/${bibleId}/books`),
  listChapters: (bibleId: string, bookId: string) =>
    get<Chapter[]>(`/bibles/${bibleId}/books/${bookId}/chapters`),
  getPassage: (bibleId: string, passageId: string) =>
    get<Passage>(
      `/bibles/${bibleId}/passages/${encodeURIComponent(passageId)}` +
        `?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=true`,
    ),
};

const ETHIOPIAN_LANG_CODES = ["amh", "gez", "tir", "orm"];

export function isEthiopian(b: Bible): boolean {
  return ETHIOPIAN_LANG_CODES.includes(b.language.id);
}
