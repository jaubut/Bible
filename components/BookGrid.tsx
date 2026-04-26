import Link from "next/link";
import type { Book } from "@/lib/bible-api";

// Group books by canonical division (rough OT / NT split for English/canonical
// translations). For non-canonical structures (e.g. extra-books with one book)
// we render a single-card layout.

const NT_NAMES = new Set([
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
]);

function classify(books: Book[]): { ot: Book[]; nt: Book[]; other: Book[] } {
  const ot: Book[] = [];
  const nt: Book[] = [];
  const other: Book[] = [];
  for (const b of books) {
    if (NT_NAMES.has(b.name)) nt.push(b);
    else if (
      [
        "Genesis",
        "Exodus",
        "Leviticus",
        "Numbers",
        "Deuteronomy",
        "Joshua",
        "Judges",
        "Ruth",
        "1 Samuel",
        "2 Samuel",
        "1 Kings",
        "2 Kings",
        "1 Chronicles",
        "2 Chronicles",
        "Ezra",
        "Nehemiah",
        "Esther",
        "Job",
        "Psalms",
        "Proverbs",
        "Ecclesiastes",
        "Song of Songs",
        "Song of Solomon",
        "Isaiah",
        "Jeremiah",
        "Lamentations",
        "Ezekiel",
        "Daniel",
        "Hosea",
        "Joel",
        "Amos",
        "Obadiah",
        "Jonah",
        "Micah",
        "Nahum",
        "Habakkuk",
        "Zephaniah",
        "Haggai",
        "Zechariah",
        "Malachi",
      ].includes(b.name)
    ) {
      ot.push(b);
    } else {
      other.push(b);
    }
  }
  return { ot, nt, other };
}

export default function BookGrid({
  bibleId,
  books,
}: {
  bibleId: string;
  books: Book[];
}) {
  const { ot, nt, other } = classify(books);

  return (
    <div className="space-y-10">
      {ot.length > 0 && <BookSection title="Old Testament" books={ot} bibleId={bibleId} />}
      {nt.length > 0 && <BookSection title="New Testament" books={nt} bibleId={bibleId} />}
      {other.length > 0 && (
        <BookSection
          title={ot.length || nt.length ? "Other" : "Books"}
          books={other}
          bibleId={bibleId}
        />
      )}
    </div>
  );
}

function BookSection({
  title,
  books,
  bibleId,
}: {
  title: string;
  books: Book[];
  bibleId: string;
}) {
  return (
    <section>
      <h2 className="t-caption font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
        {title}
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {books.map((b) => (
          <li key={b.id}>
            <Link
              href={`/read/${encodeURIComponent(bibleId)}/${encodeURIComponent(b.id)}`}
              className="block rounded-xl px-3 py-3 min-h-[56px] hover:bg-[color:var(--color-tint)] transition"
            >
              <div className="text-sm font-medium">{b.name}</div>
              {b.abbreviation && b.abbreviation !== b.name && (
                <div className="t-caption text-[color:var(--color-aside)]">
                  {b.abbreviation}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
