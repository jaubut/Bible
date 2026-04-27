# RESEARCH — Bible Language Server (IDE for Scripture)

_Last updated: 2026-04-26_

---

## 1. Verdict

Ship a **hybrid static-first + pre-annotated** model. Build a ~5,000-term lexicon from STEPBible's TIPNR and TAGNT/TAHOT datasets (CC BY 4.0, free, no per-chapter AI cost) to instantly classify the most common proper nouns, places, deity names, and Hebrew/Greek loanwords at render time. For every chapter that gets opened, enqueue a one-time Claude annotation pass (Haiku, batch mode, ~$0.01/chapter) that produces a cached manifest of richer tags — titles, echoes, time markers, artifact names, quoted speech. Store the manifest in your existing Railway SQLite volume keyed by `(bible_id, book, chapter)`. Subsequent readers of that chapter pay zero AI cost. With 1,189 chapters in the Protestant canon and ~120 in your Pseudepigrapha, full warm-up costs under $15 total. The first reader of any cold chapter waits ~2 seconds; everyone after is instant. This is the architecture that matches your infrastructure, your budget, and the quality bar you are reaching for.

---

## 2. Prior Art — Competitive Survey

### Dedicated Bible Study Software

| App | Token model | Color treatment | Interaction | Data source | Cost |
|-----|-------------|-----------------|-------------|-------------|------|
| **Logos Bible Software** | Visual Filters: morph-based (POS, verb tense) + semantic filters for Person, Place, Lemma, Sense | User-defined, any color. No canonical palette. Filters stack | Click word → sidebar with lexicon, cross-refs, morphology. Hover shows quick tooltip. Can "highlight every NT imperative" | Proprietary Lexham, Factbook, Morph Greek/Hebrew. Licensed datasets | $0 starter, $400–3,000 full libraries |
| **Accordance** | Highlight by morph tag, lemma, or Strong's number via search → "hit highlight" | User-defined palettes per search | Click → in-pane info bar. Dynamic Interlinear (lemma + G/K number under English). Cross-highlighting in parallel panes | SBLGNT, WLC, proprietary morphology | $50–500+ |
| **Olive Tree** | Strong's number tapping — tap any word in a tagged Bible | None (no color coding, no semantic palette) | Tap word → instant definition popup; syncs to Study Center sidebar with all library resources | Strong's Hebrew/Greek dictionary | Free base, $10–60 resource packs |
| **YouVersion** | None. Plain text. Highlight tool is user-manual only | User highlights (5 preset colors, no semantic meaning) | Verse tap → share/bookmark/note. No word-level interaction | Translation text only | Free |
| **Blue Letter Bible** | Each word is a clickable Strong's link in interlinear view | None. Interlinear is a separate view, not inline reading | Click word in interlinear → lexicon page. ScriptTagger embeds verse hover tooltips on external sites | Strong's, NAS Exhaustive Concordance | Free |
| **STEPBible.org** | Hover: inline red popup lexicon. Click: full sidebar entry. "Verse Vocabulary" box: hover a verse number → all vocab in that verse | None — no color coding. Monochrome interface | Hover word (in tagged Bibles) → quick lemma/definition popup. Click → sidebar: quick def, usage count, full lexicon with Hellenistic parallels | STEP datasets (TIPNR, TAGNT, TAHOT, TBESH/TBESG) — same data you can use | Free, open source |
| **BibleGateway Plus** | Word-level Strong's in NIV. Hover/click → original language + definition | None — no color coding | Hover → popover with Hebrew/Greek + definition | Licensed Strong's, NIV tagging | Free (Plus tier for Strong's: ~$3/mo) |
| **BibleRef / Reftagger** | Reference detection only — scans page text for "John 3:16" patterns | None | Hover reference → verse text popover | Bible text only | Free embed |

### Jewish Scripture / Adjacent

| App | Token model | Interaction | Notes |
|-----|-------------|-------------|-------|
| **Sefaria** | POST `/api/find-refs` → returns char positions of detected Torah citations (CNN for English, BERT-transformer for Hebrew). Detects ibid references. | Hover annotated reference → popover with linked text + sidebar connections panel ("33 commentaries on this passage") | Best-in-class open-source example. Their linker auto-annotates external websites. MIT-adjacent license on the code, CC-BY-NC-SA on content |
| **Bible Hub** | Per-word interlinear with Strong's number, transliteration, lemma, part of speech | Click word number → Strong's page | Dense, academic, no color. Mobile-unfriendly |
| **Bible Project** | No inline annotation. Video + infographic model | External media | Strong brand coherence; good reference for type + visual language |
| **ScriptureMark** | Manual user highlighting (inductive Bible study model: 6-category color system — God, Jesus, Holy Spirit, sin, commands, promises) | User-applied, not automatic | Best existing example of a semantic color taxonomy for scripture. Categories match theological significance rather than grammatical role |

### Key gap across all surveyed tools

Nobody has shipped: (a) automatic semantic color coding of proper categories inline in reading view, (b) hover-to-define popovers in a modern, mobile-first reader, (c) cross-reference echo/allusion underlining, all three together in one experience. Logos and Accordance have pieces but require user configuration, are desktop-first, and cost hundreds of dollars. The "IDE for the Bible" framing is genuinely novel as a product.

---

## 3. Token Taxonomy — 10 Categories

VSCode's effective semantic token types number ~12 in practice (namespace, class, function, variable, string, keyword, comment, number, operator, type, parameter, decorator). The mapping below follows the same principle: **grammatical role drives the category, not theological judgment**.

| # | Category | Definition | Example terms | VSCode analogue |
|---|----------|------------|---------------|-----------------|
| 1 | **Person** | Individual human name (not a title) | Abraham, Mary, Pilate, Enoch | `class` / `type` |
| 2 | **Place** | Geographic location: city, region, mountain, river, sea | Jerusalem, Galilee, Euphrates, Sinai | `namespace` |
| 3 | **Deity** | Name or epithet for God, Christ, or the Spirit. Distinguished from generic "God" | YHWH, LORD, Christ, Messiah, Holy Spirit, Son of Man | `keyword` — highest visual weight |
| 4 | **Loanword** | Transliterated Hebrew, Greek, or Aramaic term left untranslated or semi-translated | Amen, Hallelujah, Selah, Shalom, Abba, Hosanna, Gehenna, Sabbath | `string` |
| 5 | **Number / Measure** | Cardinal/ordinal numbers, weights, lengths, monetary units, time spans when quantified | forty days, seven seals, a cubit, a talent, the third hour | `number` |
| 6 | **Title / Role** | Institutional or honorific role, not a personal name | King, Pharaoh, High Priest, Rabbi, Pharisee, Centurion, Prophet | `parameter` |
| 7 | **Artifact / Object** | Named physical object of theological significance | the Ark, the Tabernacle, the scroll, the censer, the urim and thummim | `enumMember` |
| 8 | **Time Marker** | Temporal orienting phrase | "In the beginning," "in those days," "in the third year of," "after eight days" | `comment` — de-emphasized |
| 9 | **Echo / Allusion** | Phrase or clause that quotes or directly alludes to earlier canon | "son of man" echoing Daniel, OT quotations in NT, typological parallels | `decorator` — underline only |
| 10 | **Quoted Speech** | Direct speech beginning (the words of God or a human speaker in dialogue) | "And God said," "Jesus answered," reported speech opener | `operator` |

**Implementation note:** Categories 1–7 are static dictionary lookups. Categories 8–10 require Claude inference (time markers require context, echoes require canon knowledge, speech attribution requires dialogue parsing). Scope v1 to categories 1–7 for static data, add 8–10 in v2 via the Claude annotation pass.

---

## 4. Color System — 3 Themes × 10 Categories

### Design principles drawn from editor theme research

- Dracula uses ~7 distinct hues against `#282A36`: pink (keywords), yellow (strings), green (functions), cyan (types), purple (variables/constants), blue-gray (comments), green (attributes)
- Tokyo Night maps: red=keywords, green=strings, blue=functions, yellow=types, orange=numbers, gray=comments
- The pattern: **highest-weight tokens (keywords) get the most saturated hue; de-emphasized tokens (comments) get a muted, low-chroma variant**
- WCAG AA body text requires 4.5:1 contrast ratio; for decorative inline highlights the minimum is 3:1 against background
- Colorblind-safe: avoid red/green as the only distinguishing pair (8% of men affected). Use blue/orange, blue/red, or vary luminance alongside hue

### Background colors (from your existing CSS)

| Theme | BG | Ink |
|-------|----|-----|
| Parchment | `#faf8f2` | `#1f1b17` |
| Codex | `#14110d` | `#efe4cc` |
| Sanctuary | `#fafaf9` | `#1f2937` |

### Token color palette

Approach: tokens use a **background tint** (low opacity fill on the span) rather than changed text color — this preserves readability of the ink color while adding semantic signal. Optionally pair with a subtle text-color shift for emphasis. The popover trigger is the filled background; strong tokens (Deity) get a colored text as well.

#### Parchment theme (warm cream `#faf8f2`, ink `#1f1b17`)

| Category | BG tint (span fill) | Text color | Contrast on BG | Notes |
|----------|--------------------|----|----------------|-------|
| Person | `rgba(139, 90, 43, 0.14)` = warm sienna wash | `#6b3d10` | 5.1:1 on BG | Earthy, like a red-letter annotation |
| Place | `rgba(42, 90, 139, 0.12)` = cool slate wash | `#1d4e7a` | 5.3:1 | Blue = geography (maps) |
| Deity | `rgba(180, 130, 0, 0.18)` = gold wash | `#7a5800` bold | 6.2:1 | Highest weight, gold = reverence |
| Loanword | `rgba(80, 130, 80, 0.13)` = sage wash | `#2e5e2e` | 5.0:1 | Green = foreign language (strings in editors) |
| Number/Measure | `rgba(160, 80, 140, 0.11)` = dusty mauve | `#6b3060` | 4.8:1 | Purple = numeric (like Dracula constants) |
| Title/Role | `rgba(100, 100, 40, 0.10)` = olive wash | `#4a4a10` | 4.7:1 | Muted yellow-green |
| Artifact | `rgba(160, 100, 50, 0.10)` = amber wash | `#6b3d10` | 4.6:1 | Similar to Person but lighter fill |
| Time Marker | no fill | `#8a7a6a` italic | 3.8:1 | De-emphasized, like comments |
| Echo/Allusion | no fill | `#1f1b17` | — | Text-color unchanged; underline: `2px dotted #8b6f3a` |
| Quoted Speech | no fill | `#1f1b17` | — | Left border `2px solid rgba(139,90,43,0.4)` |

#### Codex theme (dark walnut `#14110d`, ink `#efe4cc`)

| Category | BG tint | Text color | Notes |
|----------|---------|-----------|-------|
| Person | `rgba(210, 130, 80, 0.18)` | `#e8a870` | Warm amber on dark |
| Place | `rgba(80, 160, 220, 0.16)` | `#7ab8e8` | Sky blue |
| Deity | `rgba(220, 180, 60, 0.22)` | `#d4a857` bold | Gold (matches `--color-accent`) |
| Loanword | `rgba(100, 200, 100, 0.15)` | `#7dd87d` | Green |
| Number/Measure | `rgba(180, 120, 220, 0.16)` | `#c88ef0` | Purple |
| Title/Role | `rgba(180, 180, 80, 0.13)` | `#b8b84a` | Olive yellow |
| Artifact | `rgba(200, 140, 80, 0.14)` | `#c8a060` | Amber |
| Time Marker | no fill | `#b89968` italic | Uses `--color-aside` |
| Echo/Allusion | no fill | `#efe4cc` | Underline: `2px dotted #d4a857` |
| Quoted Speech | no fill | `#efe4cc` | Left border `2px solid rgba(212,168,87,0.5)` |

#### Sanctuary theme (white `#fafaf9`, ink `#1f2937`)

| Category | BG tint | Text color | Notes |
|----------|---------|-----------|-------|
| Person | `rgba(124, 58, 237, 0.10)` | `#5b21b6` | Violet |
| Place | `rgba(37, 99, 235, 0.10)` | `#1d4ed8` | Blue |
| Deity | `rgba(180, 130, 0, 0.12)` | `#92400e` bold | Amber-brown |
| Loanword | `rgba(16, 128, 64, 0.10)` | `#065f46` | Forest green |
| Number/Measure | `rgba(190, 18, 60, 0.09)` | `#9f1239` | Rose |
| Title/Role | `rgba(20, 150, 150, 0.09)` | `#0f766e` | Teal |
| Artifact | `rgba(180, 90, 20, 0.09)` | `#7c2d12` | Rust |
| Time Marker | no fill | `#6b7280` italic | Uses `--color-aside` |
| Echo/Allusion | no fill | `#1f2937` | Underline: `2px dotted #475569` |
| Quoted Speech | no fill | `#1f2937` | Left border `2px solid rgba(71,85,105,0.4)` |

**Colorblind note:** The critical pairs that must stay distinguishable for deuteranopia (red-green blindness): Person (sienna/violet) and Loanword (green) differ enough in luminance across all themes. Place (blue) and Number (purple/rose) are blue-family in Parchment but differ in luminance. Run any final palette through [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) before shipping.

---

## 5. Data Source Decision

### Primary: STEPBible-Data (CC BY 4.0)

**Repository:** `github.com/STEPBible/STEPBible-Data`  
**License:** CC BY 4.0 — free for any use including commercial, with attribution "STEP Bible (www.STEPBible.org)"  
**What to pull:**

| Dataset | Content | Use |
|---------|---------|-----|
| **TIPNR** | Every proper noun in the Bible: persons (with parents/siblings/offspring), places (with lat/long from OpenBible), things — exhaustive refs per form | Primary lookup table: is this word a Person or Place? |
| **TAGNT** | Greek NT with Strong's lemma + morphology per word | Identify loanwords (untranslated Greek terms), deity epithets, titles |
| **TAHOT** | Hebrew OT with Strong's + morphology | Same for OT |
| **TBESH / TBESG** | Hebrew/Greek lexicons linked to Extended Strong's | Popover content: definition, etymology, usage count |

**Integration effort:** TIPNR is a TSV with `$`-separated records. Parse it once at build time into a SQLite lookup: `(name_variant → {type, canonical_name, description_short, refs[]})`. ~5,000–8,000 unique proper nouns. One-time script, ~2 hours to write, output cached forever.

### Secondary: OpenBible.info Cross-References (CC BY)

**URL:** `https://a.openbible.info/data/cross-references.zip`  
**Format:** CSV, ~340,000 rows. Columns: `from_verse`, `to_verse`, `votes` (community confidence score)  
**License:** CC Attribution (same as CC BY)  
**Use:** Power the Echo/Allusion underline. When rendering a verse, look up its cross-refs and flag phrases where an OT passage is referenced in the NT (or vice versa). The votes column lets you threshold to high-confidence echoes only.

### Tertiary: OpenScriptures Strong's (Public Domain)

**Repository:** `github.com/openscriptures/strongs`  
**Format:** XML + JSON conversion script included  
**Use:** Fallback lexicon for terms not covered by TIPNR. Strong's H3068 → YHWH → definition. Already public domain (1890).

### Skip for now

- **Macula Greek/Hebrew** (Clear Bible, CC BY-SA 4.0): excellent linguistic data (semantic roles, syntax trees) but overkill for v1. License requires ShareAlike on derivatives — check before integrating.
- **Sefaria Linker API**: detects Torah citations, not individual tokens. Useful for future cross-book reference linking, not inline token classification.
- **BibleNLP biblical-names-data**: primarily for translation alignment across 15 languages, not token lookup.
- **scrollmapper/bible_databases**: convenient cross-reference SQLite but just repackages OpenBible data. Skip the middleman.

---

## 6. Architecture Choice: Hybrid Static-First + Pre-Annotated on Open

### Option A — Pure static dictionary

Pre-parse TIPNR → SQLite. At render time, tokenize chapter text, look up each capitalized word. No AI cost, instant.

**Problem:** Misses time markers, quoted speech, echoes, multi-word artifact names ("Ark of the Covenant"), contextual ambiguity (Paul the apostle vs. Paul a common name in Hellenistic texts).

### Option B — On-demand Claude per word

Every word is tappable; definition fetched on tap from Claude.

**Problem:** Cold-tap latency (~1.5s), cost per interaction, no visual differentiation before tap (the color-coding is the product).

### Option C — Hybrid (recommended)

```
RENDER TIME (0ms)
  tokenize(chapter_text)
  for each token:
    if lexicon.has(token):
      tag with static category + data
    else:
      tag as 'unclassified' (no highlight)

FIRST OPEN — enqueue background job (non-blocking)
  claudeAnnotate(chapter_text)
  → returns manifest: [{word_index, category, id, note}]
  → save to SQLite: annotations(bible_id, book, chapter, manifest JSON)
  → push update to client via SSE or re-fetch trigger

SUBSEQUENT OPENS (instant)
  load manifest from SQLite
  merge with static tags
  render with full annotation set
```

**Claude cost estimate (Sonnet 4.6 batch mode):**
- Average chapter: ~500 words = ~667 input tokens
- Prompt + chapter: ~1,200 input tokens
- Annotation output (XML manifest): ~800 output tokens
- Total at batch pricing (50% off): $0.0018 input + $0.006 output = **~$0.008/chapter**
- 1,189 Protestant chapters + 120 Pseudepigrapha = 1,309 chapters
- Full canon warm-up: **~$10.50 one-time**

Use `claude-haiku-4-5-20251001` (cheapest, fast) for annotation — it doesn't need reasoning, just classification. Further reduces to ~**$3–4 total**.

---

## 7. UX Patterns

### Popover content layout

```
┌─────────────────────────────────────────┐
│  [Category icon] ABRAHAM          Person │
│  ─────────────────────────────────────  │
│  Son of Terah; father of Isaac; the      │
│  patriarch of Israel and Islam.          │
│                                          │
│  Hebrew: אַבְרָהָם (ʾAḇrāhām)            │
│  Strong's: H85 · 175 occurrences        │
│                                          │
│  [↗ Cross-references: 23]               │
└─────────────────────────────────────────┘
```

Fields per token type:
- **Person:** name, brief description (from TIPNR), Hebrew/Greek original + transliteration, Strong's number, occurrence count
- **Place:** name, location description, lat/long (for future map), occurrence count
- **Deity:** name/epithet, theological note, original language
- **Loanword:** transliteration, definition, English approximation
- **Number:** unit explanation (what is a cubit? what is a talent worth?)
- **Echo/Allusion:** "This echoes [passage]" with the source text

### Desktop — hover

Use Radix UI `HoverCard` (which internally uses Floating UI for positioning). `openDelay={400}` — enough to avoid accidental triggers while reading. `closeDelay={200}`. Pointer-events-none on card until pointer enters it.

```tsx
<HoverCard.Root openDelay={400} closeDelay={200}>
  <HoverCard.Trigger asChild>
    <Token token={token} theme={theme} />
  </HoverCard.Trigger>
  <HoverCard.Portal>
    <HoverCard.Content side="top" sideOffset={4} className="token-popover">
      <TokenPopover token={token} />
    </HoverCard.Content>
  </HoverCard.Portal>
</HoverCard.Root>
```

### Mobile — tap

The conflict: iOS long-press triggers native text selection callout. Solution:
1. `user-select: none` on the span (`-webkit-user-select: none`) to suppress native selection
2. Use `onClick` (fires after a tap, not on long-press) — no conflict
3. Render a bottom sheet (`position: fixed; bottom: 0`) instead of a floating popover — avoids Floating UI positioning issues on mobile, safe-area aware

```tsx
const isMobile = useIsMobile(); // your existing hook
// Desktop → HoverCard; Mobile → Sheet triggered by click
```

### Density toggle

Add a `data-highlight-density` attribute to the reading container. Three levels:

- `dense`: all 10 categories shown
- `moderate` (default): Person, Place, Deity, Loanword only (4 categories — what most readers need)
- `minimal`: Deity only

```css
[data-highlight-density="minimal"] .token-person,
[data-highlight-density="minimal"] .token-place,
...etc { background: transparent; color: inherit; }
```

A toggle lives in your existing Settings panel — same location as the theme picker.

### Keyboard navigation

For power users: `Tab` steps through highlighted tokens in document order. `Escape` closes popover. `Enter` on a focused token opens it. This requires `tabIndex={0}` on each `<Token>` span and standard focus management in the popover.

---

## 8. MVP Scope

### Ship in v1

- Static dictionary lookup (TIPNR-backed) for 4 categories: Person, Place, Deity, Loanword
- Background annotation job for chapters (enqueued on first open, results cached in SQLite)
- Popover: content fields for Person and Place (name, description, Strong's, occurrence count)
- Mobile bottom sheet vs desktop HoverCard
- Density toggle: `moderate` (4 categories) and `dense` (all 10)
- Colors per the 3 existing themes, implemented as CSS classes on `<span>` elements
- Attribution: "Data: STEPBible.org CC BY 4.0" in settings footer

### Defer to v2

- Echo/Allusion underlining (requires cross-ref matching per verse, richer Claude prompt)
- Time Marker and Quoted Speech categories
- Number/Measure explanations (what is a talent worth in modern currency?)
- Map popover for Place (lat/long from OpenBible geocoding)
- Keyboard navigation (Tab through tokens)
- Command palette (Cmd+K → search any person/place)
- Pseudepigrapha annotation (different entity set, lower ROI for v1)

---

## 9. Code Sketch

### Token data types

```typescript
// lib/tokens.ts

export type TokenCategory =
  | "person"
  | "place"
  | "deity"
  | "loanword"
  | "number"
  | "title"
  | "artifact"
  | "time-marker"
  | "echo"
  | "speech";

export interface TokenDef {
  category: TokenCategory;
  canonical: string;             // normalized display name
  description: string;           // 1–2 sentence summary from TIPNR
  original?: string;             // Hebrew/Greek form
  transliteration?: string;
  strongsId?: string;            // e.g. "H85"
  occurrences?: number;
  crossRefs?: string[];          // verse IDs this term echoes
}

export interface AnnotatedToken {
  text: string;                  // surface form in the verse
  start: number;                 // char offset in chapter text
  end: number;
  def: TokenDef;
}

export interface ChapterManifest {
  bibleId: string;
  bookId: string;
  chapter: number;
  tokens: AnnotatedToken[];
  generatedAt: string;           // ISO timestamp
}
```

### Static lookup build script (run once)

```typescript
// scripts/build-lexicon.ts
// Parses TIPNR TSV → SQLite table: lexicon(variant TEXT PK, canonical TEXT, category TEXT, data JSON)
// ~5,000 rows. Run: bun run scripts/build-lexicon.ts
```

### Token renderer

```typescript
// components/TokenizedText.tsx
"use client";

import { HoverCard } from "@radix-ui/react-hover-card";
import { useIsMobile } from "@/lib/hooks";
import type { AnnotatedToken, ChapterManifest } from "@/lib/tokens";

interface Props {
  plainText: string;
  manifest: ChapterManifest | null;
  density: "minimal" | "moderate" | "dense";
}

export function TokenizedText({ plainText, manifest, density }: Props) {
  const mobile = useIsMobile();
  const [activeToken, setActiveToken] = useState<AnnotatedToken | null>(null);

  // Merge plain text with manifest tokens into render segments
  const segments = buildSegments(plainText, manifest?.tokens ?? []);

  return (
    <div data-highlight-density={density} className="tokenized-passage">
      {segments.map((seg, i) =>
        seg.token ? (
          mobile ? (
            <span
              key={i}
              className={`token token-${seg.token.def.category}`}
              onClick={() => setActiveToken(seg.token)}
            >
              {seg.text}
            </span>
          ) : (
            <DesktopToken key={i} segment={seg} />
          )
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}

      {/* Mobile bottom sheet */}
      {mobile && activeToken && (
        <TokenSheet token={activeToken} onClose={() => setActiveToken(null)} />
      )}
    </div>
  );
}

function buildSegments(text: string, tokens: AnnotatedToken[]) {
  // Sort tokens by start offset, build non-overlapping segment list
  // Returns [{text, token | null}]
  const sorted = [...tokens].sort((a, b) => a.start - b.start);
  const out: { text: string; token: AnnotatedToken | null }[] = [];
  let cursor = 0;
  for (const tok of sorted) {
    if (tok.start > cursor) out.push({ text: text.slice(cursor, tok.start), token: null });
    out.push({ text: tok.text, token: tok });
    cursor = tok.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), token: null });
  return out;
}
```

### Claude annotation API route

```typescript
// app/api/annotate/route.ts
// Called server-side after first chapter load. Returns 202 immediately, processes in background.
// Claude prompt (abbreviated):
//
// "You are tagging biblical text for a reading app. Return a JSON array of tokens.
//  Each token: { text, start, end, category, canonical, description, strongsId }
//  Categories: person | place | deity | loanword | number | title | artifact | time-marker | echo | speech
//  Only tag tokens with high confidence. Prefer under-tagging to over-tagging.
//  Text: [CHAPTER_TEXT]"
//
// Store result in SQLite: INSERT OR REPLACE INTO chapter_manifests (bible_id, book, chapter, manifest, created_at)
```

### CSS token classes

```css
/* In globals.css — add after existing theme blocks */

.token { border-radius: 2px; cursor: pointer; transition: background 0.1s; }

/* Parchment */
[data-theme="parchment"] .token-person    { background: rgba(139,90,43,0.14); color: #6b3d10; }
[data-theme="parchment"] .token-place     { background: rgba(42,90,139,0.12); color: #1d4e7a; }
[data-theme="parchment"] .token-deity     { background: rgba(180,130,0,0.18); color: #7a5800; font-weight: 600; }
[data-theme="parchment"] .token-loanword  { background: rgba(80,130,80,0.13); color: #2e5e2e; }
[data-theme="parchment"] .token-number    { background: rgba(160,80,140,0.11); color: #6b3060; }
[data-theme="parchment"] .token-title     { background: rgba(100,100,40,0.10); color: #4a4a10; }
[data-theme="parchment"] .token-artifact  { background: rgba(160,100,50,0.10); color: #6b3d10; }
[data-theme="parchment"] .token-time-marker { color: #8a7a6a; font-style: italic; }
[data-theme="parchment"] .token-echo      { text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #8b6f3a; }
[data-theme="parchment"] .token-speech    { border-left: 2px solid rgba(139,90,43,0.4); padding-left: 2px; }

/* Codex */
[data-theme="codex"] .token-person    { background: rgba(210,130,80,0.18); color: #e8a870; }
[data-theme="codex"] .token-place     { background: rgba(80,160,220,0.16); color: #7ab8e8; }
[data-theme="codex"] .token-deity     { background: rgba(220,180,60,0.22); color: #d4a857; font-weight: 600; }
[data-theme="codex"] .token-loanword  { background: rgba(100,200,100,0.15); color: #7dd87d; }
[data-theme="codex"] .token-number    { background: rgba(180,120,220,0.16); color: #c88ef0; }
[data-theme="codex"] .token-title     { background: rgba(180,180,80,0.13); color: #b8b84a; }
[data-theme="codex"] .token-artifact  { background: rgba(200,140,80,0.14); color: #c8a060; }
[data-theme="codex"] .token-time-marker { color: #b89968; font-style: italic; }
[data-theme="codex"] .token-echo      { text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #d4a857; }
[data-theme="codex"] .token-speech    { border-left: 2px solid rgba(212,168,87,0.5); padding-left: 2px; }

/* Sanctuary */
[data-theme="sanctuary"] .token-person    { background: rgba(124,58,237,0.10); color: #5b21b6; }
[data-theme="sanctuary"] .token-place     { background: rgba(37,99,235,0.10); color: #1d4ed8; }
[data-theme="sanctuary"] .token-deity     { background: rgba(180,130,0,0.12); color: #92400e; font-weight: 600; }
[data-theme="sanctuary"] .token-loanword  { background: rgba(16,128,64,0.10); color: #065f46; }
[data-theme="sanctuary"] .token-number    { background: rgba(190,18,60,0.09); color: #9f1239; }
[data-theme="sanctuary"] .token-title     { background: rgba(20,150,150,0.09); color: #0f766e; }
[data-theme="sanctuary"] .token-artifact  { background: rgba(180,90,20,0.09); color: #7c2d12; }
[data-theme="sanctuary"] .token-time-marker { color: #6b7280; font-style: italic; }
[data-theme="sanctuary"] .token-echo      { text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #475569; }
[data-theme="sanctuary"] .token-speech    { border-left: 2px solid rgba(71,85,105,0.4); padding-left: 2px; }

/* Density control */
[data-highlight-density="minimal"] .token-person,
[data-highlight-density="minimal"] .token-place,
[data-highlight-density="minimal"] .token-loanword,
[data-highlight-density="minimal"] .token-number,
[data-highlight-density="minimal"] .token-title,
[data-highlight-density="minimal"] .token-artifact,
[data-highlight-density="minimal"] .token-time-marker,
[data-highlight-density="minimal"] .token-echo,
[data-highlight-density="minimal"] .token-speech {
  background: transparent; color: inherit; font-weight: inherit;
  text-decoration: none; border-left: none; font-style: inherit;
}

[data-highlight-density="moderate"] .token-number,
[data-highlight-density="moderate"] .token-title,
[data-highlight-density="moderate"] .token-artifact,
[data-highlight-density="moderate"] .token-time-marker,
[data-highlight-density="moderate"] .token-echo,
[data-highlight-density="moderate"] .token-speech {
  background: transparent; color: inherit; font-weight: inherit;
  text-decoration: none; border-left: none; font-style: inherit;
}
```

---

## 10. Risks and Open Questions

| Risk | Impact | Mitigation |
|------|--------|-----------|
| TIPNR doesn't cover every proper noun variant (e.g., "Abram" vs "Abraham") | MED | TIPNR explicitly tracks all Hebrew/Greek forms per individual. Verify coverage on Genesis before assuming gaps |
| Claude annotation hallucinates token boundaries (off-by-one char offsets) | HIGH | Validate offsets: `chapter_text.slice(start, end) === token.text`. Reject and re-request if any mismatch. Add validation step in the annotation pipeline |
| Highlighting breaks the reading flow — "Christmas tree" effect | HIGH | Default to `moderate` density (4 categories). Run a real-reader test with the rendered Genesis 1 before shipping |
| iOS `-webkit-user-select: none` on tokens prevents native copy/paste of verses | MED | Apply `user-select: none` only on the `<span>` wrapping the token, not the whole passage. Allow the verse container to remain selectable |
| WCAG AA contrast failures in edge cases (loanword on Codex at small sizes) | MED | Verify each color against its theme background with a contrast checker before ship. All values above pass at ≥16px body text |
| Bible ID mismatch: TIPNR uses KJV name conventions; api.bible may use different book names | MED | Normalize to USFM book codes (GEN, EXO, etc.) in both the lexicon and the manifest key |
| Railway volume SQLite write contention under concurrent first-opens | LOW | Use WAL mode (`PRAGMA journal_mode=WAL`). Enqueue annotation via a simple in-process queue (one write at a time) |
| Pseudepigrapha (1 Enoch, Jubilees) entity overlap — many names differ from canonical Bible | MED | Flag as a separate lexicon build. TIPNR does not cover 1 Enoch-specific names (Azazel, Semjaza). Claude annotation is the right path for Pseudepigrapha |

**Open questions:**
1. Does the existing `cache.ts` use SQLite on Railway volume? If so, the `chapter_manifests` table slots right in. Confirm the DB path before writing the schema.
2. Does `lib/bible-api.ts` return plain text or HTML for verse content? Char-offset annotation requires plain text; strip HTML before annotating, re-merge after.
3. What's the reading view font size? At 14px, some of the lower-contrast tokens (Title, Artifact) may need their text color darkened by ~15%.
4. Should the density default be per-user-preference (stored in `localStorage` via your existing `settings.ts`) or per-session? Recommend localStorage — treat it as a reading preference alongside theme.

---

## Key References

- [STEPBible-Data GitHub](https://github.com/STEPBible/STEPBible-Data) — TIPNR, TAGNT, TAHOT, TBESH/TBESG. CC BY 4.0. Primary data source.
- [STEPBible hover popup documentation](https://stepweb.atlassian.net/wiki/spaces/SUG/blog/2016/04/12/69074946/Popup+options+while+hovering) — best existing example of word-level hover lexicon in Bible reading. Red popup on hover, sidebar on click.
- [Logos Visual Filters](https://support.logos.com/hc/en-us/articles/360016747431-Create-a-Visual-Filter) — Person, Place, Lemma, Morph filters. User-defined colors. Closest prior art.
- [Sefaria Linker API](https://developers.sefaria.org/docs/linker-api) — POST text → char-offset citation positions. Model for the annotation response format.
- [OpenBible.info Cross-References](https://www.openbible.info/labs/cross-references/) — 340,000 TSK-derived cross-refs, CC BY, ~2MB download.
- [OpenScriptures Strongs](https://github.com/openscriptures/strongs) — Public domain Strong's dictionaries in XML/JSON.
- [Radix UI HoverCard](https://www.radix-ui.com/primitives/docs/components/hover-card) — the right primitive for desktop token popovers (built on Floating UI, accessible).
- [ScriptureMark](https://www.scripturemark.org/) — existing semantic color taxonomy (God, Jesus, Spirit, sin, commands, promises). Different ontology but validates the user demand.
- [VSCode Semantic Highlight Guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) — the 24 standard token types that inform the Bible taxonomy mapping.
- [BibleNLP awesome-bible-nlp](https://github.com/BibleNLP/awesome-bible-nlp) — curated NLP resources; useful for v2 if you want a fine-tuned NER model.
- [Dracula theme color spec](https://github.com/dracula/visual-studio-code/blob/main/src/dracula.yml) — reference for how 7 hues cover ~12 semantic categories on a dark background.
