"use client";

import { useState } from "react";
import { tokenize, type ManifestToken } from "@/lib/tokens";
import type { LexiconEntry } from "@/lib/lexicon";
import TokenPopover from "./TokenPopover";

const CATEGORY_CLASS: Record<LexiconEntry["category"], string> = {
  person: "tk tk-person",
  place: "tk tk-place",
  deity: "tk tk-deity",
  loanword: "tk tk-loanword",
  number: "tk tk-number",
  title: "tk tk-title",
  artifact: "tk tk-artifact",
  "time-marker": "tk tk-title",
  echo: "tk tk-loanword",
  speech: "tk",
};

export default function TokenizedText({
  text,
  manifestTokens,
}: {
  text: string;
  manifestTokens?: ManifestToken[];
}) {
  const [active, setActive] = useState<{
    text: string;
    entry: LexiconEntry;
  } | null>(null);

  const segments = tokenize(text, manifestTokens ?? []);

  return (
    <>
      {segments.map((s, i) =>
        s.kind === "token" ? (
          <button
            key={i}
            type="button"
            className={CATEGORY_CLASS[s.entry.category]}
            onClick={() => setActive({ text: s.text, entry: s.entry })}
            data-category={s.entry.category}
          >
            {s.text}
          </button>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
      {active && (
        <TokenPopover
          text={active.text}
          entry={active.entry}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
