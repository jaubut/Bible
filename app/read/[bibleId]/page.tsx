import { bibleApi } from "@/lib/bible-api";
import Reader from "@/components/Reader";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ bibleId: string }>;
  searchParams: Promise<{ passage?: string }>;
}) {
  const { bibleId } = await params;
  const { passage } = await searchParams;

  const books = await bibleApi.listBooks(bibleId);
  const passageId = passage ?? `${books[0].id}.1`;

  return <Reader bibleId={bibleId} books={books} initialPassageId={passageId} />;
}
