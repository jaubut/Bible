"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Bible } from "@/lib/bible-api";

type Mode = "ethiopian" | "pseudepigrapha" | "english" | "french" | "all";

const MODE_LABEL: Record<Mode, string> = {
  ethiopian: "Ethiopian",
  pseudepigrapha: "Pseudepigrapha",
  english: "English",
  french: "Français",
  all: "All",
};

const VISIBLE_MODES: Mode[] = ["ethiopian", "pseudepigrapha", "english", "french"];

export default function LanguagePicker() {
  const [mode, setMode] = useState<Mode>("english");
  const [bibles, setBibles] = useState<Bible[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
        {VISIBLE_MODES.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className="pill"
          >
            {MODE_LABEL[m]}
          </button>
        ))}
        <button
          onClick={() => setShowAll(true)}
          className="pill"
          aria-label="Browse all translations"
        >
          Browse all 244 →
        </button>
      </div>

      <div className="mt-5">
        {loading && (
          <p className="t-caption text-[color:var(--color-aside)]">Loading…</p>
        )}
        {error && <p className="t-caption text-red-700">Error: {error}</p>}
        {bibles && bibles.length === 0 && !loading && (
          <div className="card-flat p-5 text-sm text-[color:var(--color-aside)] leading-relaxed">
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
                {" "}→ <em>Plan</em> tab → request access.
                <br />
                <br />
                For books unique to the Ethiopian canon (1 Enoch, Jubilees) — which
                api.bible does not carry — switch to the{" "}
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
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {bibles.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/read/${encodeURIComponent(b.id)}`}
                  className="card block p-4 transition"
                >
                  <div className="font-medium">{b.nameLocal || b.name}</div>
                  <div className="t-caption text-[color:var(--color-aside)] mt-0.5">
                    {b.language.nameLocal || b.language.name} · {b.abbreviationLocal || b.abbreviation}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAll && (
        <BrowseAllSheet
          onClose={() => setShowAll(false)}
          onPick={() => setShowAll(false)}
        />
      )}
    </div>
  );
}

function BrowseAllSheet({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: () => void;
}) {
  const [bibles, setBibles] = useState<Bible[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/bibles")
      .then((r) => r.json())
      .then((d) => setBibles(d.bibles ?? []))
      .catch(() => setBibles([]));
  }, []);

  const grouped = useMemo(() => {
    if (!bibles) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? bibles.filter(
          (b) =>
            (b.name + b.nameLocal + b.language.name + b.language.nameLocal)
              .toLowerCase()
              .includes(q),
        )
      : bibles;
    const map = new Map<string, Bible[]>();
    for (const b of filtered) {
      const key = b.language.nameLocal || b.language.name;
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bibles, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl max-h-[85vh] flex flex-col"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <header className="border-b border-[color:var(--color-divider)] px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="t-subsection">Browse all translations</h2>
            <button onClick={onClose} className="btn-ghost" aria-label="Close">
              ✕
            </button>
          </div>
          <input
            type="search"
            placeholder="Search by name or language…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--color-divider)] bg-transparent px-3 py-2.5"
          />
        </header>
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {!bibles && (
            <p className="t-caption text-[color:var(--color-aside)]">Loading…</p>
          )}
          {bibles && grouped.length === 0 && (
            <p className="t-caption text-[color:var(--color-aside)]">
              No matches.
            </p>
          )}
          {grouped.map(([lang, list]) => (
            <section key={lang}>
              <h3 className="t-caption uppercase tracking-wide text-[color:var(--color-aside)] mb-2">
                {lang} <span className="opacity-60">({list.length})</span>
              </h3>
              <ul className="space-y-1.5">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/read/${encodeURIComponent(b.id)}`}
                      onClick={onPick}
                      className="block rounded-lg px-3 py-2 hover:bg-[color:var(--color-tint)]"
                    >
                      <div className="text-sm">{b.nameLocal || b.name}</div>
                      <div className="t-caption text-[color:var(--color-aside)]">
                        {b.abbreviationLocal || b.abbreviation}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
