export type Segment =
  | { kind: "read"; text: string; verse?: string }
  | { kind: "aside"; text: string }
  | { kind: "pause" };

const TAG = /<(read|aside|pause)(\s+v="([^"]+)")?\s*\/?>([\s\S]*?)(?:<\/\1>|(?=<(?:read|aside|pause)\b)|$)/g;

export function parseScript(input: string): Segment[] {
  const out: Segment[] = [];
  let m: RegExpExecArray | null;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(input))) {
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
