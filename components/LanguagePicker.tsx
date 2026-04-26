"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bible } from "@/lib/bible-api";

type Mode = "ethiopian" | "english" | "french" | "all";

export default function LanguagePicker() {
  const [mode, setMode] = useState<Mode>("ethiopian");
  const [bibles, setBibles] = useState<Bible[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (mode === "ethiopian") params.set("ethiopian", "1");
      else if (mode === "english") params.set("lang", "eng");
      else if (mode === "french") params.set("lang", "fra");
      try {
        const res = await fetch(`/api/bibles?${params}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setBibles(json.bibles);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {(["ethiopian", "english", "french", "all"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm border transition ${
              mode === m
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-parchment)] border-[color:var(--color-ink)]"
                : "border-[color:var(--color-aside)]/40 hover:bg-[color:var(--color-ink)]/5"
            }`}
          >
            {m === "ethiopian" ? "Ethiopian" : m === "english" ? "English" : m === "french" ? "French" : "All"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && <p className="text-sm text-[color:var(--color-aside)]">Loading…</p>}
        {error && <p className="text-sm text-red-700">Error: {error}</p>}
        {bibles && bibles.length === 0 && !loading && (
          <p className="text-sm text-[color:var(--color-aside)]">
            No bibles available for this filter on your api.bible account.
            {mode === "ethiopian" && " The full Ethiopian Tewahedo canon (Enoch, Jubilees, etc.) is generally not on api.bible."}
          </p>
        )}
        {bibles && bibles.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {bibles.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/read/${b.id}`}
                  className="block rounded-lg border border-[color:var(--color-aside)]/30 px-4 py-3 hover:bg-[color:var(--color-ink)]/5"
                >
                  <div className="font-medium">{b.nameLocal || b.name}</div>
                  <div className="text-xs text-[color:var(--color-aside)]">
                    {b.language.nameLocal || b.language.name} · {b.abbreviationLocal || b.abbreviation}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
