#!/usr/bin/env bun
// One-time fetcher for public-domain Ethiopian Orthodox / Pseudepigrapha texts.
// Run with: bun scripts/fetch-extra-books.ts
//
// Sources:
//   - 1 Enoch — R.H. Charles 1917 — Project Gutenberg #77935 (PD)
//   - Jubilees — R.H. Charles 1902 — pseudepigrapha.com (PD)
//
// Output: data/extra-books/<book-id>.json

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Verse = { number: string; text: string };
type Chapter = { number: string; verses: Verse[] };
type Book = {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  source: string;
  translator: string;
  year: string;
  chapters: Chapter[];
};

const OUT_DIR = join(process.cwd(), "data", "extra-books");
mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// 1 Enoch — Project Gutenberg #77935 (R.H. Charles 1917, PD)
// Chapter format in source: ROMAN_NUMERAL. 1. text\n2. text\n...
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEnoch(): Promise<Book> {
  console.log("Fetching 1 Enoch from Project Gutenberg...");
  const res = await fetch(
    "https://www.gutenberg.org/cache/epub/77935/pg77935.txt",
  );
  const raw = await res.text();

  // Trim header/footer
  const startMarker = /\n\s*I\.\s*1\.\s+The words of the blessing of Enoch/;
  const endMarker = /\*\*\* END OF THE PROJECT GUTENBERG/;
  const startIdx = raw.search(startMarker);
  const endIdx = raw.search(endMarker);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error("Could not locate body markers in Enoch source");
  }
  const body = raw.slice(startIdx, endIdx);

  // Strict chapter pattern: at line start, roman numeral up to CVIII (108),
  // followed by ". " — possibly with a "1. " verse-1 prefix. Use multiline
  // mode to anchor on real line starts (the previous loose regex matched
  // mid-line "I." and similar, fragmenting the text).
  const lines = body.split("\n");

  type ChunkStart = { idx: number; roman: string; num: number };
  const starts: ChunkStart[] = [];
  // Allow leading whitespace (later chapters in source are indented).
  // Reject section headers — they look like "ROMAN. 1-5. _Title_" (range +
  // italic title) or "ROMAN. _Title_" (just an italic title).
  const chapterHead = /^\s*([IVXLCDM]{1,6})\.\s+/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = chapterHead.exec(line);
    if (!m) continue;
    const tail = line.slice(m[0].length);
    // Section-header rejects:
    if (/^\d+-\d+\b/.test(tail)) continue; // "1-5. _Section_"
    if (/^_/.test(tail)) continue; // "_Italic_"
    // Want: starts with "1. " or with a capital/quote/paren/bracket
    if (!/^(?:\[?\d{1,3}\.\s+|[A-Z(“"‘'\[])/.test(tail)) continue;

    const num = romanToArabic(m[1]);
    if (num >= 1 && num <= 108) {
      starts.push({ idx: i, roman: m[1], num });
    }
  }
  // Dedupe — keep the first occurrence of each chapter number
  const seen = new Set<number>();
  const uniqueStarts = starts.filter((s) => {
    if (seen.has(s.num)) return false;
    seen.add(s.num);
    return true;
  });
  // Re-assign to the deduped list
  starts.length = 0;
  starts.push(...uniqueStarts);

  const chapters: Chapter[] = [];
  for (let s = 0; s < starts.length; s++) {
    const start = starts[s];
    const endIdx = s + 1 < starts.length ? starts[s + 1].idx : lines.length;
    const block = lines.slice(start.idx, endIdx).join("\n");

    // Strip the leading roman numeral + period + space
    const stripped = block.replace(/^[IVXLCDM]{1,6}\.\s+/, "");

    // Flatten and split on verse markers "N. " where N is 1-3 digits.
    // The first segment (before any digit-marker) is verse 1 if no leading "1. ".
    const flat = stripped.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    const verses: Verse[] = [];
    // Detect if it starts with "1. "
    const firstHas1 = /^1\.\s+/.test(flat);
    const tail = firstHas1 ? flat.replace(/^1\.\s+/, "") : flat;
    const segments = tail.split(/\s(\d{1,3})\.\s+/);
    // segments[0] = verse 1 content
    if (segments[0]) {
      verses.push({ number: "1", text: cleanText(segments[0]) });
    }
    for (let i = 1; i < segments.length; i += 2) {
      const num = segments[i];
      const text = segments[i + 1] ?? "";
      // Defensive: don't accept non-monotonic verse numbers (typos in source)
      const last = verses[verses.length - 1];
      if (
        text.trim() &&
        last &&
        parseInt(num, 10) > parseInt(last.number, 10)
      ) {
        verses.push({ number: num, text: cleanText(text) });
      } else if (text.trim() && !last) {
        verses.push({ number: num, text: cleanText(text) });
      }
    }

    if (verses.length > 0) {
      chapters.push({ number: romanToArabic(start.roman).toString(), verses });
    }
  }

  console.log(`Enoch: parsed ${chapters.length} chapters`);
  return {
    id: "enoch",
    name: "1 Enoch",
    abbreviation: "1 En",
    description: "The Ethiopic Book of Enoch",
    source: "https://www.gutenberg.org/ebooks/77935",
    translator: "R.H. Charles",
    year: "1917",
    chapters,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Jubilees — pseudepigrapha.com (R.H. Charles 1902, PD)
// One HTML file per chapter, verses inside <ol><li>...</li></ol>
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJubilees(): Promise<Book> {
  console.log("Fetching Jubilees from pseudepigrapha.com...");
  const chapters: Chapter[] = [];

  for (let n = 1; n <= 50; n++) {
    const url = `http://www.pseudepigrapha.com/jubilees/${n}.htm`;
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      console.warn(`  Chapter ${n}: HTTP ${res.status} — skipping`);
      continue;
    }
    const html = await res.text();
    const verses = parseJubileesChapter(html);
    if (verses.length > 0) {
      chapters.push({ number: n.toString(), verses });
      process.stdout.write(`.`);
    } else {
      console.warn(`\n  Chapter ${n}: no verses parsed`);
    }
    // Be polite
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`\nJubilees: parsed ${chapters.length} chapters`);

  return {
    id: "jubilees",
    name: "Jubilees",
    abbreviation: "Jub",
    description: "The Book of Jubilees (Little Genesis)",
    source: "http://www.pseudepigrapha.com/jubilees/",
    translator: "R.H. Charles",
    year: "1902",
    chapters,
  };
}

function parseJubileesChapter(html: string): Verse[] {
  // pseudepigrapha.com mixes <ol> and <OL>, and <LI> often have no closing tag.
  const olMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return [];
  const olInner = olMatch[1];

  // Split on <LI> markers (case-insensitive). Each segment after the first
  // (which is empty or pre-LI whitespace) is one verse.
  const parts = olInner.split(/<li[^>]*>/i);
  const verses: Verse[] = [];
  let n = 1;
  for (let i = 1; i < parts.length; i++) {
    // Strip any trailing </li> or whitespace
    const seg = parts[i].replace(/<\/li>/gi, "");
    const text = stripHtml(seg);
    if (text.trim()) {
      verses.push({ number: n.toString(), text: cleanText(text) });
      n++;
    }
  }
  return verses;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s
    .replace(/<small>([\s\S]*?)<\/small>/g, "$1")
    .replace(/<sup>([\s\S]*?)<\/sup>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ");
}

function cleanText(s: string): string {
  return s
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function romanToArabic(roman: string): number {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]];
    const next = map[roman[i + 1]];
    if (next && next > cur) total -= cur;
    else total += cur;
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

const enoch = await fetchEnoch();
writeFileSync(
  join(OUT_DIR, "enoch.json"),
  JSON.stringify(enoch, null, 2),
);
console.log(`Wrote data/extra-books/enoch.json — ${enoch.chapters.length} chapters, ${enoch.chapters.reduce((a, c) => a + c.verses.length, 0)} verses`);

const jubilees = await fetchJubilees();
writeFileSync(
  join(OUT_DIR, "jubilees.json"),
  JSON.stringify(jubilees, null, 2),
);
console.log(`Wrote data/extra-books/jubilees.json — ${jubilees.chapters.length} chapters, ${jubilees.chapters.reduce((a, c) => a + c.verses.length, 0)} verses`);
