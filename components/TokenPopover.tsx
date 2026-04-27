"use client";

import { X } from "lucide-react";
import type { LexiconEntry } from "@/lib/lexicon";

const CATEGORY_LABEL: Record<LexiconEntry["category"], string> = {
  person: "Person",
  place: "Place",
  deity: "Deity",
  loanword: "Loanword",
  number: "Number / Measure",
  title: "Title",
  artifact: "Artifact",
  "time-marker": "Time marker",
  echo: "Echo",
  speech: "Quoted speech",
};

const CATEGORY_DOT_CLASS: Record<LexiconEntry["category"], string> = {
  person: "bg-[var(--tk-person-fg)]",
  place: "bg-[var(--tk-place-fg)]",
  deity: "bg-[var(--tk-deity-fg)]",
  loanword: "bg-[var(--tk-loanword-fg)]",
  number: "bg-[var(--tk-number-fg)]",
  title: "bg-[var(--tk-title-fg)]",
  artifact: "bg-[var(--tk-artifact-fg)]",
  "time-marker": "bg-[color:var(--color-aside)]",
  echo: "bg-[color:var(--color-aside)]",
  speech: "bg-[color:var(--color-aside)]",
};

export default function TokenPopover({
  text,
  entry,
  onClose,
}: {
  text: string;
  entry: LexiconEntry;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="token-popover-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${CATEGORY_DOT_CLASS[entry.category]}`}
              aria-hidden
            />
            <span className="t-caption uppercase tracking-wide text-[color:var(--color-aside)]">
              {CATEGORY_LABEL[entry.category]}
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="px-5 pt-1 pb-5">
          <h2
            id="token-popover-title"
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {entry.canonical}
          </h2>

          <p className="mt-3 t-body text-[color:var(--color-ink)]">
            {entry.description}
          </p>

          {(entry.original || entry.transliteration || entry.strongsId) && (
            <div className="mt-5 rounded-xl bg-[color:var(--color-tint)] px-4 py-3 space-y-1.5">
              {entry.original && (
                <Row label="Original">
                  <span
                    style={{
                      fontFamily:
                        '"SBL Hebrew", "Times New Roman", serif',
                      fontSize: "1.15em",
                    }}
                  >
                    {entry.original}
                  </span>
                </Row>
              )}
              {entry.transliteration && (
                <Row label="Transliteration">
                  <em>{entry.transliteration}</em>
                </Row>
              )}
              {entry.strongsId && (
                <Row label="Strong's">
                  <span className="tabular-nums">{entry.strongsId}</span>
                </Row>
              )}
            </div>
          )}

          {text.toLowerCase() !== entry.canonical.toLowerCase() && (
            <p className="mt-4 t-caption text-[color:var(--color-aside)]">
              In this verse: <em>{text}</em>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="t-caption text-[color:var(--color-aside)] w-24 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
