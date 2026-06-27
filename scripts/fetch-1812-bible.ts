#!/usr/bin/env bun
// One-time fetcher for the 1812 Holy Bible (King James, with Apocrypha).
//
// The felzbooks.com "1812 Bible" facsimile is behind a login, so we ingest the
// faithful public-domain equivalent: the King James text (1769 standardization)
// with the 14 Apocrypha books bound between the Old and New Testaments — exactly
// how the 1812 edition arranged them.
//
// Source: scrollmapper/bible_databases — KJVA (gloss-free)
// Run with: bun scripts/fetch-1812-bible.ts
//
// Output: data/local-bibles/1812-kjva.json  (a full multi-book LocalBible)

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJVA.json";

// scrollmapper book name → [USFM id, display name, abbreviation], in canon order.
// Apocrypha (rows 40–53) sit between Malachi and Matthew, as in the 1812 binding.
const BOOK_MAP: [string, string, string, string][] = [
  ["Genesis", "GEN", "Genesis", "Gen"],
  ["Exodus", "EXO", "Exodus", "Exo"],
  ["Leviticus", "LEV", "Leviticus", "Lev"],
  ["Numbers", "NUM", "Numbers", "Num"],
  ["Deuteronomy", "DEU", "Deuteronomy", "Deu"],
  ["Joshua", "JOS", "Joshua", "Jos"],
  ["Judges", "JDG", "Judges", "Jdg"],
  ["Ruth", "RUT", "Ruth", "Rut"],
  ["I Samuel", "1SA", "1 Samuel", "1Sa"],
  ["II Samuel", "2SA", "2 Samuel", "2Sa"],
  ["I Kings", "1KI", "1 Kings", "1Ki"],
  ["II Kings", "2KI", "2 Kings", "2Ki"],
  ["I Chronicles", "1CH", "1 Chronicles", "1Ch"],
  ["II Chronicles", "2CH", "2 Chronicles", "2Ch"],
  ["Ezra", "EZR", "Ezra", "Ezr"],
  ["Nehemiah", "NEH", "Nehemiah", "Neh"],
  ["Esther", "EST", "Esther", "Est"],
  ["Job", "JOB", "Job", "Job"],
  ["Psalms", "PSA", "Psalms", "Psa"],
  ["Proverbs", "PRO", "Proverbs", "Pro"],
  ["Ecclesiastes", "ECC", "Ecclesiastes", "Ecc"],
  ["Song of Solomon", "SNG", "Song of Solomon", "Sng"],
  ["Isaiah", "ISA", "Isaiah", "Isa"],
  ["Jeremiah", "JER", "Jeremiah", "Jer"],
  ["Lamentations", "LAM", "Lamentations", "Lam"],
  ["Ezekiel", "EZK", "Ezekiel", "Ezk"],
  ["Daniel", "DAN", "Daniel", "Dan"],
  ["Hosea", "HOS", "Hosea", "Hos"],
  ["Joel", "JOL", "Joel", "Jol"],
  ["Amos", "AMO", "Amos", "Amo"],
  ["Obadiah", "OBA", "Obadiah", "Oba"],
  ["Jonah", "JON", "Jonah", "Jon"],
  ["Micah", "MIC", "Micah", "Mic"],
  ["Nahum", "NAM", "Nahum", "Nam"],
  ["Habakkuk", "HAB", "Habakkuk", "Hab"],
  ["Zephaniah", "ZEP", "Zephaniah", "Zep"],
  ["Haggai", "HAG", "Haggai", "Hag"],
  ["Zechariah", "ZEC", "Zechariah", "Zec"],
  ["Malachi", "MAL", "Malachi", "Mal"],
  // — Apocrypha —
  ["I Esdras", "1ES", "1 Esdras", "1Es"],
  ["II Esdras", "2ES", "2 Esdras", "2Es"],
  ["Tobit", "TOB", "Tobit", "Tob"],
  ["Judith", "JDT", "Judith", "Jdt"],
  ["Additions to Esther", "ESG", "Additions to Esther", "AEs"],
  ["Wisdom", "WIS", "Wisdom of Solomon", "Wis"],
  ["Sirach", "SIR", "Sirach (Ecclesiasticus)", "Sir"],
  ["Baruch", "BAR", "Baruch", "Bar"],
  ["Prayer of Azariah", "S3Y", "Prayer of Azariah", "S3Y"],
  ["Susanna", "SUS", "Susanna", "Sus"],
  ["Bel and the Dragon", "BEL", "Bel and the Dragon", "Bel"],
  ["Prayer of Manasses", "MAN", "Prayer of Manasseh", "Man"],
  ["I Maccabees", "1MA", "1 Maccabees", "1Ma"],
  ["II Maccabees", "2MA", "2 Maccabees", "2Ma"],
  // — New Testament —
  ["Matthew", "MAT", "Matthew", "Mat"],
  ["Mark", "MRK", "Mark", "Mrk"],
  ["Luke", "LUK", "Luke", "Luk"],
  ["John", "JHN", "John", "Jhn"],
  ["Acts", "ACT", "Acts", "Act"],
  ["Romans", "ROM", "Romans", "Rom"],
  ["I Corinthians", "1CO", "1 Corinthians", "1Co"],
  ["II Corinthians", "2CO", "2 Corinthians", "2Co"],
  ["Galatians", "GAL", "Galatians", "Gal"],
  ["Ephesians", "EPH", "Ephesians", "Eph"],
  ["Philippians", "PHP", "Philippians", "Php"],
  ["Colossians", "COL", "Colossians", "Col"],
  ["I Thessalonians", "1TH", "1 Thessalonians", "1Th"],
  ["II Thessalonians", "2TH", "2 Thessalonians", "2Th"],
  ["I Timothy", "1TI", "1 Timothy", "1Ti"],
  ["II Timothy", "2TI", "2 Timothy", "2Ti"],
  ["Titus", "TIT", "Titus", "Tit"],
  ["Philemon", "PHM", "Philemon", "Phm"],
  ["Hebrews", "HEB", "Hebrews", "Heb"],
  ["James", "JAS", "James", "Jas"],
  ["I Peter", "1PE", "1 Peter", "1Pe"],
  ["II Peter", "2PE", "2 Peter", "2Pe"],
  ["I John", "1JN", "1 John", "1Jn"],
  ["II John", "2JN", "2 John", "2Jn"],
  ["III John", "3JN", "3 John", "3Jn"],
  ["Jude", "JUD", "Jude", "Jud"],
  ["Revelation of John", "REV", "Revelation", "Rev"],
];

