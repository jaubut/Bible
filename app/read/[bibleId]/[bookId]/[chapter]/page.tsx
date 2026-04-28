import { bibleApi } from "@/lib/bible-api";
import Reader from "@/components/Reader";

export default async function ReadChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ bibleId: string; bookId: string; chapter: string }>;
  searchParams: Promise<{ mode?: string; autoplay?: string }>;
}) {
  const { bibleId, bookId, chapter } = await params;
  const { mode, autoplay } = await searchParams;
  const decodedBibleId = decodeURIComponent(bibleId);
  const decodedBookId = decodeURIComponent(bookId);

  const [books, chapters] = await Promise.all([
    bibleApi.listBooks(decodedBibleId),
    bibleApi.listChapters(decodedBibleId, decodedBookId),
  ]);
  const passageId = `${decodedBookId}.${chapter}`;
  const totalChapters = chapters.filter((c) =>
    /^\d+$/.test(c.number),
  ).length;

  return (
    <Reader
      bibleId={decodedBibleId}
      bookId={decodedBookId}
      books={books}
      chapters={chapters}
      initialPassageId={passageId}
      totalChapters={totalChapters}
      modeOverride={mode === "podcast" ? "podcast" : undefined}
      autoplayOnMount={autoplay === "1"}
    />
  );
}
