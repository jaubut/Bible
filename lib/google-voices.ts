// Curated subset of Google Cloud TTS voices.
// Bias toward Chirp3-HD and WaveNet voices — both sound podcast-grade.
// Free tier: 4M chars/month for Standard, 1M chars/month for WaveNet/Chirp3-HD,
// then $4/M (WaveNet) or $30/M (Chirp3-HD) — generous for personal use.

export type CloudVoice = {
  id: string;            // Google voice short name, e.g. "en-US-Wavenet-F"
  name: string;          // Display name
  gender: "f" | "m";
  lang: "en" | "fr";
  region: string;        // "US", "CA", "GB", "FR"
  vibe: string;
  default?: "A" | "B";
  tier: "wavenet" | "chirp3hd" | "standard";
};

export const CLOUD_VOICES: CloudVoice[] = [
  // English — WaveNet (free up to 1M chars/month, sounds excellent)
  {
    id: "en-US-Wavenet-F",
    name: "Anna",
    gender: "f",
    lang: "en",
    region: "US",
    vibe: "Warm, conversational, public-radio host",
    default: "A",
    tier: "wavenet",
  },
  {
    id: "en-US-Wavenet-D",
    name: "Marcus",
    gender: "m",
    lang: "en",
    region: "US",
    vibe: "Calm, scholarly, measured",
    default: "B",
    tier: "wavenet",
  },
  {
    id: "en-US-Wavenet-H",
    name: "Eve",
    gender: "f",
    lang: "en",
    region: "US",
    vibe: "Bright, narrative, audiobook-style",
    tier: "wavenet",
  },
  {
    id: "en-US-Wavenet-J",
    name: "Owen",
    gender: "m",
    lang: "en",
    region: "US",
    vibe: "Deep, steady, NPR-anchor",
    tier: "wavenet",
  },
  {
    id: "en-US-Wavenet-C",
    name: "Iris",
    gender: "f",
    lang: "en",
    region: "US",
    vibe: "Curious, expressive",
    tier: "wavenet",
  },
  {
    id: "en-US-Wavenet-B",
    name: "Theo",
    gender: "m",
    lang: "en",
    region: "US",
    vibe: "Friendly, grounded",
    tier: "wavenet",
  },
  {
    id: "en-GB-Wavenet-F",
    name: "Maeve",
    gender: "f",
    lang: "en",
    region: "GB",
    vibe: "British, BBC-style",
    tier: "wavenet",
  },
  {
    id: "en-GB-Wavenet-D",
    name: "Hugo",
    gender: "m",
    lang: "en",
    region: "GB",
    vibe: "British, dignified",
    tier: "wavenet",
  },

  // French — Canadian first
  {
    id: "fr-CA-Wavenet-A",
    name: "Camille",
    gender: "f",
    lang: "fr",
    region: "CA",
    vibe: "Québec, claire, présente",
    default: "A",
    tier: "wavenet",
  },
  {
    id: "fr-CA-Wavenet-D",
    name: "Olivier",
    gender: "m",
    lang: "fr",
    region: "CA",
    vibe: "Québec, posé, narratif",
    default: "B",
    tier: "wavenet",
  },
  {
    id: "fr-CA-Wavenet-B",
    name: "Léa",
    gender: "f",
    lang: "fr",
    region: "CA",
    vibe: "Québec, chaleureuse",
    tier: "wavenet",
  },
  {
    id: "fr-CA-Wavenet-C",
    name: "Antoine",
    gender: "m",
    lang: "fr",
    region: "CA",
    vibe: "Québec, jeune, dynamique",
    tier: "wavenet",
  },
  {
    id: "fr-FR-Wavenet-A",
    name: "Élise",
    gender: "f",
    lang: "fr",
    region: "FR",
    vibe: "France, journalistique",
    tier: "wavenet",
  },
  {
    id: "fr-FR-Wavenet-D",
    name: "Henri",
    gender: "m",
    lang: "fr",
    region: "FR",
    vibe: "France, classique",
    tier: "wavenet",
  },
];

export function voicesForLang(lang: "en" | "fr"): CloudVoice[] {
  return CLOUD_VOICES.filter((v) => v.lang === lang);
}

export function voiceById(id: string): CloudVoice | undefined {
  return CLOUD_VOICES.find((v) => v.id === id);
}

export function defaultPair(lang: "en" | "fr"): { a: string; b: string } {
  const list = voicesForLang(lang);
  const a = list.find((v) => v.default === "A") ?? list.find((v) => v.gender === "f") ?? list[0];
  const b = list.find((v) => v.default === "B") ?? list.find((v) => v.gender === "m") ?? list[1] ?? list[0];
  return { a: a.id, b: b.id };
}

// Backward-compat alias for components that import EdgeVoice.
export type EdgeVoice = CloudVoice;
