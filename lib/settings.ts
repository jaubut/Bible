export type ThemeId = "parchment" | "codex" | "sanctuary";

export type CompanionLang = "en" | "fr";

export const COMPANION_LANGS: { id: CompanionLang; name: string }[] = [
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
];

export function isCompanionLang(v: unknown): v is CompanionLang {
  return v === "en" || v === "fr";
}

export type Mode = "reading" | "podcast" | "jesus";

export const MODES: { id: Mode; name: string; description: string }[] = [
  {
    id: "reading",
    name: "Reading",
    description: "Verses with cultural and historical asides.",
  },
  {
    id: "podcast",
    name: "Podcast",
    description: "Two hosts discuss the passage in conversation.",
  },
  {
    id: "jesus",
    name: "Jesus Bible",
    description: "Jesus reads, marks, and comments the text himself.",
  },
];

export function isMode(v: unknown): v is Mode {
  return v === "reading" || v === "podcast" || v === "jesus";
}

export const THEMES: { id: ThemeId; name: string; description: string }[] = [
  {
    id: "parchment",
    name: "Parchment",
    description: "Warm cream and sepia ink. Classical reading.",
  },
  {
    id: "codex",
    name: "Codex",
    description: "Walnut and gold. Manuscript by candlelight.",
  },
  {
    id: "sanctuary",
    name: "Sanctuary",
    description: "Bright white and slate. Modern liturgical.",
  },
];

export const STORAGE_KEYS = {
  theme: "bible-theme",
  voiceURI: "bible-voice-uri",
  voiceUserPicked: "bible-voice-user-picked",
  voiceRate: "bible-voice-rate",
  voicePitch: "bible-voice-pitch",
  voiceURI_A: "bible-voice-uri-a",
  voiceURI_B: "bible-voice-uri-b",
  voiceUserPicked_A: "bible-voice-user-picked-a",
  voiceUserPicked_B: "bible-voice-user-picked-b",
  edgeVoiceA: "bible-edge-voice-a",
  edgeVoiceB: "bible-edge-voice-b",
  companionLang: "bible-companion-lang",
  mode: "bible-mode",
  autoplay: "bible-autoplay",
  tokenDensity: "bible-token-density",
  iosTipDismissed: "bible-ios-tip-dismissed",
  commentaryCollapsed: "bible-commentary-collapsed",
} as const;

export type TokenDensity = "minimal" | "moderate" | "dense" | "study";

export const TOKEN_DENSITIES: { id: TokenDensity; name: string; description: string }[] = [
  { id: "minimal", name: "Minimal", description: "Divine names only." },
  { id: "moderate", name: "Moderate", description: "People, places, deity, loanwords." },
  { id: "dense", name: "Dense", description: "Everything — titles, numbers, artifacts, echoes." },
  { id: "study", name: "Study", description: "Dense + cross-references, Strong's, echo previews." },
];

export function isTokenDensity(v: unknown): v is TokenDensity {
  return v === "minimal" || v === "moderate" || v === "dense" || v === "study";
}

export function isThemeId(v: unknown): v is ThemeId {
  return v === "parchment" || v === "codex" || v === "sanctuary";
}
