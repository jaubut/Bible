import { TextToSpeechClient } from "@google-cloud/text-to-speech";

let _client: TextToSpeechClient | null = null;

function client(): TextToSpeechClient {
  if (_client) return _client;
  const b64 = process.env.GOOGLE_CREDS_BASE64;
  if (!b64) throw new Error("GOOGLE_CREDS_BASE64 not set");
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json) as {
    client_email: string;
    private_key: string;
    project_id: string;
  };
  _client = new TextToSpeechClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    projectId: creds.project_id,
  });
  return _client;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type DialogueTurn = {
  voice: string; // Google voice short name, e.g. "en-US-Wavenet-F"
  text: string;
  pauseAfterMs?: number;
};

// Each Google synthesize call uses a single voice. For multi-voice dialogue,
// we synthesize each turn separately and concatenate the MP3 frames.
// Browsers play concatenated MP3s seamlessly via <audio>.
export async function synthesizeDialogue(
  turns: DialogueTurn[],
  lang: "en" | "fr",
): Promise<Buffer> {
  const c = client();
  const langCode = inferLangCode(lang, turns[0]?.voice);
  const parts: Buffer[] = [];

  // Synthesize each turn. Run sequentially to keep memory bounded
  // and to play nice with quotas. ~200-400ms per turn.
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const pause = t.pauseAfterMs ?? (i < turns.length - 1 ? 350 : 0);
    const ssml = `<speak><prosody rate="-2%">${escapeXml(t.text)}</prosody>${
      pause > 0 ? `<break time="${pause}ms"/>` : ""
    }</speak>`;
    const [resp] = await c.synthesizeSpeech({
      input: { ssml },
      voice: { name: t.voice, languageCode: langForVoice(t.voice) ?? langCode },
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 24000,
      },
    });
    if (!resp.audioContent) {
      throw new Error(`No audio for turn ${i}`);
    }
    const buf =
      resp.audioContent instanceof Uint8Array
        ? Buffer.from(resp.audioContent)
        : Buffer.from(resp.audioContent as string, "base64");
    parts.push(buf);
  }

  return Buffer.concat(parts);
}

export async function synthesizeOne(
  text: string,
  voice: string,
  lang: "en" | "fr",
): Promise<Buffer> {
  const c = client();
  const ssml = `<speak><prosody rate="-2%">${escapeXml(text)}</prosody></speak>`;
  const [resp] = await c.synthesizeSpeech({
    input: { ssml },
    voice: { name: voice, languageCode: langForVoice(voice) ?? inferLangCode(lang, voice) },
    audioConfig: {
      audioEncoding: "MP3",
      sampleRateHertz: 24000,
    },
  });
  if (!resp.audioContent) throw new Error("No audio");
  return resp.audioContent instanceof Uint8Array
    ? Buffer.from(resp.audioContent)
    : Buffer.from(resp.audioContent as string, "base64");
}

function inferLangCode(lang: "en" | "fr", voiceHint?: string): string {
  if (voiceHint) {
    const m = voiceHint.match(/^([a-z]{2}-[A-Z]{2})/);
    if (m) return m[1];
  }
  return lang === "fr" ? "fr-CA" : "en-US";
}

function langForVoice(voice: string): string | undefined {
  const m = voice.match(/^([a-z]{2}-[A-Z]{2})/);
  return m ? m[1] : undefined;
}
