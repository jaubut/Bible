"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

export type VerseRef = {
  ref: string;
  note: string;
};

type ResolvedRef = VerseRef & {
  text?: string;
  loading?: boolean;
  error?: string;
};

export default function CrossRefsSheet({
  bibleId,
  verseLabel,
  refs,
  onClose,
}: {
  bibleId: string;
  verseLabel: string;
  refs: VerseRef[];
  onClose: () => void;
}) {
  const [resolved, setResolved] = useState<ResolvedRef[]>(
    refs.map((r) => ({ ...r, loading: true })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await Promise.all(
        refs.map(async (r) => {
          const passageId = parseRefToApiBibleId(r.ref);
          if (!passageId) return { ...r, loading: false };
          try {
            const u = new URL("/api/passage", window.location.origin);
            u.searchParams.set("bibleId", bibleId);
            u.searchParams.set("passageId", passageId);
            const res = await fetch(u.toString());
            if (!res.ok) return { ...r, loading: false };
            const json = await res.json();
            const text: string = json?.passage?.content ?? "";
            return { ...r, loading: false, text: text.replace(/\[(\d+)\]/g, "$1.").trim() };
          } catch (e) {
            return {
              ...r,
              loading: false,
              error: e instanceof Error ? e.message : "fetch failed",
            };
          }
        }),
      );
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [bibleId, refs]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-[color:var(--color-divider)] bg-[color:var(--color-surface)] px-5 py-4">
          <div>
            <div className="t-caption uppercase tracking-wide text-[color:var(--color-aside)]">
              Cross-references
            </div>
            <div className="text-base font-semibold mt-0.5">{verseLabel}</div>
          </div>
          <button onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="px-5 py-4 space-y-5">
          {resolved.map((r, i) => (
            <article key={i}>
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink size={14} className="text-[color:var(--color-aside)]" />
                <span className="text-sm font-semibold">{r.ref}</span>
              </div>
              <p className="t-caption text-[color:var(--color-aside)] mb-2 leading-relaxed">
                {r.note}
              </p>
              <blockquote className="border-l-2 border-[color:var(--color-divider)] pl-3 t-body italic">
                {r.loading ? (
                  <span className="text-[color:var(--color-aside)]">Loading…</span>
                ) : r.text ? (
                  <span>{r.text}</span>
                ) : (
                  <span className="text-[color:var(--color-aside)]">
                    Could not fetch text.
                  </span>
                )}
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// Parse "Genesis 1:1" / "John 3:16-21" / "Ps 22:1" to api.bible passage id
// (book three-letter code + chapter + verse). Best effort — falls back to
// returning null if it can't parse, in which case we just show the note.
const BOOK_CODES: Record<string, string> = {
  // Pentateuch
  Genesis: "GEN", Gen: "GEN",
  Exodus: "EXO", Exo: "EXO", Ex: "EXO",
  Leviticus: "LEV", Lev: "LEV",
  Numbers: "NUM", Num: "NUM",
  Deuteronomy: "DEU", Deut: "DEU", Dt: "DEU",
  // History
  Joshua: "JOS", Josh: "JOS",
  Judges: "JDG", Judg: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA", "1 Sam": "1SA", "1Sa": "1SA",
  "2 Samuel": "2SA", "2 Sam": "2SA", "2Sa": "2SA",
  "1 Kings": "1KI", "1 Kgs": "1KI",
  "2 Kings": "2KI", "2 Kgs": "2KI",
  "1 Chronicles": "1CH", "1 Chr": "1CH",
  "2 Chronicles": "2CH", "2 Chr": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH", Neh: "NEH",
  Esther: "EST", Est: "EST",
  // Wisdom
  Job: "JOB",
  Psalms: "PSA", Psalm: "PSA", Ps: "PSA",
  Proverbs: "PRO", Prov: "PRO", Pr: "PRO",
  Ecclesiastes: "ECC", Eccl: "ECC", Ecc: "ECC",
  "Song of Solomon": "SNG", "Song of Songs": "SNG", Song: "SNG",
  // Major prophets
  Isaiah: "ISA", Isa: "ISA",
  Jeremiah: "JER", Jer: "JER",
  Lamentations: "LAM", Lam: "LAM",
  Ezekiel: "EZK", Ezek: "EZK", Eze: "EZK",
  Daniel: "DAN", Dan: "DAN",
  // Minor prophets
  Hosea: "HOS", Hos: "HOS",
  Joel: "JOL", Jol: "JOL",
  Amos: "AMO", Amo: "AMO",
  Obadiah: "OBA", Oba: "OBA",
  Jonah: "JON", Jon: "JON",
  Micah: "MIC", Mic: "MIC",
  Nahum: "NAM", Nam: "NAM", Nah: "NAM",
  Habakkuk: "HAB", Hab: "HAB",
  Zephaniah: "ZEP", Zep: "ZEP",
  Haggai: "HAG", Hag: "HAG",
  Zechariah: "ZEC", Zec: "ZEC",
  Malachi: "MAL", Mal: "MAL",
  // Gospels
  Matthew: "MAT", Matt: "MAT", Mt: "MAT",
  Mark: "MRK", Mk: "MRK",
  Luke: "LUK", Lk: "LUK",
  John: "JHN", Jn: "JHN",
  // Acts + Epistles
  Acts: "ACT",
  Romans: "ROM", Rom: "ROM",
  "1 Corinthians": "1CO", "1 Cor": "1CO", "1Co": "1CO",
  "2 Corinthians": "2CO", "2 Cor": "2CO", "2Co": "2CO",
  Galatians: "GAL", Gal: "GAL",
  Ephesians: "EPH", Eph: "EPH",
  Philippians: "PHP", Phil: "PHP", Php: "PHP",
  Colossians: "COL", Col: "COL",
  "1 Thessalonians": "1TH", "1 Thess": "1TH",
  "2 Thessalonians": "2TH", "2 Thess": "2TH",
  "1 Timothy": "1TI", "1 Tim": "1TI",
  "2 Timothy": "2TI", "2 Tim": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB", Heb: "HEB",
  James: "JAS",
  "1 Peter": "1PE", "1 Pet": "1PE",
  "2 Peter": "2PE", "2 Pet": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV", Rev: "REV",
};

function parseRefToApiBibleId(ref: string): string | null {
  // Handle "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
  // Books with a leading number like "1 Corinthians" need 2 tokens for the book name.
  const trimmed = ref.trim();

  // Try with leading-number book names first (most specific)
  const m2 = trimmed.match(/^(\d+\s+\w+)\s+(\d+):(\d+)(?:-\d+)?/);
  if (m2) {
    const [, book, ch, v] = m2;
    const code = BOOK_CODES[book];
    if (code) return `${code}.${ch}.${v}`;
  }

  // Then single-word book names
  const m1 = trimmed.match(/^(\w+)\s+(\d+):(\d+)(?:-\d+)?/);
  if (m1) {
    const [, book, ch, v] = m1;
    const code = BOOK_CODES[book];
    if (code) return `${code}.${ch}.${v}`;
  }

  return null;
}
