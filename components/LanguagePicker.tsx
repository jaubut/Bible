"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bible } from "@/lib/bible-api";

type Mode = "ethiopian" | "pseudepigrapha" | "english" | "french" | "all";

const MODE_LABEL: Record<Mode, string> = {
  ethiopian: "Ethiopian",
  pseudepigrapha: "Pseudepigrapha",
  english: "English",
  french: "French",
  all: "All",
};

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
      else if (mode === "pseudepigrapha") params.set("pseudepigrapha", "1");
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
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Language filter">
        {(["ethiopian", "pseudepigrapha", "english", "french", "all"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 min-h-[40px] text-sm border transition ${
              mode === m
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-bg)] border-[color:var(--color-ink)]"
                : "border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && (
          <p className="text-sm text-[color:var(--color-aside)]">Loading…</p>
        )}
        {error && <p className="text-sm text-red-700">Error: {error}</p>}
        {bibles && bibles.length === 0 && !loading && (
          <div className="rounded-xl border border-[color:var(--color-divider)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-aside)] leading-relaxed">
            <p className="font-medium text-[color:var(--color-ink)]">
              No Bibles for this filter.
            </p>
            {mode === "ethiopian" && (
              <p className="mt-2">
                Your api.bible plan currently does not include Amharic, Ge&apos;ez,
                Tigrinya, or Oromo translations. To unlock them: open your{" "}
                <Link href="https://scripture.api.bible/admin" className="underline">
                  api.bible dashboard
                </Link>
                {" "}→ <em>Plan</em> tab → request access to the language.
                <br />
                <br />
                For the books unique to the Ethiopian canon (1 Enoch, Jubilees,
                etc.) — which api.bible does not carry — switch to the{" "}
                <button
                  type="button"
                  onClick={() => setMode("pseudepigrapha")}
                  className="underline font-medium"
                >
                  Pseudepigrapha
                </button>
                {" "}tab. Public-domain English translations are bundled with the app.
              </p>
            )}
          </div>
        )}
        {bibles && bibles.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {bibles.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/read/${b.id}`}
                  className="block rounded-xl border border-[color:var(--color-divider)] bg-[color:var(--color-surface)] px-4 py-3 hover:bg-[color:var(--color-ink)]/5 transition min-h-[64px]"
                >
                  <div className="font-medium">{b.nameLocal || b.name}</div>
                  <div className="text-xs text-[color:var(--color-aside)] mt-0.5">
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
