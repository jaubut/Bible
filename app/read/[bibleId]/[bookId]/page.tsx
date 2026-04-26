import Link from "next/link";
import { bibleApi } from "@/lib/bible-api";
import ChapterGrid from "@/components/ChapterGrid";
import Settings from "@/components/Settings";

export default async function BookHubPage({
  params,
}: {
  params: Promise<{ bibleId: string; bookId: string }>;
}) {
  const { bibleId, bookId } = await params;
  const decodedBibleId = decodeURIComponent(bibleId);
  const decodedBookId = decodeURIComponent(bookId);

  const [books, chapters] = await Promise.all([
    bibleApi.listBooks(decodedBibleId),
    bibleApi.listChapters(decodedBibleId, decodedBookId),
  ]);

  const book = books.find((b) => b.id === decodedBookId);
  if (!book) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p>Book not found.</p>
        <Link href={`/read/${bibleId}`} className="underline">
          ← Back
        </Link>
      </main>
    );
  }

  const realChapters = chapters.filter((c) => /^\d+$/.test(c.number));
  const firstCh = realChapters[0]?.number ?? "1";
  const showSingleBook = books.length === 1;

  return (
    <main
      className="mx-auto max-w-3xl px-5 sm:px-6 pt-6 pb-16"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <header className="flex items-center justify-between gap-3 mb-8">
        <Link
          href={showSingleBook ? "/" : `/read/${encodeURIComponent(decodedBibleId)}`}
          className="btn-ghost text-sm"
        >
          ← {showSingleBook ? "Home" : "Books"}
        </Link>
        <Settings />
      </header>

      <div className="mb-10">
        <h1 className="t-display">{book.name}</h1>
        <p className="t-caption text-[color:var(--color-aside)] mt-2">
          {realChapters.length} {realChapters.length === 1 ? "chapter" : "chapters"} · {decodedBibleId.startsWith("extra-") ? "Public domain English translation" : decodedBibleId}
        </p>
      </div>

      <section className="mb-10">
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href={`/read/${encodeURIComponent(decodedBibleId)}/${encodeURIComponent(decodedBookId)}/${firstCh}`}
            className="card p-5"
          >
            <div className="text-base font-semibold mb-1">Read</div>
            <div className="t-caption text-[color:var(--color-aside)]">
              Verses with cultural and historical asides.
            </div>
          </Link>
          <Link
            href={`/read/${encodeURIComponent(decodedBibleId)}/${encodeURIComponent(decodedBookId)}/${firstCh}?mode=podcast`}
            className="card p-5"
          >
            <div className="text-base font-semibold mb-1">Listen as podcast</div>
            <div className="t-caption text-[color:var(--color-aside)]">
              Two hosts in conversation around the chapter.
            </div>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="t-caption font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
          Chapters
        </h2>
        <ChapterGrid
          bibleId={decodedBibleId}
          bookId={decodedBookId}
          chapters={chapters}
        />
      </section>
    </main>
  );
}
