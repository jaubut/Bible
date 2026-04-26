import { z } from "zod";
import { anthropic, COMPANION_MODEL } from "@/lib/anthropic";
import { bibleApi } from "@/lib/bible-api";
import { PODCAST_SYSTEM, buildPodcastUserPrompt } from "@/lib/podcast-prompt";
import { commentaryKey, getCommentary, putCommentary } from "@/lib/cache";
import { synthesizeDialogue, type DialogueTurn } from "@/lib/google-tts";
import { audioKey, getAudio, putAudio } from "@/lib/audio-cache";
import { parsePodcast } from "@/lib/script";
import { voiceById } from "@/lib/google-voices";

export const runtime = "nodejs";
export const maxDuration = 300; // up to 5 min for first-generation cold paths

const Body = z.object({
  bibleId: z.string().min(1),
  passageId: z.string().min(1),
  lang: z.enum(["en", "fr"]).default("en"),
  mode: z.enum(["podcast"]).default("podcast"), // reading mode keeps using browser TTS
  voiceA: z.string().min(1),
  voiceB: z.string().min(1),
});

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { bibleId, passageId, lang, mode, voiceA, voiceB } = body.data;

  // Validate voices are in our catalog
  if (!voiceById(voiceA) || !voiceById(voiceB)) {
    return new Response(JSON.stringify({ error: "unknown voice" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // 1. Disk cache hit?
  const aKey = audioKey({ bibleId, passageId, lang, mode, voiceA, voiceB });
  const cached = getAudio(aKey);
  if (cached) {
    return new Response(new Uint8Array(cached), {
      headers: {
        "content-type": "audio/mpeg",
        "content-length": String(cached.length),
        "x-cache": "HIT",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Get the dialogue script (Claude). Reuses the existing text cache.
  const tKey = commentaryKey(bibleId, passageId, "normal", lang, mode);
  let script = getCommentary(tKey);
  if (!script) {
    const passage = await bibleApi.getPassage(bibleId, passageId);
    const userPrompt = buildPodcastUserPrompt({
      reference: passage.reference,
      translation: bibleId,
      passageText: passage.content,
      lang,
    });
    const stream = await anthropic().messages.stream({
      model: COMPANION_MODEL,
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: PODCAST_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    let acc = "";
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
        acc += ev.delta.text;
      }
    }
    script = acc;
    try {
      putCommentary({
        key: tKey,
        bibleId,
        passageId,
        density: "normal",
        script,
      });
    } catch {
      /* cache failures shouldn't break flow */
    }
  }

  // 3. Parse dialogue into turns, map speakers to Edge voices.
  const segments = parsePodcast(script);
  const turns: DialogueTurn[] = segments
    .filter((s) => s.kind === "host")
    .map((s) => {
      const seg = s as Extract<typeof s, { kind: "host" }>;
      return {
        voice: seg.speaker === "A" ? voiceA : voiceB,
        text: seg.text,
        pauseAfterMs: 350,
      };
    });

  if (turns.length === 0) {
    return new Response(
      JSON.stringify({ error: "no dialogue turns parsed from script" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  // 4. Render to MP3 via Google Cloud TTS — one synthesize call per turn,
  // concatenated. Browsers play concatenated MP3 frames seamlessly via <audio>.
  const fullMp3 = await synthesizeDialogue(turns, lang);

  // 5. Cache and return.
  try {
    putAudio(aKey, fullMp3);
  } catch {
    /* don't fail if disk write fails */
  }

  return new Response(new Uint8Array(fullMp3), {
    headers: {
      "content-type": "audio/mpeg",
      "content-length": String(fullMp3.length),
      "x-cache": "MISS",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
