// SQLite cache for chapter annotation manifests, stored on the Railway
// volume at /app/data (or ./data locally). Schema is independent from the
// existing companion text cache so we can iterate on the manifest format.

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let _db: Database.Database | null = null;

function db() {
  if (_db) return _db;
  const root = existsSync("/app/data") ? "/app/data" : join(process.cwd(), "data");
  mkdirSync(root, { recursive: true });
  _db = new Database(join(root, "annotations.db"));
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_manifest (
      cache_key TEXT PRIMARY KEY,
      bible_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      chapter TEXT NOT NULL,
      manifest TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return _db;
}

export function manifestKey(bibleId: string, bookId: string, chapter: string): string {
  return `${bibleId}::${bookId}::${chapter}`;
}

export function getManifest(key: string): string | null {
  const row = db()
    .prepare("SELECT manifest FROM chapter_manifest WHERE cache_key = ?")
    .get(key) as { manifest: string } | undefined;
  return row?.manifest ?? null;
}

export function putManifest(args: {
  key: string;
  bibleId: string;
  bookId: string;
  chapter: string;
  manifest: string;
}): void {
  db()
    .prepare(
      `INSERT OR REPLACE INTO chapter_manifest
       (cache_key, bible_id, book_id, chapter, manifest, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(args.key, args.bibleId, args.bookId, args.chapter, args.manifest, Date.now());
}