type SrcVerse = { verse: number; text: string };
type SrcChapter = { chapter: number; verses: SrcVerse[] };
type SrcBook = { name: string; chapters: SrcChapter[] };
type SrcRoot = { translation: string; books: SrcBook[] };

type Verse = { number: string; text: string };
type Chapter = { number: string; verses: Verse[] };
type OutBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapters: Chapter[];
};
type LocalBible = {
  id: string;
  name: string;
  abbreviation: string;
  language: { id: string; name: string; nameLocal: string };
  copyright: string;
  books: OutBook[];
};

function cleanText(s: string): string {
  return s.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

const OUT_DIR = join(process.cwd(), "data", "local-bibles");
mkdirSync(OUT_DIR, { recursive: true });

console.log("Fetching KJVA from scrollmapper...");
const res = await fetch(SRC);
if (!res.ok) throw new Error(`source HTTP ${res.status}`);
const root = (await res.json()) as SrcRoot;

const byName = new Map(root.books.map((b) => [b.name, b]));
if (root.books.length !== BOOK_MAP.length) {
  console.warn(
    `Source has ${root.books.length} books; map has ${BOOK_MAP.length}.`,
  );
}

const books: OutBook[] = BOOK_MAP.map(([srcName, id, name, abbreviation]) => {
  const src = byName.get(srcName);
  if (!src) throw new Error(`Source missing book: "${srcName}"`);
  const chapters: Chapter[] = src.chapters.map((c) => ({
    number: c.chapter.toString(),
    verses: c.verses.map((v) => ({
      number: v.verse.toString(),
      text: cleanText(v.text),
    })),
  }));
  return { id, name, abbreviation, chapters };
});

const out: LocalBible = {
  id: "1812-kjva",
  name: "Holy Bible, 1812 (King James, with Apocrypha)",
  abbreviation: "KJVA1812",
  language: { id: "eng", name: "English", nameLocal: "English" },
  copyright:
    "Public domain — King James Version (1769 standardization) with the Apocrypha; representing the text and contents of the 1812 edition.",
  books,
};

writeFileSync(join(OUT_DIR, "1812-kjva.json"), JSON.stringify(out));

const totalChapters = books.reduce((a, b) => a + b.chapters.length, 0);
const totalVerses = books.reduce(
  (a, b) => a + b.chapters.reduce((x, c) => x + c.verses.length, 0),
  0,
);
console.log(
  `Wrote data/local-bibles/1812-kjva.json — ${books.length} books, ${totalChapters} chapters, ${totalVerses} verses`,
);
