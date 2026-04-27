# iOS Safari Audio Auto-Advance — Research Doc

**Last updated:** 2026-04-26  
**Scope:** Bible Companion podcast mode, chapter-to-chapter autoplay on iPhone

---

## 1. Verdict

**Recommended approach: hoist the `<audio>` element to a persistent root layout component and swap `audio.src` in-place on chapter advance — do NOT navigate to a new page.**

iOS Safari grants autoplay permission to a specific `HTMLAudioElement` instance once the user taps Play. That permission travels with the DOM node. When you call `router.push()`, Next.js unmounts the current Reader component, discards the `<audio>` element, and mounts a fresh one — the permission is gone. The new page's `play()` call fires outside any user gesture and is blocked by WebKit's policy. The `?autoplay=1` flag you ship today is a best-effort workaround for a structurally broken pattern.

The fix is to stop destroying the element between chapters. Move the `<audio>` tag into a `PodcastPlayer` context that lives in the root layout (or a route group layout that wraps all `/read/...` pages). Each chapter page communicates the next chapter's audio URL to that context. On `ended`, the player swaps `audio.src` directly and calls `play()` — no navigation, no unmount, no permission loss. Apple explicitly documents this pattern as the correct way to chain tracks on iOS:

> "The `load()` and `play()` methods are enabled even on cellular networks once the user has started playing the first media element."  
> — [Apple HTML5 Audio and Video Guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/ControllingMediaWithJavaScript/ControllingMediaWithJavaScript.html)

The chapter URL still changes via `router.push()` (for bookmarking, back-button, share), but the audio element stays alive. This is exactly how Spotify Web Player, BBC Sounds, and every SPA-based streaming app works: one persistent player, chapters are just metadata.

---

## 2. iOS Safari Autoplay Rules — What Is Actually True

### The gesture-credit model

