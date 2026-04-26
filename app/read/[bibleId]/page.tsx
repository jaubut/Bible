import Link from "next/link";
import { redirect } from "next/navigation";
import { bibleApi } from "@/lib/bible-api";
import BookGrid from "@/components/BookGrid";
import Settings from "@/components/Settings";

export default async function BibleHomePage({
  params,
}: {
  params: Promise<{ bibleId: string }>;
}) {
  const { bibleId } = await params;
  const decoded = decodeURIComponent(bibleId);
  const books = await bibleApi.listBooks(decoded);

  // If there's only one book (e.g. Pseudepigrapha extra-books), skip the
  // book grid and route directly to the book hub.
  if (books.length === 1) {
    redirect(`/read/${encodeURIComponent(decoded)}/${encodeURIComponent(books[0].id)}`);
  }

  return (
    <main
      className="mx-auto max-w-4xl px-5 sm:px-6 pt-6 pb-16"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <header className="flex items-center justify-between gap-3 mb-8">
        <Link href="/" className="btn-ghost text-sm">
          ← Home
        </Link>
        <Settings />
      </header>

      <div className="mb-10">
        <h1 className="t-display">Choose a book</h1>
      </div>

      <BookGrid bibleId={decoded} books={books} />
    </main>
  );
}
