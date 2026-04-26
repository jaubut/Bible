"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pause, Play, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Book } from "@/lib/bible-api";
import { parseScript, parsePodcast, type Segment } from "@/lib/script";
import { defaultPair } from "@/lib/google-voices";
import {
  STORAGE_KEYS,
  type CompanionLang,
  type Mode,
  isCompanionLang,
  isMode,
} from "@/lib/settings";
import {
  listVoices,
  onVoicesReady,
  pickBest,
  pickPair,
  isIOS,
  isAppleDesktop,
} from "@/lib/voices";
import { saveLastRead } from "@/lib/last-read";
import Settings from "@/components/Settings";

type Props = {
  bibleId: string;
  bookId: string;
  books: Book[];
  initialPassageId: string;
  modeOverride?: "podcast" | "reading";
};

export default function Reader({
  bibleId,
  bookId,
  books,
  initialPassageId,
  modeOverride,
}: Props) {
  const router = useRouter();
  const [passageId] = useState(initialPassageId);
  const [script, setScript] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [density, setDensity] = useState<"light" | "normal" | "rich">("normal");
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceA, setVoiceA] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceB, setVoiceB] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(0.95);
  const [companionLang, setCompanionLang] = useState<CompanionLang>("en");
  const [mode, setMode] = useState<Mode>("reading");
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  const [edgeVoiceA, setEdgeVoiceA] = useState<string>("");
  const [edgeVoiceB, setEdgeVoiceB] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<number>(0);

  const chapter = useMemo(() => {
    const c = passageId.split(".").pop();
    return Number(c || "1");
  }, [passageId]);

  const currentBook = useMemo(
    () => books.find((b) => b.id === bookId) ?? books[0],
    [books, bookId],
  );

  // Persist as last-read for the home Continue card
  useEffect(() => {
    if (!currentBook) return;
    saveLastRead({
      bibleId,
      bookId,
      bookName: currentBook.name,
      chapter: String(chapter),
      ts: Date.now(),
    });
  }, [bibleId, bookId, currentBook, chapter]);

  // If modeOverride is provided via URL, write it to localStorage so the
  // Settings panel and the rest of the Reader pick it up.
  useEffect(() => {
    if (modeOverride) {
      localStorage.setItem(STORAGE_KEYS.mode, modeOverride);
      setMode(modeOverride);
    }
  }, [modeOverride]);

  function gotoChapter(delta: number) {
    const next = chapter + delta;
    if (next < 1) return;
    router.push(
      `/read/${encodeURIComponent(bibleId)}/${encodeURIComponent(bookId)}/${next}`,
    );
  }

  // Load voice + rate from settings; refresh whenever Settings updates them
  useEffect(() => {
    function refresh() {
      const cl = localStorage.getItem(STORAGE_KEYS.companionLang);
      const lang = isCompanionLang(cl) ? cl : "en";
      setCompanionLang(lang);

      const m = localStorage.getItem(STORAGE_KEYS.mode);
      setMode(isMode(m) ? m : "reading");

      const all = listVoices(lang);
      const allRaw = window.speechSynthesis?.getVoices?.() ?? [];

      // Reading-mode single voice
      let uri = localStorage.getItem(STORAGE_KEYS.voiceURI);
      if (!uri) {
        const best = pickBest(lang);
        if (best) {
          uri = best.voiceURI;
          localStorage.setItem(STORAGE_KEYS.voiceURI, uri);
        }
      }
      const v = uri ? all.find((rv) => rv.voice.voiceURI === uri)?.voice : null;
      setSelectedVoice(v ?? null);

      // Podcast-mode dual voices
      let aURI = localStorage.getItem(STORAGE_KEYS.voiceURI_A);
      let bURI = localStorage.getItem(STORAGE_KEYS.voiceURI_B);
      if (!aURI || !bURI) {
        const pair = pickPair(lang);
        if (!aURI && pair.a) {
          aURI = pair.a.voiceURI;
          localStorage.setItem(STORAGE_KEYS.voiceURI_A, aURI);
        }
        if (!bURI && pair.b) {
          bURI = pair.b.voiceURI;
          localStorage.setItem(STORAGE_KEYS.voiceURI_B, bURI);
        }
      }
      setVoiceA(aURI ? allRaw.find((vv) => vv.voiceURI === aURI) ?? null : null);
      setVoiceB(bURI ? allRaw.find((vv) => vv.voiceURI === bURI) ?? null : null);

      const r = parseFloat(localStorage.getItem(STORAGE_KEYS.voiceRate) ?? "0.95");
      if (!Number.isNaN(r)) setRate(r);

      // Edge voices for podcast mode
      const def = defaultPair(lang);
      const ea = localStorage.getItem(STORAGE_KEYS.edgeVoiceA) || def.a;
      const eb = localStorage.getItem(STORAGE_KEYS.edgeVoiceB) || def.b;
      setEdgeVoiceA(ea);
      setEdgeVoiceB(eb);
    }
    refresh();
    const off = onVoicesReady(refresh);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.voiceURI ||
        e.key === STORAGE_KEYS.voiceURI_A ||
        e.key === STORAGE_KEYS.voiceURI_B ||
        e.key === STORAGE_KEYS.voiceRate ||
        e.key === STORAGE_KEYS.companionLang ||
        e.key === STORAGE_KEYS.mode ||
        e.key === STORAGE_KEYS.edgeVoiceA ||
        e.key === STORAGE_KEYS.edgeVoiceB
      )
        refresh();
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
          body: JSON.stringify({
            bibleId,
            passageId,
            density,
            lang: companionLang,
            mode,
          }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Companion error: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        const parser = mode === "podcast" ? parsePodcast : parseScript;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          if (cancelled) return;
          setScript(acc);
          setSegments(parser(acc));
        }
        if (!cancelled) setSegments(parser(acc));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bibleId, passageId, density, companionLang, mode]);

  // Reset cached MP3 URL whenever the audio identity changes
  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        /* noop */
      }
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioCurrent(0);
    setAudioDuration(0);
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleId, passageId, companionLang, mode, edgeVoiceA, edgeVoiceB]);

  function stop() {
    if (typeof window === "undefined") return;
    if (mode === "podcast") {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {
          /* noop */
        }
      }
      setPlaying(false);
      return;
    }
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setActiveIdx(null);
  }

  async function ensurePodcastAudio(): Promise<string | null> {
    if (audioUrl) return audioUrl;
    setAudioLoading(true);
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bibleId,
          passageId,
          lang: companionLang,
          mode: "podcast",
          voiceA: edgeVoiceA,
          voiceB: edgeVoiceB,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Audio API ${res.status}: ${body.slice(0, 200)}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setAudioLoading(false);
    }
  }

  async function play(fromIdx = 0) {
    if (typeof window === "undefined") return;

    if (mode === "podcast") {
      const a = audioRef.current;
      if (!a) return;

      // iOS Safari: must call play() synchronously inside the user gesture.
      // If we await the fetch first, the gesture context is lost and play()
      // is rejected with NotAllowedError. Fix: kick play() now with a tiny
      // silent placeholder, then swap the real src once the fetch resolves.
      const SILENT_MP3 =
        "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

      if (audioUrl) {
        // Fast path: cached blob URL exists, plain play()
        if (a.src !== audioUrl) a.src = audioUrl;
        try {
          await a.play();
          setPlaying(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
        return;
      }

      // Cold path: must keep gesture alive. Start silent playback NOW,
      // fetch in parallel, then swap src.
      try {
        a.src = SILENT_MP3;
        a.load();
        const playPromise = a.play();
        // Don't await yet — fire the fetch first
        const url = await ensurePodcastAudio();
        // Now wait for the silent play to actually begin (or fail)
        try {
          await playPromise;
        } catch {
          /* silent play may reject if browser blocks data URLs — fine,
             the real swap below will trigger again */
        }
        if (!url) {
          a.pause();
          return;
        }
        a.src = url;
        a.load();
        await a.play();
        setPlaying(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      return;
    }

    // Reading mode: browser TTS, segment-by-segment
    if (!segments.length) return;

    // First-play tip: if user is on iOS or macOS and has not dismissed it,
    // and is using a Standard-grade voice, suggest installing a Premium voice.
    const dismissed = localStorage.getItem(STORAGE_KEYS.iosTipDismissed) === "1";
    if (!dismissed && (isIOS() || isAppleDesktop())) {
      const v = selectedVoice;
      const isHighQuality =
        !!v &&
        (v.name.toLowerCase().includes("premium") ||
          v.name.toLowerCase().includes("enhanced") ||
          v.name.toLowerCase().includes("siri"));
      if (!isHighQuality) {
        setShowVoiceTip(true);
      }
    }

    window.speechSynthesis.cancel();
    setPlaying(true);
    queueRef.current = fromIdx;
    speakNext();
  }

  function dismissVoiceTip() {
    localStorage.setItem(STORAGE_KEYS.iosTipDismissed, "1");
    setShowVoiceTip(false);
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
    if (seg.kind === "host") {
      const v = seg.speaker === "A" ? voiceA : voiceB;
      if (v) u.voice = v;
      else if (selectedVoice) u.voice = selectedVoice;
      u.rate = rate;
    } else {
      if (selectedVoice) u.voice = selectedVoice;
      u.rate = rate * (seg.kind === "aside" ? 1.05 : 1);
    }
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
    if (mode === "podcast") {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        a.play().catch(() => {
          /* noop */
        });
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
      return;
    }
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
    }
  }

  function next() {
    if (mode === "podcast") {
      const a = audioRef.current;
      if (a) a.currentTime = Math.min(a.currentTime + 15, a.duration || a.currentTime);
      return;
    }
    queueRef.current = Math.min(queueRef.current + 1, segments.length);
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    if (playing) speakNext();
  }

  function back15() {
    const a = audioRef.current;
    if (a) a.currentTime = Math.max(0, a.currentTime - 15);
  }

  function fmtTime(s: number): string {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <main
      className="mx-auto max-w-3xl px-5 sm:px-6 pt-6 pb-32"
      style={{ paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
    >
      <header className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/read/${encodeURIComponent(bibleId)}/${encodeURIComponent(bookId)}`}
          className="btn-ghost text-sm"
          aria-label="Back to chapters"
        >
          ← {currentBook?.name ?? "Chapters"}
        </Link>
        <Settings />
      </header>

      <div className="mb-2">
        <h1 className="t-section">
          {currentBook?.name} {chapter}
        </h1>
        <div className="t-caption text-[color:var(--color-aside)] mt-1">
          {mode === "podcast" ? (
            <>Podcast mode — two hosts in conversation</>
          ) : (
            <>Reading mode — verses with cultural asides</>
          )}
        </div>
      </div>

      {mode === "reading" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="t-caption text-[color:var(--color-aside)]">
            Density:
          </span>
          <select
            value={density}
            onChange={(e) =>
              setDensity(e.target.value as "light" | "normal" | "rich")
            }
            className="rounded-md bg-transparent text-sm py-1.5 pl-1 pr-6 hover:bg-[color:var(--color-tint)] cursor-pointer"
            aria-label="Commentary density"
          >
            <option value="light">Light</option>
            <option value="normal">Normal</option>
            <option value="rich">Rich</option>
          </select>
        </div>
      )}

      {/* Mode badge to make active mode visible at a glance */}
      <div className="hidden text-xs text-[color:var(--color-aside)]">
        {mode === "podcast" ? (
          <>
            Podcast mode — two hosts in conversation. Change in{" "}
            <span aria-hidden>⚙</span> Settings.
          </>
        ) : (
          <>
            Reading mode — verses with cultural asides. Change in{" "}
            <span aria-hidden>⚙</span> Settings.
          </>
        )}
      </div>

      <article className="prose-stone mt-8 max-w-none text-[17px] leading-[1.75]">
        {loading && !segments.length && (
          <p className="text-[color:var(--color-aside)]">Preparing the companion…</p>
        )}
        {error && <p className="text-red-700">Error: {error}</p>}
        {segments.map((s, i) => {
          const active = i === activeIdx;
          if (s.kind === "pause") return <div key={i} className="h-3" />;
          if (s.kind === "host") {
            const isA = s.speaker === "A";
            const voice = isA ? voiceA : voiceB;
            const speakerLabel = voice
              ? voice.name.split(/\s+|\(|—|–|-/)[0]
              : isA
              ? "Host A"
              : "Host B";
            return (
              <div
                key={i}
                className={`my-4 flex gap-3 ${isA ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isA
                      ? "bg-[color:var(--color-ink)] text-[color:var(--color-bg)]"
                      : "bg-[color:var(--color-accent)] text-[color:var(--color-bg)]"
                  }`}
                  aria-hidden
                >
                  {isA ? "A" : "B"}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs uppercase tracking-wide text-[color:var(--color-aside)] ${
                      isA ? "" : "text-right"
                    }`}
                  >
                    {speakerLabel}
                  </div>
                  <p
                    className={`mt-1 px-4 py-3 rounded-2xl ${
                      isA
                        ? "bg-[color:var(--color-surface)] rounded-tl-sm"
                        : "bg-[color:var(--color-ink)]/5 rounded-tr-sm"
                    } ${active ? "ring-2 ring-[color:var(--color-ink)]/20" : ""}`}
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            );
          }
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

      {/* iOS / macOS Premium voice tip — shown once on first play */}
      {showVoiceTip && (
        <div
          className="fixed inset-x-0 bottom-[5.5rem] z-40 px-4"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto max-w-md rounded-2xl border border-[color:var(--color-divider)] bg-[color:var(--color-surface)] shadow-lg p-4">
            <p className="text-sm font-semibold">Better voice, free</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-aside)]">
              {isIOS()
                ? "iOS → Settings → Accessibility → Spoken Content → Voices → English (or French) → tap any 'Premium' voice to download. Then come back and pick it from Settings."
                : "System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → install a Premium voice. Then pick it from Settings."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={dismissVoiceTip}
                className="rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-bg)] px-4 min-h-[40px] text-sm hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for podcast mode */}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onTimeUpdate={(e) => setAudioCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* Sticky transport bar — bottom of screen */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-divider)] bg-[color:var(--color-surface)]/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-3 space-y-2">
          {mode === "podcast" && (audioUrl || audioLoading) && (
            <div className="flex items-center gap-3 text-xs text-[color:var(--color-aside)]">
              <span className="tabular-nums w-10 text-right">{fmtTime(audioCurrent)}</span>
              <input
                type="range"
                min={0}
                max={audioDuration || 0}
                step={0.1}
                value={audioCurrent}
                disabled={!audioDuration}
                onChange={(e) => {
                  const a = audioRef.current;
                  if (a) a.currentTime = parseFloat(e.target.value);
                }}
                className="flex-1 accent-[color:var(--color-ink)]"
                aria-label="Scrub"
              />
              <span className="tabular-nums w-10">{fmtTime(audioDuration)}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={mode === "podcast" ? back15 : () => gotoChapter(-1)}
              disabled={mode === "podcast" ? !audioUrl : chapter <= 1}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full hover:bg-[color:var(--color-tint)] disabled:opacity-40 transition"
              aria-label={mode === "podcast" ? "Back 15 seconds" : "Previous chapter"}
            >
              {mode === "podcast" ? (
                <span className="text-xs font-medium tabular-nums">−15</span>
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
            <button
              onClick={() => (playing ? pause() : play(activeIdx ?? 0))}
              disabled={mode === "podcast" ? audioLoading : !segments.length}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-bg)] disabled:opacity-40 transition hover:opacity-90"
              aria-label={playing ? "Pause" : "Play"}
            >
              {audioLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : playing ? (
                <Pause size={22} />
              ) : (
                <Play size={22} />
              )}
            </button>
            <button
              onClick={mode === "podcast" ? next : () => gotoChapter(1)}
              disabled={mode === "podcast" ? !audioUrl : false}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full hover:bg-[color:var(--color-tint)] disabled:opacity-40 transition"
              aria-label={mode === "podcast" ? "Forward 15 seconds" : "Next chapter"}
            >
              {mode === "podcast" ? (
                <span className="text-xs font-medium tabular-nums">+15</span>
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
          {mode === "podcast" && audioLoading && (
            <p className="text-center text-xs text-[color:var(--color-aside)]">
              Generating audio with neural voices… ~30–60s the first time, instant on replays.
            </p>
          )}
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
