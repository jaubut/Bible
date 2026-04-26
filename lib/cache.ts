import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let _db: Database.Database | null = null;

function db() {
  if (_db) return _db;
  const dir = join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  _db = new Database(join(dir, "companion.db"));
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS commentary (
      cache_key TEXT PRIMARY KEY,
      bible_id  TEXT NOT NULL,
      passage_id TEXT NOT NULL,
      density   TEXT NOT NULL,
      script    TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return _db;
}

export function getCommentary(key: string): string | null {
  const row = db().prepare("SELECT script FROM commentary WHERE cache_key = ?").get(key) as
    | { script: string }
    | undefined;
  return row?.script ?? null;
}

export function putCommentary(args: {
  key: string;
  bibleId: string;
  passageId: string;
  density: string;
  script: string;
}) {
  db()
    .prepare(
      `INSERT OR REPLACE INTO commentary
       (cache_key, bible_id, passage_id, density, script, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(args.key, args.bibleId, args.passageId, args.density, args.script, Date.now());
}

export function commentaryKey(bibleId: string, passageId: string, density: string) {
  return `${bibleId}::${passageId}::${density}`;
}
