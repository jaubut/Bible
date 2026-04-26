// Voice ranking. The browser's default voice is almost always the worst —
// we want to surface high-quality system voices first (Apple Premium/Enhanced,
// Google neural, Microsoft Natural).

export type RankedVoice = {
  voice: SpeechSynthesisVoice;
  quality: "premium" | "enhanced" | "neural" | "standard";
  score: number;
};

const PREMIUM_HINTS = [
  "premium",
  "enhanced",
  "neural",
  "natural",
  "siri", // iOS Siri voices are very good
];

// Apple voices that are high quality on macOS even without "Enhanced" suffix
const GOOD_APPLE = [
  "Samantha",
  "Daniel",
  "Karen",
  "Moira",
  "Tessa",
  "Serena",
  "Allison",
  "Ava",
  "Susan",
  "Tom",
  "Alex",
];

export function rankVoice(v: SpeechSynthesisVoice): RankedVoice {
  const name = v.name.toLowerCase();
  const hasPremium = PREMIUM_HINTS.some((h) => name.includes(h));
  const isGoodApple = GOOD_APPLE.some((g) => v.name.startsWith(g));
  const isGoogleNeural = name.includes("google") && !name.includes("default");
  const isMicrosoftNatural = name.includes("microsoft") && name.includes("natural");

  let quality: RankedVoice["quality"] = "standard";
  let score = 0;

  if (name.includes("premium")) {
    quality = "premium";
    score = 100;
  } else if (name.includes("enhanced") || name.includes("siri")) {
    quality = "enhanced";
    score = 90;
  } else if (isMicrosoftNatural || name.includes("neural")) {
    quality = "neural";
    score = 85;
  } else if (isGoogleNeural) {
    quality = "neural";
    score = 70;
  } else if (isGoodApple) {
    quality = "standard";
    score = 60;
  } else {
    score = 30;
  }

  // Avoid the truly bad ones (espeak, eSpeak, Compact)
  if (name.includes("espeak") || name.includes("compact")) score -= 50;

  // Prefer local voices over remote
  if (v.localService) score += 5;

  // Prefer English by default if user is on en-* — surface near top
  if (v.lang.startsWith("en")) score += 10;

  // Voices that explicitly mention "premium" tags
  if (hasPremium) score += 5;

  return { voice: v, quality, score };
}

export function listVoices(): RankedVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.map(rankVoice).sort((a, b) => b.score - a.score);
}

// Voice list arrives async on Chrome — call this with a callback when ready.
export function onVoicesReady(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  if (window.speechSynthesis.getVoices().length > 0) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.speechSynthesis.addEventListener("voiceschanged", handler);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}
