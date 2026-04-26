import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

function audioDir(): string {
  // /app/data is mounted as a Railway volume in production.
  // Fallback to ./data in local dev.
  const root = existsSync("/app/data") ? "/app/data" : join(process.cwd(), "data");
  const dir = join(root, "audio");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function audioKey(parts: {
  bibleId: string;
  passageId: string;
  lang: string;
  mode: string;
  voiceA: string;
  voiceB: string;
}): string {
  const raw = `${parts.bibleId}|${parts.passageId}|${parts.lang}|${parts.mode}|${parts.voiceA}|${parts.voiceB}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function audioPath(key: string): string {
  return join(audioDir(), `${key}.mp3`);
}

export function getAudio(key: string): Buffer | null {
  const path = audioPath(key);
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
}

export function putAudio(key: string, mp3: Buffer): void {
  writeFileSync(audioPath(key), mp3);
}

export function audioStats(key: string): { exists: boolean; size: number } {
  const path = audioPath(key);
  if (!existsSync(path)) return { exists: false, size: 0 };
  try {
    return { exists: true, size: statSync(path).size };
  } catch {
    return { exists: false, size: 0 };
  }
}
