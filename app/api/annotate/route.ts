import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { bibleApi } from "@/lib/bible-api";
import {
  ANNOTATION_SYSTEM,
  buildAnnotationUserPrompt,
} from "@/lib/annotation-prompt";
import {
  getManifest,
  putManifest,
  manifestKey,
} from "@/lib/annotation-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  bibleId: z.string().min(1),
  bookId: z.string().min(1),
  chapter: z.string().min(1),
  bookName: z.string().min(1),
});

const ManifestToken = z.object({
  verse: z.string(),
  text: z.string().min(1),
  category: z.enum(["number", "title", "artifact", "time-marker", "echo"]),
  description: z.string().min(1),
  context: z.string().nullable().optional(),
});

const VerseRef = z.object({
  ref: z.string().min(1),
  note: z.string().min(1),
});

const VerseRefs = z.object({
  verse: z.string(),
  refs: z.array(VerseRef),
});

const Manifest = z.object({
  tokens: z.array(ManifestToken),
  verseRefs: z.array(VerseRefs).optional().default([]),
});

const HAIKU = "claude-haiku-4-5-20251001";

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { bibleId, bookId, chapter, bookName } = body.data;

  const key = manifestKey(bibleId, bookId, chapter);

  // Cache hit — instant return
  const cached = getManifest(key);
  if (cached) {
    return new Response(cached, {
      headers: {
        "content-type": "application/json",
        "x-cache": "HIT",
        "cache-control": "public, max-age=86400",
      },
    });
  }

  // Cache miss — generate
  const passage = await bibleApi.getPassage(bibleId, `${bookId}.${chapter}`);

  const userPrompt = buildAnnotationUserPrompt({
    bookName,
    chapter,
    passageText: passage.content,
  });

  const completion = await anthropic().messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: ANNOTATION_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = completion.content.find((b) => b.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

  // Strip code fences if Claude added them despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return new Response(
      JSON.stringify({
        error: "annotation parse failed",
        raw: raw.slice(0, 500),
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const valid = Manifest.safeParse(parsed);
  if (!valid.success) {
    return new Response(
      JSON.stringify({
        error: "annotation schema invalid",
        details: valid.error.issues.slice(0, 5),
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  // Validate: every token's text must appear in the chapter's verse text.
  // Drop tokens that don't match — don't fail the whole manifest.
  const passageText = passage.content;
  const validTokens = valid.data.tokens.filter((t) => {
    // Find this verse's text in the passage
    const verseStart = passageText.indexOf(`[${t.verse}]`);
    if (verseStart === -1) return false;
    const verseEnd = (() => {
      // Next [N+1] marker or end of passage
      const nextMatch = passageText.slice(verseStart + 1).match(/\[\d+\]/);
      return nextMatch
        ? verseStart + 1 + (nextMatch.index ?? 0)
        : passageText.length;
    })();
    const verseText = passageText.slice(verseStart, verseEnd);
    return verseText.includes(t.text);
  });

  const finalManifest = JSON.stringify({
    tokens: validTokens,
    verseRefs: valid.data.verseRefs,
    bibleId,
    bookId,
    chapter,
    bookName,
    generatedAt: new Date().toISOString(),
  });

  try {
    putManifest({
      key,
      bibleId,
      bookId,
      chapter,
      manifest: finalManifest,
    });
  } catch {
    /* cache write failure shouldn't break the response */
  }

  return new Response(finalManifest, {
    headers: {
      "content-type": "application/json",
      "x-cache": "MISS",
      "x-tokens-kept": String(validTokens.length),
      "x-tokens-dropped": String(
        valid.data.tokens.length - validTokens.length,
      ),
      "cache-control": "public, max-age=86400",
    },
  });
}
