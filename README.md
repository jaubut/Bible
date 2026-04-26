# Bible Companion

A web app that reads Scripture aloud with a knowledgeable companion at your side, weaving in historical, cultural, and linguistic context as it goes.

- Scripture text: [api.bible](https://scripture.api.bible)
- Companion narration: Claude (Sonnet 4.6 by default) with prompt caching
- Voice: browser Web Speech API (free; can swap for ElevenLabs later)
- Cache: local SQLite so re-listening to a passage is free

## Quick start

```bash
cp .env.example .env.local
# fill in BIBLE_API_KEY and ANTHROPIC_API_KEY
bun install
bun run dev
```

Open http://localhost:3000.

## On Ethiopian translations

The "Ethiopian" filter shows any Bible on api.bible whose language is Amharic (`amh`), Ge'ez (`gez`), Tigrinya (`tir`), or Oromo (`orm`). The full Ethiopian Orthodox Tewahedo 81-book canon (with Enoch, Jubilees, Meqabyan, etc.) is generally not on api.bible — those extra books would need to be sourced separately (R.H. Charles' English Enoch is public domain; archive.org has Amharic scans).

## Companion script format

The model returns a script using three tags. The reader plays them as a sequence:

- `<read v="N">…</read>` — verse text, narrated in the reading voice
- `<aside>…</aside>` — context note, narrated slightly slower
- `<pause/>` — short silence

## Notes

- All data is local. No accounts, no telemetry.
- Density slider (light / normal / rich) controls how many asides per chapter.
- Personal project. Reading the Bible is meant to be unhurried — this app is too.
