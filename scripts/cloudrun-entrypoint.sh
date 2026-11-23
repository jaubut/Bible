#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${BIBLE_DATA_DIR:-/var/data/bible}"
mkdir -p "$DATA_DIR"

if [ -d /gcs ]; then
  mkdir -p /gcs/bible-companion/audio
  if [ ! -L "$DATA_DIR/audio" ]; then
    rm -rf "$DATA_DIR/audio"
    ln -s /gcs/bible-companion/audio "$DATA_DIR/audio"
  fi
else
  mkdir -p "$DATA_DIR/audio"
fi

for db in companion.db annotations.db; do
  DB_PATH="$DATA_DIR/$db"
  if [ ! -f "$DB_PATH" ] && [ -n "${LITESTREAM_BUCKET:-}" ]; then
    REPLICA_URL="gcs://${LITESTREAM_BUCKET}/bible-companion/replicas/${db}"
    echo "[bible-companion] Checking Litestream replica at $REPLICA_URL ..."
    litestream restore -if-replica-exists -o "$DB_PATH" "$REPLICA_URL" || true
  fi

  if [ ! -f "$DB_PATH" ] && [ -f "/gcs/bible-companion/seed/${db}" ]; then
    echo "[bible-companion] Hydrating initial $db from /gcs/bible-companion/seed/${db} ..."
    cp "/gcs/bible-companion/seed/${db}" "$DB_PATH"
    echo "[bible-companion] Seed hydration complete: $(ls -lh "$DB_PATH")"
  fi
done

if [ -n "${LITESTREAM_BUCKET:-}" ]; then
  echo "[bible-companion] Starting Litestream continuous replication + Next.js server..."
  exec litestream replicate -config /app/litestream.yml -exec "npx next start -H 0.0.0.0 -p ${PORT:-8080}"
else
  echo "[bible-companion] Starting Next.js server without Litestream..."
  exec npx next start -H 0.0.0.0 -p "${PORT:-8080}"
fi
