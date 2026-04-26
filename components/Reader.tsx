"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import type { Book } from "@/lib/bible-api";
import { parseScript, type Segment } from "@/lib/script";
import { STORAGE_KEYS } from "@/lib/settings";
import { listVoices, onVoicesReady } from "@/lib/voices";
import Settings from "@/components/Settings";

type Props = {
  bibleId: string;
  books: Book[];
  initialPassageId: string;
};

export default function Reader({ bibleId, books, initialPassageId }: Props) {
  const [passageId, setPassageId] = useState(initialPassageId);
  const [script, setScript] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [density, setDensity] = useState<"light" | "normal" | "rich">("normal");
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(0.95);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<number>(0);

  const [bookId, chapter] = useMemo(() => {
    const [b, c] = passageId.split(".");
    return [b, Number(c || "1")];
  }, [passageId]);

  // Load voice + rate from settings; refresh whenever Settings updates them
  useEffect(() => {
    function refresh() {
      const uri = localStorage.getItem(STORAGE_KEYS.voiceURI);
      const all = listVoices();
      const v = uri ? all.find((rv) => rv.voice.voiceURI === uri)?.voice : null;
      setSelectedVoice(v ?? null);
      const r = parseFloat(localStorage.getItem(STORAGE_KEYS.voiceRate) ?? "0.95");
      if (!Number.isNaN(r)) setRate(r);
    }
    refresh();
    const off = onVoicesReady(refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.voiceURI || e.key === STORAGE_KEYS.voiceRate) refresh();
    };
    window.addEventListener("storage", onStorage);
    // Also poll on focus — same-tab Settings changes don't fire storage events
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      off();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Fetch the companion script whenever passage or density changes
  useEffect(() => {
    let cancelled = false;
    stop();
    setSegments([]);
    setScript("");
    setActiveIdx(null);
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/companion", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bibleId, passageId, density }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Companion error: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          if (cancelled) return;
          setScript(acc);
          setSegments(parseScript(acc));
        }
        if (!cancelled) setSegments(parseScript(acc));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bibleId, passageId, density]);

  function stop() {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setActiveIdx(null);
  }

  function play(fromIdx = 0) {
    if (typeof window === "undefined" || !segments.length) return;
    window.speechSynthesis.cancel();
    setPlaying(true);
    queueRef.current = fromIdx;
    speakNext();
  }

  function speakNext() {
    const idx = queueRef.current;
    if (idx >= segments.length) {
      setPlaying(false);
      setActiveIdx(null);
      return;
    }
    const seg = segments[idx];
    setActiveIdx(idx);

    if (seg.kind === "pause") {
      setTimeout(() => {
        queueRef.current = idx + 1;
        speakNext();
      }, 600);
      return;
    }

    const u = new SpeechSynthesisUtterance(seg.text);
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = rate * (seg.kind === "aside" ? 1.05 : 1);
    u.pitch = 1.0;
    u.volume = 1;
    u.onend = () => {
      queueRef.current = idx + 1;
      if (queueRef.current < segments.length) speakNext();
      else {
        setPlaying(false);
        setActiveIdx(null);
      }
    };
    u.onerror = () => {
      setPlaying(false);
      setActiveIdx(null);
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  function pause() {
    if (typeof window === "undefined") return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
    }
  }

  function next() {
    queueRef.current = Math.min(queueRef.current + 1, segments.length);
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    if (playing) speakNext();
  }

  return (
    <main
      className="mx-auto max-w-3xl px-5 sm:px-6 pt-6 pb-32"
      style={{ paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
    >
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center text-sm text-[color:var(--color-aside)] hover:underline"
        >
          ← All translations
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-[color:var(--color-aside)]">
            {bibleId}
          </span>
          <Settings />
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3">
        <select
          value={bookId}
          onChange={(e) => setPassageId(`${e.target.value}.1`)}
          className="rounded-lg border border-[color:var(--color-divider)] bg-transparent px-3 py-3 min-h-[44px] col-span-2 sm:col-span-1"
          aria-label="Book"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={chapter}
          onChange={(e) => setPassageId(`${bookId}.${Math.max(1, Number(e.target.value))}`)}
          className="rounded-lg border border-[color:var(--color-divider)] bg-transparent px-3 py-3 min-h-[44px]"
          aria-label="Chapter"
        />
        <select
          value={density}
          onChange={(e) => setDensity(e.target.value as "light" | "normal" | "rich")}
          className="rounded-lg border border-[color:var(--color-divider)] bg-transparent px-3 py-3 min-h-[44px]"
          aria-label="Commentary density"
          title="How much commentary"
        >
          <option value="light">Light</option>
          <option value="normal">Normal</option>
          <option value="rich">Rich</option>
        </select>
      </div>

      <article className="prose-stone mt-8 max-w-none text-[17px] leading-[1.75]">
        {loading && !segments.length && (
          <p className="text-[color:var(--color-aside)]">Preparing the companion…</p>
        )}
        {error && <p className="text-red-700">Error: {error}</p>}
        {segments.map((s, i) => {
          const active = i === activeIdx;
          if (s.kind === "pause") return <div key={i} className="h-3" />;
          if (s.kind === "aside")
            return (
              <p
                key={i}
                className={`my-3 italic text-[color:var(--color-aside)] border-l-2 border-[color:var(--color-divider)] pl-3 ${
                  active ? "read-active" : ""
                }`}
              >
                {s.text}
              </p>
            );
          return (
            <p
              key={i}
              className={`my-2 ${active ? "read-active" : ""}`}
            >
              {s.verse ? (
                <sup className="mr-1 text-xs text-[color:var(--color-aside)]">{s.verse}</sup>
              ) : null}
              {s.text}
            </p>
          );
        })}
      </article>

      {/* Sticky transport bar — bottom of screen */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-divider)] bg-[color:var(--color-surface)]/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-3 flex items-center justify-center gap-3">
          <button
            onClick={stop}
            disabled={!segments.length}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-40 transition"
            aria-label="Stop"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => (playing ? pause() : play(activeIdx ?? 0))}
            disabled={!segments.length}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-bg)] disabled:opacity-40 transition hover:opacity-90"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button
            onClick={next}
            disabled={!segments.length}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-40 transition"
            aria-label="Next segment"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {process.env.NODE_ENV === "development" && script && (
        <details className="mt-10 text-xs text-[color:var(--color-aside)]">
          <summary>Raw script</summary>
          <pre className="whitespace-pre-wrap">{script}</pre>
        </details>
      )}
    </main>
  );
}
