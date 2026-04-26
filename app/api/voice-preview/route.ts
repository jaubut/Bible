import { z } from "zod";
import { synthesizeOne } from "@/lib/google-tts";
import { voiceById } from "@/lib/google-voices";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  voice: z.string().min(1),
  lang: z.enum(["en", "fr"]).default("en"),
});

const PREVIEW_LINE: Record<"en" | "fr", string> = {
  en: "In the beginning, God created the heavens and the earth. The earth was without form, and void.",
  fr: "Au commencement, Dieu créa les cieux et la terre. Or la terre était informe et vide.",
};

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { voice, lang } = body.data;
  if (!voiceById(voice)) {
    return new Response(JSON.stringify({ error: "unknown voice" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const mp3 = await synthesizeOne(PREVIEW_LINE[lang], voice, lang);
  return new Response(new Uint8Array(mp3), {
    headers: {
      "content-type": "audio/mpeg",
      "content-length": String(mp3.length),
      "cache-control": "public, max-age=86400",
    },
  });
}
