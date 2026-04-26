import { NextResponse } from "next/server";
import { bibleApi, isEthiopian, type Bible } from "@/lib/bible-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? undefined;
  const ethiopian = url.searchParams.get("ethiopian") === "1";

  try {
    const all = await bibleApi.listBibles(lang);
    const bibles: Bible[] = ethiopian ? all.filter(isEthiopian) : all;
    return NextResponse.json({ bibles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
