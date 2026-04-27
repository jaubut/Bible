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

  const books = await bibleApi.listBooks(decodedBibleId);
  const passageId = `${decodedBookId}.${chapter}`;

  return (
    <Reader
      bibleId={decodedBibleId}
      bookId={decodedBookId}
      books={books}
      initialPassageId={passageId}
      modeOverride={mode === "podcast" ? "podcast" : undefined}
      autoplayOnMount={autoplay === "1"}
    />
  );
}
