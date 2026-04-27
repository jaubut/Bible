"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

// Persistent <audio> element that survives chapter-page navigations.
// iOS Safari grants autoplay permission to a specific HTMLAudioElement once
// the user taps Play. That permission travels with the DOM node — destroy
// the node (component unmount) and the permission is lost. By keeping the
// element alive across all reader pages, src swap + play() continues to work
// without a fresh user gesture, including after `ended`.

export type ChapterRef = {
  bibleId: string;
  bookId: string;
  chapter: number;
  totalChapters: number;
  bookName: string;
  audioUrl: string | null; // blob URL for current chapter
  nextAudioUrl: string | null; // preloaded next chapter, or null
  autoplay: boolean; // user setting
};

type PodcastContextValue = {
  // State
  playing: boolean;
  audioCurrent: number;
  audioDuration: number;
  error: string | null;
  blockedAutoplay: boolean;
  // Registration
  registerChapter: (ref: ChapterRef) => void;
  clearChapter: () => void;
  // Controls
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  skipBack: () => void;
  skipForward: () => void;
  resumeAfterBlocked: () => Promise<void>;
};

const PodcastContext = createContext<PodcastContextValue | null>(null);

export function usePodcast(): PodcastContextValue {
  const ctx = useContext(PodcastContext);
  if (!ctx) {
    throw new Error("usePodcast must be used inside <PodcastProvider>");
  }
  return ctx;
}

export function PodcastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chapterRef = useRef<ChapterRef | null>(null);
  const previousBlobRef = useRef<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blockedAutoplay, setBlockedAutoplay] = useState(false);

  // Mount the audio element once — never remove it across navigations.
  useEffect(() => {
    if (audioRef.current) return;
    const el = document.createElement("audio");
    el.preload = "auto";
    // iOS — must be set BEFORE any play() to avoid fullscreen takeover
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.style.display = "none";
    document.body.appendChild(el);
    audioRef.current = el;

    el.addEventListener("timeupdate", () => setAudioCurrent(el.currentTime));
    el.addEventListener("loadedmetadata", () => setAudioDuration(el.duration));
    el.addEventListener("play", () => {
      setPlaying(true);
      setBlockedAutoplay(false);
    });
    el.addEventListener("pause", () => setPlaying(false));
    el.addEventListener("error", () => setError("Audio playback error"));

    el.addEventListener("ended", () => {
      setPlaying(false);
      const c = chapterRef.current;
      if (!c) return;
      if (!c.autoplay) return;
      if (c.chapter >= c.totalChapters) return;

      const next = c.chapter + 1;

      if (c.nextAudioUrl) {
        // Best path — same element, src swap, gesture credit preserved
        // Revoke previous current (we're moving forward)
        if (previousBlobRef.current && previousBlobRef.current !== c.audioUrl) {
          URL.revokeObjectURL(previousBlobRef.current);
        }
        previousBlobRef.current = c.audioUrl;
        el.src = c.nextAudioUrl;
        el.load();
        el.play().catch((e: unknown) => {
          // iOS 17.2.x src-swap regression — surface "Tap to continue"
          setBlockedAutoplay(true);
          setError(
            e instanceof Error
              ? `auto-advance blocked: ${e.message}`
              : "auto-advance blocked",
          );
        });
        // URL update for shareability — does NOT remount the audio element
        router.push(
          `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${next}?mode=podcast`,
          { scroll: false },
        );
      } else {
        // Preload was not ready — fallback to the autoplay-flag path
        router.push(
          `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${next}?mode=podcast&autoplay=1`,
        );
      }
    });

    return () => {
      // We intentionally do NOT remove the element on cleanup — Provider lives
      // for the lifetime of the app. This branch only fires in StrictMode dev
      // double-invoke; we leak the first element for one render, which is OK.
    };
  }, [router]);

  // MediaSession — register once. Use nexttrack/previoustrack (NOT
  // seekforward/seekbackward) so iOS shows chapter buttons on lock screen.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => undefined);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const c = chapterRef.current;
      if (!c) return;
      if (c.chapter >= c.totalChapters) return;
      router.push(
        `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${c.chapter + 1}?mode=podcast`,
      );
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const c = chapterRef.current;
      if (!c || c.chapter <= 1) return;
      router.push(
        `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${c.chapter - 1}?mode=podcast`,
      );
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      const el = audioRef.current;
      if (el && details.seekTime != null) {
        el.currentTime = details.seekTime;
      }
    });
  }, [router]);

  const registerChapter = useCallback((ref: ChapterRef) => {
    const prev = chapterRef.current;
    chapterRef.current = ref;

    // If this is a new chapter (different passage), reset the element so the
    // current src reflects the new chapter's audio.
    const isNewChapter =
      !prev ||
      prev.bibleId !== ref.bibleId ||
      prev.bookId !== ref.bookId ||
      prev.chapter !== ref.chapter;

    if (isNewChapter) {
      const el = audioRef.current;
      if (el && ref.audioUrl && el.src !== ref.audioUrl) {
        // Revoke the prev chapter's blob (no longer needed)
        if (
          previousBlobRef.current &&
          previousBlobRef.current !== ref.audioUrl
        ) {
          URL.revokeObjectURL(previousBlobRef.current);
        }
        previousBlobRef.current = el.src.startsWith("blob:") ? el.src : null;
        el.src = ref.audioUrl;
        el.load();
        setAudioCurrent(0);
      }
    }

    if (
      typeof navigator !== "undefined" &&
      "mediaSession" in navigator &&
      typeof MediaMetadata !== "undefined"
    ) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${ref.bookName} ${ref.chapter}`,
        artist: "Bible Companion",
        album: ref.bookName,
      });
    }
  }, []);

  const clearChapter = useCallback(() => {
    chapterRef.current = null;
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    const c = chapterRef.current;
    if (!el || !c?.audioUrl) return;

    if (el.src !== c.audioUrl) {
      el.src = c.audioUrl;
      el.load();
    }
    try {
      await el.play();
      setBlockedAutoplay(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
    } else {
      el.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = seconds;
  }, []);

  const skipBack = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 15);
  }, []);

  const skipForward = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const max = isFinite(el.duration) ? el.duration : el.currentTime;
    el.currentTime = Math.min(max, el.currentTime + 15);
  }, []);

  const resumeAfterBlocked = useCallback(async () => {
    setBlockedAutoplay(false);
    setError(null);
    await play();
  }, [play]);

  return (
    <PodcastContext.Provider
      value={{
        playing,
        audioCurrent,
        audioDuration,
        error,
        blockedAutoplay,
        registerChapter,
        clearChapter,
        play,
        pause,
        seek,
        skipBack,
        skipForward,
        resumeAfterBlocked,
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
}
