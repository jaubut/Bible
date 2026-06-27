const BASE = "https://rest.api.bible/v1";

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

import {
  isExtraBibleId,
  listExtraBibles,
  listExtraBooks,
  listExtraChapters,
  getExtraPassage,
} from "./extra-books";
import {
  isLocalBibleId,
  listLocalBibles,
  listLocalBooks,
  listLocalChapters,
  getLocalPassage,
} from "./local-bibles";

export const bibleApi = {
  listBibles: async (lang?: string): Promise<Bible[]> => {
    const remote = await get<Bible[]>(
      lang ? `/bibles?language=${encodeURIComponent(lang)}` : "/bibles",
    );
    // Append our bundled public-domain bibles (full local canons + single-work
    // Pseudepigrapha) when no language filter is set or when filtering English.
    if (!lang || lang === "eng") {
      return [...remote, ...listLocalBibles(), ...listExtraBibles()];
    }
    return remote;
  },
  listBooks: (bibleId: string): Promise<Book[]> => {
    if (isLocalBibleId(bibleId)) return Promise.resolve(listLocalBooks(bibleId));
    if (isExtraBibleId(bibleId)) return Promise.resolve(listExtraBooks(bibleId));
    return get<Book[]>(`/bibles/${bibleId}/books`);
  },
  listChapters: (bibleId: string, bookId: string): Promise<Chapter[]> => {
    if (isLocalBibleId(bibleId))
      return Promise.resolve(listLocalChapters(bibleId, bookId));
    if (isExtraBibleId(bibleId)) return Promise.resolve(listExtraChapters(bibleId));
    return get<Chapter[]>(`/bibles/${bibleId}/books/${bookId}/chapters`);
  },
  getPassage: (bibleId: string, passageId: string): Promise<Passage> => {
    if (isLocalBibleId(bibleId)) {
      const p = getLocalPassage(bibleId, passageId);
      if (!p) {
        return Promise.reject(new Error(`Passage not found: ${passageId}`));
      }
      return Promise.resolve(p);
    }
    if (isExtraBibleId(bibleId)) {
      const p = getExtraPassage(bibleId, passageId);
      if (!p) {
        return Promise.reject(new Error(`Passage not found: ${passageId}`));
      }
      return Promise.resolve(p);
    }
    return get<Passage>(
      `/bibles/${bibleId}/passages/${encodeURIComponent(passageId)}` +
        `?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=true`,
    );
  },
};

const ETHIOPIAN_LANG_CODES = ["amh", "gez", "tir", "orm", "gaz"];

export function isEthiopian(b: Bible): boolean {
  return ETHIOPIAN_LANG_CODES.includes(b.language.id);
}
