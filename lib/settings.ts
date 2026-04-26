export type ThemeId = "parchment" | "codex" | "sanctuary";

export type CompanionLang = "en" | "fr";

export const COMPANION_LANGS: { id: CompanionLang; name: string }[] = [
  { id: "en", name: "English" },
  { id: "fr", name: "Français" },
];

export function isCompanionLang(v: unknown): v is CompanionLang {
  return v === "en" || v === "fr";
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
  companionLang: "bible-companion-lang",
  iosTipDismissed: "bible-ios-tip-dismissed",
} as const;

export function isThemeId(v: unknown): v is ThemeId {
  return v === "parchment" || v === "codex" || v === "sanctuary";
}