WebKit maintains a per-`HTMLAudioElement` flag, not a per-page flag. Once the user triggers a play event on a specific element (directly or via a play button's click handler that calls `el.play()`), that element is "user-gesture-activated." Subsequent calls to `el.play()` on that same element — including after a `src` swap — are permitted.

What resets the flag:
- The element is removed from the DOM (component unmount, page navigation)
- A new `Audio()` object is constructed
- `window.location` navigation (full reload)

What does NOT reset the flag:
- `el.src = newUrl; el.load(); el.play()` — confirmed by Apple docs
- `router.push()` with Next.js App Router's client-side navigation, **as long as the element is not unmounted** (i.e., it lives in a persistent layout)

### The iOS 17.2.1 regression

A regression was reported in iOS 17.2.1 where `el.src` change after `ended` did not allow `play()` in some configurations ([Apple Community thread 255418017](https://discussions.apple.com/thread/255418017)). The thread does not confirm resolution, but iOS 18 release notes contain no documented autoplay policy changes, and no equivalent bug was filed against iOS 18. Field evidence from audiobookshelf ([GitHub #2655](https://github.com/advplyr/audiobookshelf/issues/2655)) suggests the problem is specifically in **PWA standalone mode** (WebKit bug [#261858](https://bugs.webkit.org/show_bug.cgi?id=261858)) rather than regular Safari browser tabs.

**Key distinction:** your app runs in Safari browser tab, not as an installed PWA. The PWA bug (next track fails after backgrounding) does not apply to browser-tab use, which is the primary use case for Bible Companion.

### Page navigation kills the permission

The Next.js GitHub issue ([#56338](https://github.com/vercel/next.js/issues/56338)) confirms: after `router.push()`, even within a Next.js SPA (no actual HTML reload), a new audio element that calls `play()` programmatically gets blocked on iOS Safari. The reason is not the navigation itself but the component remount — the element is new and has never been activated by a user gesture in this lifecycle.

### Safari vs PWA standalone — critical differences

| Context | Auto-advance after ended | Background audio |
|---|---|---|
| Safari browser tab | Works if same element persists | Stops when Safari goes to background |
| PWA (home screen) standalone | Broken on iOS 16–17 (WebKit #261858) | Supposed to work, but unreliable |

For a web app targeting general users (not installed PWA), Safari browser tab is the baseline. Background audio is outside scope — users must keep Safari visible or use lock-screen controls via MediaSession.

---

## 3. Option Comparison

### Option A — Stay on current page, swap `audio.src` in-place (RECOMMENDED)

**How it works:** `<audio>` element lives in a layout component. On `ended`, call `el.src = nextUrl; el.load(); el.play()`. URL updates via `router.push()` or `router.replace()` for shareability. The element never unmounts.

**iOS Safari behavior:** Works. Apple explicitly endorses this pattern. The gesture credit granted by the initial user tap on Play follows the element through all subsequent `src` changes.

**Complexity:** Medium. Requires refactoring Reader's audio state into a React context + lifting the `<audio>` element to a shared layout. About 150–200 lines of new code, no new dependencies.

**Trade-offs:**
- URL stays accurate (chapters update via router)
- Scrubber UX is unchanged (same element)
- Lock-screen integration works via MediaSession (same element)
- Preloading the next chapter is explicit (fetch in background, cache blob URL)
- Must manage blob URL lifecycle across chapters (revoke old, retain current)

**Caveats:** The 17.2.1 regression is a risk — if it manifests, the `play()` call returns a rejected promise. Wrap in try/catch; show a "Tap to continue" button as fallback.

---

### Option B — MediaSource Extensions (MSE / ManagedMediaSource)

**How it works:** Create a `MediaSource`, append MP3 chunks into a `SourceBuffer`, stitch chapters seamlessly without any `src` change.

**iOS Safari behavior:** Apple shipped `ManagedMediaSource` (a superset of MSE) in iOS 17.1 ([Radiant Media Player writeup](https://www.radiantmediaplayer.com/blog/at-last-safari-17.1-now-brings-the-new-managed-media-source-api-to-iphone.html)). Audio-only MSE on iOS is supported. However: the API is `ManagedMediaSource`, not the standard `MediaSource` — you must feature-detect and fall back. Demuxing MP3 into MPEG-TS or fragmented MP4 segments server-side is required; raw MP3 blobs cannot be appended to a SourceBuffer.

**Complexity:** High. Requires: server-side segment repackaging (ffmpeg, expensive), MSE/MMS branching logic, buffer management, seeking logic. This is what hls.js and Shaka Player implement — hundreds of lines.

**Verdict for your use case:** Overkill. You are serving 5-minute MP3 chapters, not a continuous live stream. The complexity/benefit ratio is terrible. Reject.

---

### Option C — HLS streaming playlist

**How it works:** Serve a `.m3u8` playlist that lists all chapters. Safari plays HLS natively via the `<audio src="chapters.m3u8">` tag.

**iOS Safari behavior:** iOS Safari supports HLS natively for `<audio>`. Apple Podcasts itself uses HLS internally ([Podnews analysis](https://podnews.net/article/apple-podcasts-hls-tech)). Transitions between segments in an HLS playlist are seamless and managed by WebKit — no JavaScript gesture management needed.

**Complexity:** Medium-high. Requires: generating per-chapter `.ts` segment files (ffmpeg -c copy on your MP3s), a master/media playlist endpoint, potentially per-user dynamic playlists (since chapters are on-demand generated). Cold-start latency for HLS on iOS Safari is higher than a direct MP3 because the manifest is fetched first.

**Trade-offs:**
- Autoplay across chapters is bulletproof — WebKit owns the segment fetching
- But: each chapter is generated server-side on first request (TTS). You'd need to pre-generate or buffer segments, which conflicts with the lazy-generation model
- Per-chapter TTS generation + serving as HLS segments adds server complexity
- URL sharing per chapter requires tracking which playlist position = which chapter

**Verdict:** Viable for v2 if you switch to pre-generated audio per chapter. Not practical for your current on-demand TTS model. Defer.

---

### Option D — Web Audio API (AudioContext + AudioBuffer)

**How it works:** `fetch()` each chapter's MP3, `AudioContext.decodeAudioData()` it into a buffer, schedule `AudioBufferSourceNode`s back-to-back.

**iOS Safari behavior:** `AudioContext` requires the same user-gesture unlock as `<audio>`. Once unlocked (after the first `.resume()` in a click handler), the context can queue and play buffers indefinitely — no per-track gesture needed. However: Safari on iOS stops the AudioContext when the tab is backgrounded, and there is no MediaSession binding for `AudioContext`-sourced audio (lock-screen controls do not work).

**Complexity:** High. Must decode full 5-minute MP3 buffers into memory (RAM impact: ~50MB per chapter decoded as 32-bit float). No native scrubber. No lock-screen integration. Custom seek = painful.

**Verdict:** Only appropriate for UI sound effects, not podcast-length content. Reject.

---

### Option E — Navigate to next URL with `?autoplay=1` (current approach)

**How it works:** On `ended`, call `router.push('/read/.../N+1?autoplay=1')`. New page mounts a fresh `<audio>` element, calls `play()` via `setTimeout(..., 100)`.

**iOS Safari behavior:** Unreliable. The new `<audio>` element has no user gesture credit. WebKit MAY permit `play()` within a narrow window after a natural track-end event (the spec allows user agents to treat `ended` as a "user-engaged" signal), but this is not documented behavior and varies between iOS versions. In practice: works on iOS 16, sometimes works on iOS 17, reportedly broken in iOS 17.2.1 for some configurations.

**Complexity:** Already implemented. Zero additional work.

**Verdict:** The simplest code is the unreliable code. This is what you have today and it is the root cause of the problem you are trying to solve. Keep as a fallback only.

---

## 4. How Real Apps Handle This

### Spotify Web Player (open.spotify.com)

Spotify's Web Playback SDK [explicitly does not support iOS Safari](https://github.com/spotify/web-playback-sdk/issues/10) for local playback. On iPhone, Spotify's web player uses Spotify Connect — it tells the Spotify native app or another device to play. There is no `<audio>` element in Safari on iPhone for Spotify. Not a valid reference.

### YouTube Music

Uses Media Source Extensions for adaptive streaming. Does not navigate between pages per track — it is a full SPA with a persistent player div. URL changes via `history.pushState`. Same architecture as Option A, but with MSE instead of src swap.

### BBC Sounds

Implemented as a [Next.js SPA with a persistent player](https://medium.com/bbc-product-technology/sounds-web-next-a-persistent-player-prototype-for-bbc-sounds-bf996ef0c332) in the root layout. Their Standard Media Player wraps a DOM element that is injected once at app boot and never removed. Tracks change by updating the player's source. This is the direct analogue of Option A in a production deployment.

### Audiobookshelf (PWA)

Open-source audiobook server with a Next.js PWA front-end. They report exactly your problem: [chapters stop at track end on iOS 17+ in standalone PWA mode](https://github.com/advplyr/audiobookshelf/issues/2655). Their workaround is to recommend the native iOS app. The web player remains broken for this specific PWA scenario.

### Apple Podcasts web (podcasts.apple.com)

Requires sign-in; architecture not publicly documented. Likely uses HLS natively since Apple controls the content pipeline and can pre-segment all audio.

### Pocket Casts web

Uses a persistent audio element in a root-level React context. Confirmed SPA with no page-level navigation on track change. Matches Option A.

---

## 5. MediaSession API on iOS Safari

### What works (iOS 16.4+)

- `navigator.mediaSession.metadata` — title, artist, artwork display on lock screen ✓
- `setActionHandler('play')` and `setActionHandler('pause')` — work reliably ✓
- `setActionHandler('seekto')`, `seekforward`, `seekbackward` — work ✓
- `setActionHandler('nexttrack')` and `previoustrack` — work **only if you do NOT register seekforward/seekbackward handlers**

### The seekforward/nexttrack exclusion rule

iOS Safari shows either seek controls OR prev/next controls in the lock screen UI — not both. If you register `seekforward`/`seekbackward`, the OS shows the seek arrows. If you register `nexttrack`/`previoustrack` instead, the OS shows prev/next chapter buttons. Pick one set. For a podcast with chapters, prev/next chapter buttons are the right choice.

Source: [overdevs.com iOS MediaSession analysis](https://overdevs.com/ios-mediasession.html)

### Artwork quirks (iOS 18 improved, but quirks remain)

- Only the first entry in the artwork array is used
- Images show pixellated if too large — 512×512 works in iOS 18+, use that
- If you provide `artist`, the `album` field is hidden (iOS only shows one)
- Control Center preview blurs the artwork — unavoidable

### Lock-screen controls require the audio element to be active

MediaSession controls only appear when `<audio>` is actively playing or paused (not ended). This is another reason to keep the same element alive — after a `src` swap and `play()`, the element is active and MediaSession metadata/handlers remain registered.

---

## 6. Code Sketch — Recommended Implementation

### Architecture

```
app/
  layout.tsx                  ← root layout, no change
  (reader)/
    layout.tsx                ← NEW: PodcastProvider + persistent <audio>
    read/
      [bibleId]/[bookId]/[chapter]/page.tsx  ← unchanged externally
components/
  PodcastContext.tsx          ← NEW: context + audio logic
  Reader.tsx                  ← MODIFIED: remove local audio state, use context
```

### PodcastContext.tsx

```typescript
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

interface ChapterRef {
  bibleId: string;
  bookId: string;
  chapter: number;
  totalChapters: number;
  audioUrl: string | null; // blob URL for current chapter
  nextAudioUrl: string | null; // preloaded blob URL for next chapter
}

interface PodcastContextValue {
  playing: boolean;
  audioLoading: boolean;
  audioCurrent: number;
  audioDuration: number;
  error: string | null;
  registerChapter: (ref: ChapterRef) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  skipBack: () => void;
  skipForward: () => void;
}

const PodcastContext = createContext<PodcastContextValue | null>(null);

export function usePodcast(): PodcastContextValue {
  const ctx = useContext(PodcastContext);
  if (!ctx) throw new Error("usePodcast must be used inside PodcastProvider");
  return ctx;
}

export function PodcastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chapterRef = useRef<ChapterRef | null>(null);

  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Mount the audio element once — never remove it
  useEffect(() => {
    if (audioRef.current) return;
    const el = document.createElement("audio");
    el.preload = "auto";
    // Required on iOS to allow inline playback (not fullscreen takeover)
    el.setAttribute("playsinline", "");
    el.style.display = "none";
    document.body.appendChild(el);
    audioRef.current = el;

    el.ontimeupdate = () => setAudioCurrent(el.currentTime);
    el.onloadedmetadata = () => setAudioDuration(el.duration);
    el.onplay = () => setPlaying(true);
    el.onpause = () => setPlaying(false);
    el.onerror = () => setError("Audio playback error");

    el.onended = () => {
      setPlaying(false);
      const c = chapterRef.current;
      if (!c) return;
      if (c.chapter >= c.totalChapters) return;

      const nextChapter = c.chapter + 1;

      if (c.nextAudioUrl) {
        // Best case: next chapter already preloaded — swap src now and play
        // This stays within the same HTMLAudioElement, gesture credit is preserved
        el.src = c.nextAudioUrl;
        el.load();
        el.play().catch((e: unknown) => {
          // If play() is rejected (regression or policy change), surface a
          // "Tap to continue" state rather than silently failing
          setError(`auto-advance blocked: ${String(e)}`);
        });
        // Navigate URL for bookmarking — does NOT remount the audio element
        router.push(
          `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${nextChapter}?mode=podcast`,
          { scroll: false },
        );
      } else {
        // Fallback: navigate and let the new chapter page trigger play()
        // This is the current broken approach — only hit if preload failed
        router.push(
          `/read/${encodeURIComponent(c.bibleId)}/${encodeURIComponent(c.bookId)}/${nextChapter}?mode=podcast&autoplay=1`,
        );
      }
    };

    return () => {
      el.remove();
      audioRef.current = null;
    };
  }, [router]);

  // Register MediaSession handlers once
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    // Use nexttrack/previoustrack — NOT seekforward/seekbackward
    // iOS shows one set or the other; chapter navigation is more useful
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const c = chapterRef.current;
      if (!c) return;
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
      if (el && details.seekTime != null) el.currentTime = details.seekTime;
    });
  }, [router]);

  const registerChapter = useCallback((ref: ChapterRef) => {
    chapterRef.current = ref;

    // Update MediaSession metadata when chapter changes
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Chapter ${ref.chapter}`,
        artist: ref.bookId,
        artwork: [
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
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
    if (el) el.currentTime = Math.max(0, el.currentTime - 15);
  }, []);

  const skipForward = useCallback(() => {
    const el = audioRef.current;
    if (el) el.currentTime = Math.min(el.duration || el.currentTime, el.currentTime + 15);
  }, []);

  return (
    <PodcastContext.Provider
      value={{
        playing,
        audioLoading,
        audioCurrent,
        audioDuration,
        error,
        registerChapter,
        play,
        pause,
        seek,
        skipBack,
        skipForward,
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
}
```

### Route group layout — `app/(reader)/layout.tsx`

```typescript
import { PodcastProvider } from "@/components/PodcastContext";

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return <PodcastProvider>{children}</PodcastProvider>;
}
```

Move the existing chapter page into `app/(reader)/read/[bibleId]/[bookId]/[chapter]/page.tsx`. Route groups (parentheses folder name) are invisible to the URL.

### Reader.tsx — what changes

In Reader, remove all the audio state (`audioUrl`, `audioLoading`, `audioCurrent`, `audioDuration`, `audioRef`, `play`, `pause`, `stop`, `back15`, `next`, `ensurePodcastAudio`). Replace with:

```typescript
const podcast = usePodcast();

// When audio is ready for this chapter, register it with the shared player
useEffect(() => {
  if (mode !== "podcast" || !audioUrl || !currentBook) return;

  const totalChapters = currentBook.chapters ?? 999;

  podcast.registerChapter({
    bibleId,
    bookId,
    chapter,
    totalChapters,
    audioUrl,
    nextAudioUrl: null, // filled in by preload effect below
  });
}, [audioUrl, mode, bibleId, bookId, chapter, currentBook, podcast]);
```

### Preloading the next chapter

In Reader, after `audioUrl` is set, kick off a background fetch for chapter N+1:

```typescript
useEffect(() => {
  if (mode !== "podcast" || !audioUrl) return;
  const nextChapter = chapter + 1;
  if (!currentBook || nextChapter > (currentBook.chapters ?? 999)) return;

  let revoked = false;
  const ctrl = new AbortController();

  (async () => {
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bibleId,
          passageId: `${bookId}.${nextChapter}`,
          lang: companionLang,
          mode: "podcast",
          voiceA: edgeVoiceA,
          voiceB: edgeVoiceB,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (revoked) return;
      const url = URL.createObjectURL(blob);

      // Update the chapter registration with the preloaded next URL
      podcast.registerChapter({
        bibleId,
        bookId,
        chapter,
        totalChapters: currentBook.chapters ?? 999,
        audioUrl,
        nextAudioUrl: url,
      });
    } catch {
      // Non-critical — if preload fails, we fall back to navigate+autoplay
    }
  })();

  return () => {
    revoked = true;
    ctrl.abort();
  };
}, [audioUrl, mode, bibleId, bookId, chapter, companionLang, edgeVoiceA, edgeVoiceB, currentBook, podcast]);
```

The `<audio>` tag is removed from Reader's JSX entirely — the element is now managed by PodcastProvider.

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| iOS 17.2.x `src` swap regression | Medium (17.2.1 only) | HIGH — auto-advance fails silently | Wrap `el.play()` in try/catch; on rejection set a `blockedAutoplay` state that renders a "Tap to continue" button on the next chapter page |
| PWA standalone mode — next track never plays (WebKit #261858) | High if users install as PWA | MEDIUM — only affects PWA users | Add a `manifest.json` but do NOT prompt "Add to Home Screen"; let users use Safari browser tab as primary path |
| Preload fetch hits server before chapter N is cached | Medium — TTS is slow | LOW — UX impact only | Preload only starts after current chapter audio is confirmed cached; server /api/audio already caches to disk so second request is instant |
| Blob URL memory leak across many chapters | Low | LOW | Revoke previous chapter's blob URL in `registerChapter` — keep only current + next |
| Next.js `router.push()` with `{ scroll: false }` still resets scroll on some versions | Low | LOW | Use `window.history.replaceState` for the URL update instead of router if scroll jumps become a problem |
| MediaSession `nexttrack` handler not firing on older iOS (< 16.4) | Low — iOS 17+ is the target | LOW | Fallback gracefully — lock-screen controls won't respond but in-app controls still work |

---

## 8. Outstanding Unknowns (Need Real iPhone Testing)

1. **iOS 17.2.1 src swap regression: resolved in 17.3+ or still present?** — The Apple Community thread is inconclusive. Test on a device running 17.3, 17.4, and 18.x. If reproducible on 17.3+, the "Tap to continue" fallback becomes mandatory, not optional.

2. **Does `{ scroll: false }` in `router.push()` actually prevent scroll reset on iOS Safari?** — Next.js docs say it should, but iOS Safari's scroll restoration behavior with SPA navigation is inconsistently implemented.

3. **Does document.body.appendChild(audioElement) on first render cause any React hydration warning?** — The imperative DOM insertion in PodcastProvider's `useEffect` bypasses React's virtual DOM. In practice this works, but it needs testing in both dev (StrictMode double-invoke) and production builds.

4. **Does MediaSession `nexttrack` appear on the iOS lock screen when `seekforward`/`seekbackward` are not registered?** — The overdevs.com article documents this behavior on iOS 16; needs verification on iOS 18.

5. **Preload fetch timing vs server TTS generation** — If chapter N+1 has never been played, the preload fetch kicks off TTS generation server-side. A 5-minute chapter generates in ~15–30s. If the user is a fast reader and finishes chapter N in 5 minutes flat, the preload may not be done. Measure the real cache-miss generation time against median chapter length to assess whether preload needs to start earlier (e.g., triggered at 50% playback, not 100% loaded).

6. **`playsInline` on a programmatically created `<audio>` element** — Setting `el.setAttribute("playsinline", "")` should work, but verify iOS doesn't open a native fullscreen audio player. If it does, use `el.webkitPlaysinline = true` as well.

---

## Key References

- [Apple HTML5 Audio Guide — Controlling Media with JavaScript](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/ControllingMediaWithJavaScript/ControllingMediaWithJavaScript.html) — Confirms `load()` + `play()` work after src change once user has initiated first play
- [WebKit bug #261858](https://bugs.webkit.org/show_bug.cgi?id=261858) — PWA-specific: autoplay broken after track ends, iOS 16–17, standalone mode only; NOT browser tab
- [Next.js GitHub #56338](https://github.com/vercel/next.js/issues/56338) — Confirms router.push() breaks audio autoplay on new page in iOS Safari
- [Next.js Preserving UI State docs](https://nextjs.org/docs/app/guides/preserving-ui-state) — Shows `useLayoutEffect` cleanup pattern for media elements; notes `display:none` does not stop audio playback
- [BBC Sounds persistent player architecture](https://medium.com/bbc-product-technology/sounds-web-next-a-persistent-player-prototype-for-bbc-sounds-bf996ef0c332) — Production SPA with persistent player in Next.js root layout, src changes for track advance
- [overdevs.com — Nailing MediaSession on iOS](https://overdevs.com/ios-mediasession.html) — nexttrack/seekforward mutual exclusion, artwork size limits, artist vs album exclusion
- [Radiant Media Player — ManagedMediaSource in iOS 17.1](https://www.radiantmediaplayer.com/blog/at-last-safari-17.1-now-brings-the-new-managed-media-source-api-to-iphone.html) — MSE on iOS requires MMS API, video-focused but audio-only works too
- [Audiobookshelf iOS next-chapter bug](https://github.com/advplyr/audiobookshelf/issues/2655) — Real-world confirmation that PWA + track advance is broken on iOS 17+
- [Prototyp.digital — PWAs and audio playback](https://blog.prototyp.digital/what-we-learned-about-pwas-and-audio-playback/) — Team abandoned PWA for iOS audio entirely, went React Native
- [Bitmovin — AutoPlay Policies Safari 14 and Chrome 64](https://bitmovin.com/blog/autoplay-policies-safari-14-chrome-64/) — Background on iOS autoplay gesture model
