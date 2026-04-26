import Link from "next/link";
import type { Chapter } from "@/lib/bible-api";

export default function ChapterGrid({
  bibleId,
  bookId,
  chapters,
}: {
  bibleId: string;
  bookId: string;
  chapters: Chapter[];
}) {
  // api.bible includes "intro" as a chapter with number "intro" — skip it
  const real = chapters.filter((c) => /^\d+$/.test(c.number));
  return (
    <ul className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5">
      {real.map((c) => (
        <li key={c.id}>
          <Link
            href={`/read/${encodeURIComponent(bibleId)}/${encodeURIComponent(bookId)}/${c.number}`}
            className="flex items-center justify-center rounded-lg h-11 hover:bg-[color:var(--color-tint)] transition tabular-nums"
            aria-label={`Chapter ${c.number}`}
          >
            {c.number}
          </Link>
        </li>
      ))}
    </ul>
  );
}
