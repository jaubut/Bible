"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Chapter } from "@/lib/bible-api";

export default function ChapterPickerSheet({
  bibleId,
  bookId,
  bookName,
  chapters,
  currentChapter,
  preserveMode,
  onClose,
}: {
  bibleId: string;
  bookId: string;
  bookName: string;
  chapters: Chapter[];
  currentChapter: number;
  preserveMode?: "podcast" | "reading";
  onClose: () => void;
}) {
  const router = useRouter();
  const real = chapters.filter((c) => /^\d+$/.test(c.number));

  function go(chapterNum: string) {
    const modeParam = preserveMode === "podcast" ? "?mode=podcast" : "";
    router.push(
      `/read/${encodeURIComponent(bibleId)}/${encodeURIComponent(bookId)}/${chapterNum}${modeParam}`,
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-[color:var(--color-divider)] bg-[color:var(--color-surface)] px-5 py-4">
          <div>
            <div className="t-caption uppercase tracking-wide text-[color:var(--color-aside)]">
              Jump to chapter
            </div>
            <div className="text-base font-semibold mt-0.5">{bookName}</div>
          </div>
          <button onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="px-5 py-4">
          <ul className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
            {real.map((c) => {
              const num = parseInt(c.number, 10);
              const isCurrent = num === currentChapter;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go(c.number)}
                    className={`flex items-center justify-center rounded-lg h-11 w-full transition tabular-nums ${
                      isCurrent
                        ? "bg-[color:var(--color-ink)] text-[color:var(--color-bg)] font-semibold"
                        : "hover:bg-[color:var(--color-tint)]"
                    }`}
                    aria-label={`Chapter ${c.number}`}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    {c.number}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
