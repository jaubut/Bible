# Deploy to Railway — Instructions for Claude Code

You are Claude Code running in a terminal on the user's Mac. Your task: deploy this repo to Railway.

## Prerequisites the user must provide

Before starting, ask the user for:

1. **Their rotated `BIBLE_API_KEY`** (from https://scripture.api.bible — the one previously shared in chat must be rotated)
2. **Their `ANTHROPIC_API_KEY`** (from https://console.anthropic.com)
3. **Confirmation they've revoked the previous Railway token** (`45b295f6-…`) at https://railway.app/account/tokens

Do NOT proceed until you have items 1 and 2. Item 3 is a security check — remind them, but don't block on it.

## Steps

### 1. Verify branch

The deployable branch is `claude/sync-claude-config-3FpLi`. Confirm you're on it:

```bash
git status
git branch --show-current
```

If on a different branch:

```bash
git fetch origin
git checkout claude/sync-claude-config-3FpLi
git pull
```

### 2. Install tooling if missing

```bash
command -v bun     >/dev/null || curl -fsSL https://bun.sh/install | bash
command -v railway >/dev/null || brew install railway
```

### 3. Login and create the project

```bash
railway login            # opens a browser tab
railway init             # interactive: name it "bible-companion"
```

Pick "Empty project" if asked. The `init` command links this directory to a new Railway project and writes `.railway/` (gitignored — verify it is, add it if not).

### 4. Set environment variables

Replace the placeholders with the keys the user gave you. Run as **one** command so all three are set in a single API call:

```bash
railway variables \
  --set "BIBLE_API_KEY=<paste_user_value>" \
  --set "ANTHROPIC_API_KEY=<paste_user_value>" \
  --set "COMPANION_MODEL=claude-sonnet-4-6"
```

### 5. Deploy

```bash
railway up
```

This uploads the repo, runs Nixpacks (which detects `bun.lock` → `bun install` → `bun run build`), and starts the container with `bun run start`. Watch the build logs; it usually takes 60–120s.

If the build fails on `better-sqlite3` (native compilation error), that's the known fallback case — see "Troubleshooting" below.

### 6. Generate a public domain

```bash
railway domain
```

Print the resulting URL to the user.

### 7. Add a Volume for the SQLite cache (optional but recommended)

The CLI doesn't fully support volume creation in all versions — easiest path:

> Tell the user: "Open the project on https://railway.com/dashboard → Settings → Volumes → New volume → mount path `/app/data` → attach to the service. Then redeploy with `railway redeploy`."

Without the volume, the cache works between requests but resets on each redeploy. Acceptable for a personal app.

### 8. Smoke test

```bash
URL=$(railway domain | tail -1)
curl -fsS "$URL/api/bibles?ethiopian=1" | head -c 500
```

Expect a JSON response listing Ethiopian-language Bibles available on the user's api.bible account. If it's empty `{"bibles":[]}`, that's still a successful deploy — it just means the user's account has no Amharic/Ge'ez/Tigrinya/Oromo Bibles enabled.

## Troubleshooting

### `better-sqlite3` fails to build on Railway

Symptom: build log shows `node-gyp` errors, missing Python, or "cannot find module 'better-sqlite3'" at runtime.

Fix: swap to Bun's built-in SQLite (no native compilation). Apply this patch and push:

1. In `lib/cache.ts`, replace the `better-sqlite3` import with `bun:sqlite`:

   ```ts
   import { Database } from "bun:sqlite";
   ```

   The rest of the API (`prepare`, `run`, `get`, `exec`, `pragma`) is compatible.

2. In `package.json`, remove `better-sqlite3` and `@types/better-sqlite3` from dependencies.

3. In `next.config.ts`, remove `"better-sqlite3"` from `serverExternalPackages`.

4. Update the start script so the server runs under Bun (required for `bun:sqlite`):

   ```json
   "start": "bun --bun next start -H 0.0.0.0"
   ```

5. `bun install`, commit, push. Railway auto-redeploys.

### Build OK but server returns 500 on `/api/companion`

Most likely `ANTHROPIC_API_KEY` is missing or wrong. Check:

```bash
railway variables
```

### Domain returns 502 / app not responding

Container probably failed to bind to `$PORT`. Verify `package.json` has `"start": "next start -H 0.0.0.0"` (already set on this branch). Next.js reads `PORT` from env automatically.

## What NOT to do

- Do not commit any API key, ever. They go in Railway env vars only.
- Do not push to `main` — stay on `claude/sync-claude-config-3FpLi`.
- Do not delete the Volume after creating it (would wipe the cache).

## When done

Report to the user:

- The public URL (`https://<project>.up.railway.app`)
- Whether the smoke test passed
- Whether they still need to add the Volume manually
- A reminder to rotate the original api.bible key and Railway token if they haven't
