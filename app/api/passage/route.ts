import { NextResponse } from "next/server";
import { z } from "zod";
import { bibleApi } from "@/lib/bible-api";

export const runtime = "nodejs";

const Query = z.object({
  bibleId: z.string().min(1),
  passageId: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    bibleId: url.searchParams.get("bibleId"),
    passageId: url.searchParams.get("passageId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  try {
    const passage = await bibleApi.getPassage(parsed.data.bibleId, parsed.data.passageId);
    return NextResponse.json({ passage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
