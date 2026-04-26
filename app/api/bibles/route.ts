import { NextResponse } from "next/server";
import { bibleApi, isEthiopian, type Bible } from "@/lib/bible-api";
import { isExtraBibleId } from "@/lib/extra-books";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? undefined;
  const ethiopian = url.searchParams.get("ethiopian") === "1";
  const pseudepigrapha = url.searchParams.get("pseudepigrapha") === "1";

  try {
    const all = await bibleApi.listBibles(lang);
    let bibles: Bible[] = all;
    if (pseudepigrapha) {
      bibles = all.filter((b) => isExtraBibleId(b.id));
    } else if (ethiopian) {
      bibles = all.filter(isEthiopian);
    } else {
      // Don't pollute the regular language lists with extra books unless
      // explicitly requested.
      bibles = all.filter((b) => !isExtraBibleId(b.id));
    }
    return NextResponse.json({ bibles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
