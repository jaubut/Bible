export type MarkStyle = "underline" | "circle" | "emphasis";

export interface Mark {
  target: string;
  style: MarkStyle;
}

export type Segment =
  | { kind: "read"; text: string; verse?: string; marks?: Mark[] }
  | { kind: "aside"; text: string }
  | { kind: "host"; speaker: "A" | "B"; text: string }
  | { kind: "note"; text: string; verse?: string }
  | { kind: "pause" };

const READING_TAG =
  /<(read|aside|pause)(\s+v="([^"]+)")?\s*\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:read|aside|pause)\b)|$)/g;

const PODCAST_TAG =
  /<(host|pause)(\s+name="(A|B)")?\s*\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:host|pause)\b)|$)/g;

const JESUS_TAG =
  /<(read|note|mark|pause)\b([^>]*)\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:read|note|mark|pause)\b)|$)/g;

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

const ATTR_V = /\bv="([^"]+)"/;
const ATTR_TARGET = /\btarget="([^"]+)"/;
const ATTR_STYLE = /\bstyle="([^"]+)"/;

function isMarkStyle(v: string | undefined): v is MarkStyle {
  return v === "underline" || v === "circle" || v === "emphasis";
}

export function parseJesus(input: string): Segment[] {
  // Two-pass: collect marks per verse, then emit segments with marks attached
  // to the matching read. Notes flow in source order.
  const marksByVerse = new Map<string, Mark[]>();
  type Raw =
    | { kind: "read"; verse?: string; text: string }
    | { kind: "note"; verse?: string; text: string }
    | { kind: "pause" };
  const raw: Raw[] = [];

  let m: RegExpExecArray | null;
  JESUS_TAG.lastIndex = 0;
  while ((m = JESUS_TAG.exec(input))) {
    const tag = m[1];
    const attrs = m[2] ?? "";
    const body = (m[3] ?? "").trim();
    const verse = ATTR_V.exec(attrs)?.[1];

    if (tag === "pause") {
      raw.push({ kind: "pause" });
    } else if (tag === "read") {
      if (body) raw.push({ kind: "read", verse, text: body });
    } else if (tag === "note") {
      if (body) raw.push({ kind: "note", verse, text: body });
    } else if (tag === "mark") {
      const target = ATTR_TARGET.exec(attrs)?.[1];
      const style = ATTR_STYLE.exec(attrs)?.[1];
      if (verse && target && isMarkStyle(style)) {
        const arr = marksByVerse.get(verse) ?? [];
        arr.push({ target, style });
        marksByVerse.set(verse, arr);
      }
    }
  }

  return raw.map((r) => {
    if (r.kind === "pause") return { kind: "pause" } as Segment;
    if (r.kind === "note") return { kind: "note", text: r.text, verse: r.verse };
    const marks = r.verse ? marksByVerse.get(r.verse) : undefined;
    return marks?.length
      ? { kind: "read", text: r.text, verse: r.verse, marks }
      : { kind: "read", text: r.text, verse: r.verse };
  });
}
