// Tokenize a verse string into a sequence of segments — plain text and
// recognized tokens. The renderer walks segments and wraps tokens in spans
// with category-tinted backgrounds + popover hooks.

import { lookupPhrase, lookupWord, type LexiconEntry } from "./lexicon";

export type TokenSegment =
  | { kind: "text"; text: string }
  | { kind: "token"; text: string; entry: LexiconEntry };

// Regex for word boundary chunking — splits on whitespace and punctuation
// while preserving the punctuation as separate text segments.
const WORD_RE = /([A-Za-z][A-Za-z'-]*[A-Za-z]|[A-Za-z])/g;

export function tokenize(text: string): TokenSegment[] {
  if (!text) return [];

  const segments: TokenSegment[] = [];
  const lower = text.toLowerCase();
  let i = 0;

  while (i < text.length) {
    // 1. Try to match a multi-word phrase starting at i (longest match)
    const phrase = lookupPhrase(lower, i);
    if (phrase) {
      // Make sure we are at a word boundary (start of word)
      const isStart = i === 0 || /\W/.test(text[i - 1]);
      if (isStart) {
        segments.push({
          kind: "token",
          text: text.slice(i, i + phrase.length),
          entry: phrase.entry,
        });
        i += phrase.length;
        continue;
      }
    }

    // 2. Try to match a single word at i
    WORD_RE.lastIndex = i;
    const m = WORD_RE.exec(text);
    if (m && m.index === i) {
      const word = m[0];
      const entry = lookupWord(word);
      if (entry) {
        // Special case: "lord" in lowercase only counts as deity if not a
        // common-noun usage (e.g. "his lord said"). We err on the side of
        // tagging — the popover explains the convention.
        segments.push({ kind: "token", text: word, entry });
      } else {
        segments.push({ kind: "text", text: word });
      }
      i += word.length;
      continue;
    }

    // 3. Otherwise, walk forward until next word or end
    const next = nextWordIndex(text, i);
    const chunk = text.slice(i, next);
    if (chunk) segments.push({ kind: "text", text: chunk });
    i = next;
  }

  return segments;
}

function nextWordIndex(text: string, from: number): number {
  WORD_RE.lastIndex = from;
  const m = WORD_RE.exec(text);
  if (!m) return text.length;
  return m.index;
}
