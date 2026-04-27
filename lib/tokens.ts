// Tokenize a verse string into segments — plain text and recognized tokens.
// Renders the static lexicon AND optional per-verse manifest tokens
// (Claude-generated for that specific chapter).

import { lookupPhrase, lookupWord, type LexiconEntry } from "./lexicon";
import type { TokenCategory } from "./lexicon";

export type TokenSegment =
  | { kind: "text"; text: string }
  | { kind: "token"; text: string; entry: LexiconEntry };

export type ManifestToken = {
  verse: string;
  text: string;
  category: TokenCategory;
  description: string;
  context?: string | null;
};

const WORD_RE = /([A-Za-z][A-Za-z'-]*[A-Za-z]|[A-Za-z])/g;

// Build a per-verse "additional phrase" lookup from manifest tokens.
// Returns: a function that, given a position in the verse text, tries to
// match a manifest token starting there (by exact substring), and if so
// returns a synthetic LexiconEntry for it.
function buildManifestLookup(
  manifestTokens: ManifestToken[],
): (textLower: string, originalText: string, idx: number) => {
  entry: LexiconEntry;
  length: number;
} | undefined {
  if (!manifestTokens?.length) return () => undefined;

  // Sort by length descending — greedy longest-match
  const sorted = [...manifestTokens].sort((a, b) => b.text.length - a.text.length);

  return (textLower: string, originalText: string, idx: number) => {
    for (const t of sorted) {
      const matchLower = t.text.toLowerCase();
      if (textLower.startsWith(matchLower, idx)) {
        // Word boundary check (don't match inside another word)
        const before = idx === 0 ? "" : textLower[idx - 1];
        const after = textLower[idx + matchLower.length] ?? "";
        if (
          (!before || /\W/.test(before)) &&
          (!after || /\W/.test(after))
        ) {
          // Use the original-text slice (preserves case) for the visible text
          const surface = originalText.slice(idx, idx + matchLower.length);
          return {
            entry: {
              canonical: t.text,
              category: t.category,
              description: t.description,
              ...(t.context ? { transliteration: undefined } : {}),
              // We stash the context (e.g. "Psalm 22:1") in `description`'s
              // sibling fields. Reuse `original` for context display.
              ...(t.context ? { original: t.context } : {}),
            },
            length: surface.length,
          };
        }
      }
    }
    return undefined;
  };
}

export function tokenize(
  text: string,
  manifestTokens: ManifestToken[] = [],
): TokenSegment[] {
  if (!text) return [];

  const segments: TokenSegment[] = [];
  const lower = text.toLowerCase();
  const manifestLookup = buildManifestLookup(manifestTokens);
  let i = 0;

  while (i < text.length) {
    // 1. Manifest token (per-verse, contextual) — highest priority
    const m = manifestLookup(lower, text, i);
    if (m) {
      const isStart = i === 0 || /\W/.test(text[i - 1]);
      if (isStart) {
        segments.push({
          kind: "token",
          text: text.slice(i, i + m.length),
          entry: m.entry,
        });
        i += m.length;
        continue;
      }
    }

    // 2. Static phrase (multi-word lexicon)
    const phrase = lookupPhrase(lower, i);
    if (phrase) {
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

    // 3. Static single word
    WORD_RE.lastIndex = i;
    const wm = WORD_RE.exec(text);
    if (wm && wm.index === i) {
      const word = wm[0];
      const entry = lookupWord(word);
      if (entry) {
        segments.push({ kind: "token", text: word, entry });
      } else {
        segments.push({ kind: "text", text: word });
      }
      i += word.length;
      continue;
    }

    // 4. Walk forward to next word
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
