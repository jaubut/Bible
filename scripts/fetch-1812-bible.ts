#!/usr/bin/env bun
// One-time fetcher for the "1812 Bible" — a full public-domain English canon.
// Run with: bun scripts/fetch-1812-bible.ts
//
// What this is:
//   The 1812 Bible catalogued at https://www.felzbooks.com/books/1812-bible is
//   an early American stereotype printing in the King James / Authorized Version
//   tradition, including the Apocrypha. That felzbooks listing is behind a
//   WordPress login and is not scrapeable. The *text* of an 1812 KJV+Apocrypha
//   printing is the 1769 Authorized Version with the Apocrypha — public domain
//   in the US and Canada (the 1812 American imprint is pre-1929; the KJV's Crown
//   letters-patent only bind the UK).
//
//   We therefore bundle the public-domain KJV+Apocrypha (KJVA) text as the
//   faithful textual equivalent, sourced from getBible.net's CrossWire KJVA
//   module (clean plain text, Strong's numbers stripped).
//
// Source: https://api.getbible.net/v2/kjva.json  (CrossWire / crosswire-bible-society KJVA)
// Output: data/local-bibles/1812-kjva.json  +  data/local-bibles/SOURCE.md

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_URL = "https://api.getbible.net/v2/kjva.json";

// Map getBible book names → USFM book IDs (matching api.bible's convention so
// URLs, passage IDs, and cross-references behave exactly like a remote bible),
// plus the canonical display name BookGrid expects for OT/NT grouping.
const BOOK_MAP: Record<string, { usfm: string; name: string; abbr: string }> = {
  // Old Testament
  Genesis: { usfm: "GEN", name: "Genesis", abbr: "Gen" },
  Exodus: { usfm: "EXO", name: "Exodus", abbr: "Exo" },
  Leviticus: { usfm: "LEV", name: "Leviticus", abbr: "Lev" },
  Numbers: { usfm: "NUM", name: "Numbers", abbr: "Num" },
  Deuteronomy: { usfm: "DEU", name: "Deuteronomy", abbr: "Deu" },
  Joshua: { usfm: "JOS", name: "Joshua", abbr: "Jos" },
  Judges: { usfm: "JDG", name: "Judges", abbr: "Jdg" },
  Ruth: { usfm: "RUT", name: "Ruth", abbr: "Rut" },
  "1 Samuel": { usfm: "1SA", name: "1 Samuel", abbr: "1Sa" },
  "2 Samuel": { usfm: "2SA", name: "2 Samuel", abbr: "2Sa" },
  "1 Kings": { usfm: "1KI", name: "1 Kings", abbr: "1Ki" },
  "2 Kings": { usfm: "2KI", name: "2 Kings", abbr: "2Ki" },
  "1 Chronicles": { usfm: "1CH", name: "1 Chronicles", abbr: "1Ch" },
  "2 Chronicles": { usfm: "2CH", name: "2 Chronicles", abbr: "2Ch" },
  Ezra: { usfm: "EZR", name: "Ezra", abbr: "Ezr" },
  Nehemiah: { usfm: "NEH", name: "Nehemiah", abbr: "Neh" },
  Esther: { usfm: "EST", name: "Esther", abbr: "Est" },
  Job: { usfm: "JOB", name: "Job", abbr: "Job" },
  Psalms: { usfm: "PSA", name: "Psalms", abbr: "Psa" },
  Proverbs: { usfm: "PRO", name: "Proverbs", abbr: "Pro" },
  Ecclesiastes: { usfm: "ECC", name: "Ecclesiastes", abbr: "Ecc" },
  "Song of Solomon": { usfm: "SNG", name: "Song of Solomon", abbr: "Sng" },
  Isaiah: { usfm: "ISA", name: "Isaiah", abbr: "Isa" },
  Jeremiah: { usfm: "JER", name: "Jeremiah", abbr: "Jer" },
  Lamentations: { usfm: "LAM", name: "Lamentations", abbr: "Lam" },
  Ezekiel: { usfm: "EZK", name: "Ezekiel", abbr: "Ezk" },
  Daniel: { usfm: "DAN", name: "Daniel", abbr: "Dan" },
  Hosea: { usfm: "HOS", name: "Hosea", abbr: "Hos" },
  Joel: { usfm: "JOL", name: "Joel", abbr: "Jol" },
  Amos: { usfm: "AMO", name: "Amos", abbr: "Amo" },
  Obadiah: { usfm: "OBA", name: "Obadiah", abbr: "Oba" },
  Jonah: { usfm: "JON", name: "Jonah", abbr: "Jon" },
  Micah: { usfm: "MIC", name: "Micah", abbr: "Mic" },
  Nahum: { usfm: "NAM", name: "Nahum", abbr: "Nam" },
  Habakkuk: { usfm: "HAB", name: "Habakkuk", abbr: "Hab" },
  Zephaniah: { usfm: "ZEP", name: "Zephaniah", abbr: "Zep" },
  Haggai: { usfm: "HAG", name: "Haggai", abbr: "Hag" },
  Zechariah: { usfm: "ZEC", name: "Zechariah", abbr: "Zec" },
  Malachi: { usfm: "MAL", name: "Malachi", abbr: "Mal" },
  // Apocrypha (between OT and NT in KJV+Apocrypha printings)
  "1 Esdras": { usfm: "1ES", name: "1 Esdras", abbr: "1Es" },
  "2 Esdras": { usfm: "2ES", name: "2 Esdras", abbr: "2Es" },
  Tobit: { usfm: "TOB", name: "Tobit", abbr: "Tob" },
  Judith: { usfm: "JDT", name: "Judith", abbr: "Jdt" },
  "Additions to Esther": { usfm: "ESG", name: "Additions to Esther", abbr: "AddEsth" },
  Wisdom: { usfm: "WIS", name: "Wisdom of Solomon", abbr: "Wis" },
  Sirach: { usfm: "SIR", name: "Sirach (Ecclesiasticus)", abbr: "Sir" },
  Baruch: { usfm: "BAR", name: "Baruch", abbr: "Bar" },
  "Prayer of Azariah": { usfm: "S3Y", name: "Prayer of Azariah", abbr: "PrAzar" },
  Susanna: { usfm: "SUS", name: "Susanna", abbr: "Sus" },
  "Bel and the Dragon": { usfm: "BEL", name: "Bel and the Dragon", abbr: "Bel" },
  "Prayer of Manasses": { usfm: "MAN", name: "Prayer of Manasseh", abbr: "PrMan" },
  "1 Maccabees": { usfm: "1MA", name: "1 Maccabees", abbr: "1Ma" },
  "2 Maccabees": { usfm: "2MA", name: "2 Maccabees", abbr: "2Ma" },
  // New Testament
  Matthew: { usfm: "MAT", name: "Matthew", abbr: "Mat" },
  Mark: { usfm: "MRK", name: "Mark", abbr: "Mrk" },
  Luke: { usfm: "LUK", name: "Luke", abbr: "Luk" },
  John: { usfm: "JHN", name: "John", abbr: "Jhn" },
  Acts: { usfm: "ACT", name: "Acts", abbr: "Act" },
  Romans: { usfm: "ROM", name: "Romans", abbr: "Rom" },
  "1 Corinthians": { usfm: "1CO", name: "1 Corinthians", abbr: "1Co" },
  "2 Corinthians": { usfm: "2CO", name: "2 Corinthians", abbr: "2Co" },
  Galatians: { usfm: "GAL", name: "Galatians", abbr: "Gal" },
  Ephesians: { usfm: "EPH", name: "Ephesians", abbr: "Eph" },
  Philippians: { usfm: "PHP", name: "Philippians", abbr: "Php" },
  Colossians: { usfm: "COL", name: "Colossians", abbr: "Col" },
  "1 Thessalonians": { usfm: "1TH", name: "1 Thessalonians", abbr: "1Th" },
  "2 Thessalonians": { usfm: "2TH", name: "2 Thessalonians", abbr: "2Th" },
  "1 Timothy": { usfm: "1TI", name: "1 Timothy", abbr: "1Ti" },
  "2 Timothy": { usfm: "2TI", name: "2 Timothy", abbr: "2Ti" },
  Titus: { usfm: "TIT", name: "Titus", abbr: "Tit" },
  Philemon: { usfm: "PHM", name: "Philemon", abbr: "Phm" },
  Hebrews: { usfm: "HEB", name: "Hebrews", abbr: "Heb" },
  James: { usfm: "JAS", name: "James", abbr: "Jas" },
  "1 Peter": { usfm: "1PE", name: "1 Peter", abbr: "1Pe" },
  "2 Peter": { usfm: "2PE", name: "2 Peter", abbr: "2Pe" },
  "1 John": { usfm: "1JN", name: "1 John", abbr: "1Jn" },
  "2 John": { usfm: "2JN", name: "2 John", abbr: "2Jn" },
  "3 John": { usfm: "3JN", name: "3 John", abbr: "3Jn" },
  Jude: { usfm: "JUD", name: "Jude", abbr: "Jud" },
  // getBible labels Revelation "Revelation of John"; BookGrid groups NT by the
  // canonical name "Revelation".
  "Revelation of John": { usfm: "REV", name: "Revelation", abbr: "Rev" },
};

