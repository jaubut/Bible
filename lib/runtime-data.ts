import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function getRuntimeDataDir(): string {
  const dir =
    process.env.BIBLE_DATA_DIR ||
    (existsSync("/var/data/bible") ? "/var/data/bible" : join(process.cwd(), "data"));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}
