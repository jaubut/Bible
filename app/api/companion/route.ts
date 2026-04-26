import { z } from "zod";
import { anthropic, COMPANION_MODEL } from "@/lib/anthropic";
import { bibleApi } from "@/lib/bible-api";
import { COMPANION_SYSTEM, buildCompanionUserPrompt } from "@/lib/companion-prompt";
import { commentaryKey, getCommentary, putCommentary } from "@/lib/cache";

export const runtime = "nodejs";

const Body = z.object({
  bibleId: z.string().min(1),
  passageId: z.string().min(1),
  density: z.enum(["light", "normal", "rich"]).default("normal"),
});

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const { bibleId, passageId, density } = body.data;

  const cacheKey = commentaryKey(bibleId, passageId, density);
  const cached = getCommentary(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { "content-type": "text/plain; charset=utf-8", "x-cache": "HIT" },
    });
  }

  const passage = await bibleApi.getPassage(bibleId, passageId);

  const stream = await anthropic().messages.stream({
    model: COMPANION_MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: COMPANION_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildCompanionUserPrompt({
          reference: passage.reference,
          translation: bibleId,
          passageText: passage.content,
          density,
        }),
      },
    ],
  });

  let full = "";
  const encoder = new TextEncoder();
  const out = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          full += event.delta.text;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
      try {
        putCommentary({ key: cacheKey, bibleId, passageId, density, script: full });
      } catch {
        // cache failures shouldn't break the response
      }
    },
  });

  return new Response(out, {
    headers: { "content-type": "text/plain; charset=utf-8", "x-cache": "MISS" },
  });
}
