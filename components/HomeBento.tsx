"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Sun, BookOpen } from "lucide-react";
import { readLastRead, type LastRead } from "@/lib/last-read";
import { todaysPick, type DailyPick } from "@/lib/today";

export default function HomeBento() {
  const [last, setLast] = useState<LastRead | null>(null);
  const [today, setToday] = useState<DailyPick | null>(null);

  useEffect(() => {
    setLast(readLastRead());
    setToday(todaysPick());
  }, []);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {/* Today's chapter */}
      {today && (
        <Link
          href={`/read/${encodeURIComponent(today.bibleId)}/${encodeURIComponent(today.bookId)}/${today.chapter}`}
          className="card p-5 flex flex-col gap-3 sm:col-span-2"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-tint)]">
              <Sun size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="t-caption text-[color:var(--color-aside)] uppercase tracking-wide">
                Today
              </div>
              <div className="text-lg font-semibold mt-0.5">
                {today.bookName} {today.chapter}
              </div>
              <div className="t-caption text-[color:var(--color-aside)] mt-1">
                {today.blurb}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="btn-primary !min-h-[40px] text-sm">
              <Play size={14} /> Read
            </span>
            <span className="btn-outline">
              Listen as podcast
            </span>
          </div>
        </Link>
      )}

      {/* Continue */}
      {last ? (
        <Link
          href={`/read/${encodeURIComponent(last.bibleId)}/${encodeURIComponent(last.bookId)}/${last.chapter}`}
          className="card p-5"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-tint)]">
              <BookOpen size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="t-caption text-[color:var(--color-aside)] uppercase tracking-wide">
                Continue
              </div>
              <div className="text-lg font-semibold mt-0.5">
                {last.bookName} {last.chapter}
              </div>
              <div className="t-caption text-[color:var(--color-aside)] mt-1">
                Pick up where you left off
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="card p-5 opacity-60">
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-tint)]">
              <BookOpen size={18} />
            </div>
            <div className="flex-1">
              <div className="t-caption text-[color:var(--color-aside)] uppercase tracking-wide">
                Continue
              </div>
              <div className="text-sm mt-1 text-[color:var(--color-aside)]">
                Start reading and we&apos;ll save your spot here.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discover */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-tint)]">
            ✦
          </div>
          <div className="flex-1">
            <div className="t-caption text-[color:var(--color-aside)] uppercase tracking-wide">
              Discover
            </div>
            <div className="text-base font-semibold mt-0.5">
              Choose a translation
            </div>
          </div>
        </div>
        <p className="t-caption text-[color:var(--color-aside)] mb-3">
          244 translations + bundled Pseudepigrapha (1 Enoch, Jubilees).
        </p>
        <a href="#translations" className="btn-outline">
          Browse →
        </a>
      </div>
    </div>
  );
}
