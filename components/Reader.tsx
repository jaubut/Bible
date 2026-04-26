"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import type { Book } from "@/lib/bible-api";
import { parseScript, type Segment } from "@/lib/script";

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

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<number>(0);

  const [bookId, chapter] = useMemo(() => {
    const [b, c] = passageId.split(".");
    return [b, Number(c || "1")];
  }, [passageId]);

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
    u.rate = seg.kind === "aside" ? 0.95 : 0.9;
    u.pitch = seg.kind === "aside" ? 1.0 : 1.0;
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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-baseline justify-between">
        <Link href="/" className="text-sm text-[color:var(--color-aside)] hover:underline">
          ← All translations
        </Link>
        <div className="text-xs text-[color:var(--color-aside)]">{bibleId}</div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={bookId}
          onChange={(e) => setPassageId(`${e.target.value}.1`)}
          className="rounded-md border border-[color:var(--color-aside)]/40 bg-transparent px-3 py-1.5"
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
          className="w-20 rounded-md border border-[color:var(--color-aside)]/40 bg-transparent px-3 py-1.5"
        />
        <select
          value={density}
          onChange={(e) => setDensity(e.target.value as "light" | "normal" | "rich")}
          className="rounded-md border border-[color:var(--color-aside)]/40 bg-transparent px-3 py-1.5"
          title="How much commentary"
        >
          <option value="light">Light</option>
          <option value="normal">Normal</option>
          <option value="rich">Rich</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => (playing ? pause() : play(activeIdx ?? 0))}
            disabled={!segments.length}
            className="rounded-full bg-[color:var(--color-ink)] p-2 text-[color:var(--color-parchment)] disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={next}
            disabled={!segments.length}
            className="rounded-full border border-[color:var(--color-aside)]/40 p-2 disabled:opacity-40"
            aria-label="Next segment"
          >
            <SkipForward size={18} />
          </button>
          <button
            onClick={stop}
            disabled={!segments.length}
            className="rounded-full border border-[color:var(--color-aside)]/40 p-2 disabled:opacity-40"
            aria-label="Stop"
          >
            <Square size={18} />
          </button>
        </div>
      </div>

      <article className="prose prose-stone mt-8 max-w-none">
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
                className={`my-3 italic text-[color:var(--color-aside)] border-l-2 border-[color:var(--color-aside)]/40 pl-3 ${
                  active ? "bg-[color:var(--color-ink)]/5" : ""
                }`}
              >
                {s.text}
              </p>
            );
          return (
            <p
              key={i}
              className={`my-2 leading-relaxed ${active ? "bg-[color:var(--color-ink)]/5 rounded" : ""}`}
            >
              {s.verse ? <sup className="mr-1 text-xs text-[color:var(--color-aside)]">{s.verse}</sup> : null}
              {s.text}
            </p>
          );
        })}
      </article>

      {process.env.NODE_ENV === "development" && script && (
        <details className="mt-10 text-xs text-[color:var(--color-aside)]">
          <summary>Raw script</summary>
          <pre className="whitespace-pre-wrap">{script}</pre>
        </details>
      )}
    </main>
  );
}
