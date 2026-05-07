"use client";

import { X } from "lucide-react";
import type { MarkStyle } from "@/lib/script";

const STYLE_LABEL: Record<MarkStyle, string> = {
  circle: "Circled",
  underline: "Underlined",
  emphasis: "Emphasized",
};

interface MarkPopoverProps {
  text: string;
  style: MarkStyle;
  comment: string;
  verseLabel?: string;
  onClose: () => void;
}

export default function MarkPopover({
  text,
  style,
  comment,
  verseLabel,
  onClose,
}: MarkPopoverProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-popover-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl border-t-2 sm:border-t-0 sm:border-l-4"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          borderColor: "var(--jb-ink)",
        }}
      >
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--jb-ink)" }}
              aria-hidden
            />
            <span className="t-caption uppercase tracking-wide text-[color:var(--color-aside)]">
              {STYLE_LABEL[style]}
              {verseLabel ? ` · ${verseLabel}` : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost h-9 w-9 p-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-5 pt-1 pb-5">
          <h2
            id="mark-popover-title"
            className={`text-2xl font-semibold tracking-tight mk-${style}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {text}
          </h2>

          <p
            className="mt-4 t-body italic leading-relaxed text-[color:var(--color-ink)]"
            style={{ borderLeft: "2px solid var(--jb-ink)", paddingLeft: "0.85rem" }}
          >
            {comment}
          </p>
        </div>
      </div>
    </div>
  );
}
