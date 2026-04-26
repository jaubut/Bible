export type ThemeId = "parchment" | "codex" | "sanctuary";

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
  voiceRate: "bible-voice-rate",
  voicePitch: "bible-voice-pitch",
} as const;

export function isThemeId(v: unknown): v is ThemeId {
  return v === "parchment" || v === "codex" || v === "sanctuary";
}