// Canonical print order for a KJV+Apocrypha bible: OT, then Apocrypha, then NT.
const ORDER: string[] = [
  "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH",
  "EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS",
  "JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",
  "1ES","2ES","TOB","JDT","ESG","WIS","SIR","BAR","S3Y","SUS","BEL","MAN","1MA","2MA",
  "MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH",
  "1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD","REV",
];

interface RawVerse { chapter: number; verse: number; text: string }
interface RawChapter { chapter: number; verses: RawVerse[] }
interface RawBook { nr: number; name: string; chapters: RawChapter[] }
interface RawBible { books: RawBook[] }

interface OutVerse { number: string; text: string }
interface OutChapter { number: string; verses: OutVerse[] }
interface OutBook {
  id: string;
  name: string;
  abbreviation: string;
  chapters: OutChapter[];
}

function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "") // stray OSIS tags (e.g. "</title>" in Add. Esther 10:4)
    .replace(/\s+/g, " ")
    .trim();
}

async function main(): Promise<void> {
  const outDir = join(process.cwd(), "data", "local-bibles");
  mkdirSync(outDir, { recursive: true });

  console.log(`Fetching KJVA from ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`getBible ${res.status}`);
  const raw = (await res.json()) as RawBible;

  const byUsfm = new Map<string, OutBook>();
  for (const b of raw.books) {
    const map = BOOK_MAP[b.name];
    if (!map) {
      throw new Error(`Unmapped book name from source: "${b.name}"`);
    }
    const chapters: OutChapter[] = b.chapters.map((c) => ({
      number: String(c.chapter),
      verses: c.verses.map((v) => ({
        number: String(v.verse),
        text: cleanText(v.text),
      })),
    }));
    byUsfm.set(map.usfm, {
      id: map.usfm,
      name: map.name,
      abbreviation: map.abbr,
      chapters,
    });
  }

  const books: OutBook[] = ORDER.map((usfm) => {
    const book = byUsfm.get(usfm);
    if (!book) throw new Error(`Source missing expected book ${usfm}`);
    return book;
  });

  const out = {
    id: "1812-kjva",
    name: "1812 Bible (KJV + Apocrypha)",
    abbreviation: "1812",
    description:
      "The 1812 Bible — an early American printing in the King James / Authorized " +
      "Version tradition, including the Apocrypha. Public-domain KJVA text.",
    source: "https://www.felzbooks.com/books/1812-bible",
    textSource: SOURCE_URL,
    license: "Public domain (1769 KJV Authorized Version + Apocrypha)",
    language: "eng",
    books,
  };

  const totalVerses = books.reduce(
    (a, b) => a + b.chapters.reduce((x, c) => x + c.verses.length, 0),
    0,
  );

  writeFileSync(join(outDir, "1812-kjva.json"), JSON.stringify(out));
  console.log(
    `Wrote data/local-bibles/1812-kjva.json — ${books.length} books, ${totalVerses} verses`,
  );

  const sourceNote = `# 1812 Bible — source & license

**Version id:** \`local-1812-kjva\`  ·  **Display:** "1812 Bible (KJV + Apocrypha)"

## What it is
The 1812 Bible catalogued at <https://www.felzbooks.com/books/1812-bible> is an
early American stereotype printing in the **King James / Authorized Version**
tradition, **including the Apocrypha**. That felzbooks catalog page is behind a
WordPress login ("Soul Power") and is not scrapeable, so the page itself is not
the data source — only the identification of the edition.

## Text source
The text of an 1812 KJV+Apocrypha printing is the **1769 Authorized Version with
the Apocrypha (KJVA)**. We bundle that public-domain text as the faithful
equivalent, sourced from **getBible.net's CrossWire KJVA module**
(<https://api.getbible.net/v2/kjva.json>, clean plain text, Strong's numbers
stripped). 80 books: 39 OT + 14 Apocrypha + 27 NT.

## License
The KJV/Authorized Version base text + Apocrypha is **public domain in the United
States and Canada**. The 1812 American imprint is pre-1929 (public domain); the
KJV's Crown letters-patent restriction applies only within the United Kingdom.
(The \`distribution_license: "GPL"\` field on the getBible module is SWORD
module-packaging metadata, not a copyright claim over the public-domain text.)

## Regenerate
\`\`\`
bun scripts/fetch-1812-bible.ts
\`\`\`
`;
  writeFileSync(join(outDir, "SOURCE.md"), sourceNote);
  console.log("Wrote data/local-bibles/SOURCE.md");
}

await main();
