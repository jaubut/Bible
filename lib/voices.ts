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
  "Aaron",
  "Nicky",
  "Évelyne",
  "Evelyne",
  "Thomas",
  "Amélie",
  "Amelie",
  "Audrey",
];

export function rankVoice(v: SpeechSynthesisVoice, langPref?: string): RankedVoice {
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

  if (name.includes("espeak") || name.includes("compact")) score -= 50;
  if (v.localService) score += 5;
  if (hasPremium) score += 5;

  // Language preference: a strong bonus for matching the companion language,
  // smaller bonus for matching English as a sensible fallback.
  if (langPref) {
    const lp = langPref.toLowerCase();
    if (v.lang.toLowerCase().startsWith(lp)) score += 50;
    else if (lp !== "en" && v.lang.toLowerCase().startsWith("en")) score += 5;
  } else if (v.lang.startsWith("en")) {
    score += 10;
  }

  return { voice: v, quality, score };
}

export function listVoices(langPref?: string): RankedVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.map((v) => rankVoice(v, langPref)).sort((a, b) => b.score - a.score);
}

export function pickBest(langPref?: string): SpeechSynthesisVoice | null {
  const ranked = listVoices(langPref);
  return ranked[0]?.voice ?? null;
}

// Heuristic gender by Apple/Google/Microsoft voice name. Used to pick
// complementary voices for the two-host podcast mode.
const FEMALE_NAMES = new Set([
  "Samantha",
  "Karen",
  "Moira",
  "Tessa",
  "Serena",
  "Allison",
  "Ava",
  "Susan",
  "Nicky",
  "Évelyne",
  "Evelyne",
  "Amélie",
  "Amelie",
  "Audrey",
  "Aria",
  "Sylvie",
  "Chloe",
  "Joanna",
  "Salli",
  "Zira",
]);
const MALE_NAMES = new Set([
  "Daniel",
  "Tom",
  "Alex",
  "Aaron",
  "Thomas",
  "Fred",
  "Jorge",
  "Diego",
  "Guy",
  "Henri",
  "David",
  "Mark",
]);

function inferGender(v: SpeechSynthesisVoice): "f" | "m" | "unknown" {
  const first = v.name.split(/\s+|\(|—|–|-/)[0];
  if (FEMALE_NAMES.has(first)) return "f";
  if (MALE_NAMES.has(first)) return "m";
  const lower = v.name.toLowerCase();
  if (lower.includes("female")) return "f";
  if (lower.includes("male")) return "m";
  return "unknown";
}

// Pick two distinct voices for the two-host mode. Prefers one female + one
// male in the requested language, both as high-quality as possible.
export function pickPair(
  langPref?: string,
): { a: SpeechSynthesisVoice | null; b: SpeechSynthesisVoice | null } {
  const ranked = listVoices(langPref);
  if (ranked.length === 0) return { a: null, b: null };

  const female = ranked.find((rv) => inferGender(rv.voice) === "f");
  const male = ranked.find((rv) => inferGender(rv.voice) === "m");

  if (female && male) {
    return { a: female.voice, b: male.voice };
  }
  // Fallback: top two distinct voices
  const a = ranked[0]?.voice ?? null;
  const b = ranked.find((rv) => rv.voice.voiceURI !== a?.voiceURI)?.voice ?? null;
  return { a, b };
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

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS reports as Mac; the touch-points check disambiguates
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return ua.includes("Mac") && "ontouchend" in document;
}

export function isAppleDesktop(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return ua.includes("Mac") && !("ontouchend" in document);
}
