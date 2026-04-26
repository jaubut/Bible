export type Segment =
  | { kind: "read"; text: string; verse?: string }
  | { kind: "aside"; text: string }
  | { kind: "host"; speaker: "A" | "B"; text: string }
  | { kind: "pause" };

const READING_TAG =
  /<(read|aside|pause)(\s+v="([^"]+)")?\s*\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:read|aside|pause)\b)|$)/g;

const PODCAST_TAG =
  /<(host|pause)(\s+name="(A|B)")?\s*\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:host|pause)\b)|$)/g;

export function parseScript(input: string): Segment[] {
  const out: Segment[] = [];
  let m: RegExpExecArray | null;
  READING_TAG.lastIndex = 0;
  while ((m = READING_TAG.exec(input))) {
    const tag = m[1];
    const verse = m[3];
    const text = (m[4] ?? "").trim();
    if (tag === "pause") {
      out.push({ kind: "pause" });
    } else if (tag === "read") {
      if (text) out.push({ kind: "read", text, verse });
    } else if (tag === "aside") {
      if (text) out.push({ kind: "aside", text });
    }
  }
  return out;
}

export function parsePodcast(input: string): Segment[] {
  const out: Segment[] = [];
  let m: RegExpExecArray | null;
  PODCAST_TAG.lastIndex = 0;
  while ((m = PODCAST_TAG.exec(input))) {
    const tag = m[1];
    const speaker = m[3] as "A" | "B" | undefined;
    const text = (m[4] ?? "").trim();
    if (tag === "pause") {
      out.push({ kind: "pause" });
    } else if (tag === "host" && speaker && text) {
      out.push({ kind: "host", speaker, text });
    }
  }
  return out;
}
