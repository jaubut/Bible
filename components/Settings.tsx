"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon, X, Volume2, Check } from "lucide-react";
import {
  THEMES,
  STORAGE_KEYS,
  COMPANION_LANGS,
  MODES,
  type ThemeId,
  type CompanionLang,
  type Mode,
  isThemeId,
  isCompanionLang,
  isMode,
} from "@/lib/settings";
import {
  listVoices,
  onVoicesReady,
  pickBest,
  pickPair,
  type RankedVoice,
} from "@/lib/voices";

const QUALITY_LABEL: Record<RankedVoice["quality"], string> = {
  premium: "Premium",
  enhanced: "Enhanced",
  neural: "Neural",
  standard: "Standard",
};

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("parchment");
  const [voices, setVoices] = useState<RankedVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [voiceURI_A, setVoiceURI_A] = useState<string>("");
  const [voiceURI_B, setVoiceURI_B] = useState<string>("");
  const [rate, setRate] = useState(0.95);
  const [companionLang, setCompanionLang] = useState<CompanionLang>("en");
  const [mode, setMode] = useState<Mode>("reading");

  // Hydrate from localStorage
  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    if (isThemeId(t)) setTheme(t);

    const vu = localStorage.getItem(STORAGE_KEYS.voiceURI);
    if (vu) setVoiceURI(vu);
    const va = localStorage.getItem(STORAGE_KEYS.voiceURI_A);
    if (va) setVoiceURI_A(va);
    const vb = localStorage.getItem(STORAGE_KEYS.voiceURI_B);
    if (vb) setVoiceURI_B(vb);

    const r = parseFloat(localStorage.getItem(STORAGE_KEYS.voiceRate) ?? "0.95");
    if (!Number.isNaN(r)) setRate(r);

    const cl = localStorage.getItem(STORAGE_KEYS.companionLang);
    if (isCompanionLang(cl)) setCompanionLang(cl);

    const m = localStorage.getItem(STORAGE_KEYS.mode);
    if (isMode(m)) setMode(m);
  }, []);

  // Load voices (async on Chrome). Re-rank when companion language changes
  // so the picker always surfaces the best voice for the chosen language.
  useEffect(() => {
    const update = () => {
      setVoices(listVoices(companionLang));
      const all = window.speechSynthesis?.getVoices?.() ?? [];

      // Reading-mode single voice
      const userPicked = localStorage.getItem(STORAGE_KEYS.voiceUserPicked) === "1";
      const current = localStorage.getItem(STORAGE_KEYS.voiceURI);
      const langMatches = current
        ? all.find((v) => v.voiceURI === current)?.lang.toLowerCase().startsWith(
            companionLang.toLowerCase(),
          )
        : false;
      if (!userPicked || !langMatches) {
        const best = pickBest(companionLang);
        if (best) {
          localStorage.setItem(STORAGE_KEYS.voiceURI, best.voiceURI);
          setVoiceURI(best.voiceURI);
        }
      }

      // Podcast-mode two voices: female + male in current language
      const aPicked = localStorage.getItem(STORAGE_KEYS.voiceUserPicked_A) === "1";
      const bPicked = localStorage.getItem(STORAGE_KEYS.voiceUserPicked_B) === "1";
      const aURI = localStorage.getItem(STORAGE_KEYS.voiceURI_A);
      const bURI = localStorage.getItem(STORAGE_KEYS.voiceURI_B);
      const aLangOk = aURI
        ? all.find((v) => v.voiceURI === aURI)?.lang.toLowerCase().startsWith(
            companionLang.toLowerCase(),
          )
        : false;
      const bLangOk = bURI
        ? all.find((v) => v.voiceURI === bURI)?.lang.toLowerCase().startsWith(
            companionLang.toLowerCase(),
          )
        : false;
      if (!aPicked || !aLangOk || !bPicked || !bLangOk) {
        const pair = pickPair(companionLang);
        if (pair.a && (!aPicked || !aLangOk)) {
          localStorage.setItem(STORAGE_KEYS.voiceURI_A, pair.a.voiceURI);
          setVoiceURI_A(pair.a.voiceURI);
        }
        if (pair.b && (!bPicked || !bLangOk)) {
          localStorage.setItem(STORAGE_KEYS.voiceURI_B, pair.b.voiceURI);
          setVoiceURI_B(pair.b.voiceURI);
        }
      }
    };
    update();
    const off = onVoicesReady(update);
    return off;
  }, [companionLang]);

  function applyTheme(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem(STORAGE_KEYS.theme, id);
  }

  function applyVoice(uri: string) {
    setVoiceURI(uri);
    localStorage.setItem(STORAGE_KEYS.voiceURI, uri);
    localStorage.setItem(STORAGE_KEYS.voiceUserPicked, "1");
  }

  function applyVoiceA(uri: string) {
    setVoiceURI_A(uri);
    localStorage.setItem(STORAGE_KEYS.voiceURI_A, uri);
    localStorage.setItem(STORAGE_KEYS.voiceUserPicked_A, "1");
  }

  function applyVoiceB(uri: string) {
    setVoiceURI_B(uri);
    localStorage.setItem(STORAGE_KEYS.voiceURI_B, uri);
    localStorage.setItem(STORAGE_KEYS.voiceUserPicked_B, "1");
  }

  function applyRate(r: number) {
    setRate(r);
    localStorage.setItem(STORAGE_KEYS.voiceRate, String(r));
  }

  function applyCompanionLang(l: CompanionLang) {
    setCompanionLang(l);
    localStorage.setItem(STORAGE_KEYS.companionLang, l);
  }

  function applyMode(m: Mode) {
    setMode(m);
    localStorage.setItem(STORAGE_KEYS.mode, m);
  }

  function previewWith(uri: string) {
    if (typeof window === "undefined" || !voices.length) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      companionLang === "fr"
        ? "Au commencement, Dieu créa les cieux et la terre."
        : "In the beginning, God created the heavens and the earth.",
    );
    const v = voices.find((rv) => rv.voice.voiceURI === uri)?.voice;
    if (v) u.voice = v;
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }

  function preview() {
    previewWith(voiceURI);
  }

  // Group voices by language for the picker
  const grouped = useMemo(() => {
    const map = new Map<string, RankedVoice[]>();
    for (const rv of voices) {
      const lang = rv.voice.lang || "other";
      const arr = map.get(lang) ?? [];
      arr.push(rv);
      map.set(lang, arr);
    }
    // Sort: en-* first, then alpha
    return Array.from(map.entries()).sort(([a], [b]) => {
      const aEn = a.startsWith("en");
      const bEn = b.startsWith("en");
      if (aEn && !bEn) return -1;
      if (!aEn && bEn) return 1;
      return a.localeCompare(b);
    });
  }, [voices]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5 transition"
        aria-label="Open settings"
      >
        <SettingsIcon size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-[color:var(--color-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <header className="sticky top-0 flex items-center justify-between border-b border-[color:var(--color-divider)] bg-[color:var(--color-surface)] px-5 py-4">
              <h2 id="settings-title" className="text-lg font-semibold">
                Settings
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[color:var(--color-ink)]/5"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </header>

            <div className="px-5 py-5 space-y-8">
              {/* Theme */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
                  Theme
                </h3>
                <div className="grid gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTheme(t.id)}
                      className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition min-h-[56px] ${
                        theme === t.id
                          ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)]/5"
                          : "border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5"
                      }`}
                      aria-pressed={theme === t.id}
                    >
                      <ThemeSwatch id={t.id} />
                      <div className="flex-1">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-[color:var(--color-aside)]">
                          {t.description}
                        </div>
                      </div>
                      {theme === t.id && (
                        <Check size={18} className="text-[color:var(--color-ink)]" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Mode */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
                  Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => applyMode(m.id)}
                      className={`rounded-xl border px-3 py-2.5 min-h-[64px] text-left transition ${
                        mode === m.id
                          ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)]/5"
                          : "border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5"
                      }`}
                      aria-pressed={mode === m.id}
                    >
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-[color:var(--color-aside)] mt-0.5">
                        {m.description}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Companion Language */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
                  Companion language
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANION_LANGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => applyCompanionLang(l.id)}
                      className={`rounded-xl border px-3 min-h-[48px] text-sm transition ${
                        companionLang === l.id
                          ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)]/5"
                          : "border-[color:var(--color-divider)] hover:bg-[color:var(--color-ink)]/5"
                      }`}
                      aria-pressed={companionLang === l.id}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[color:var(--color-aside)] leading-relaxed">
                  Verses stay in the Bible&apos;s original language. The companion&apos;s asides — and a brief gloss after each verse in another language — appear in your chosen language.
                </p>
              </section>

              {/* Voice(s) */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
                  {mode === "podcast" ? "Podcast voices" : "Voice"}
                </h3>

                {voices.length === 0 ? (
                  <p className="text-sm text-[color:var(--color-aside)]">
                    Loading voices…
                  </p>
                ) : (
                  <div className="space-y-4">
                    {mode === "reading" && (
                      <VoiceRow
                        label="Narrator"
                        value={voiceURI}
                        onChange={applyVoice}
                        onPreview={preview}
                        grouped={grouped}
                      />
                    )}

                    {mode === "podcast" && (
                      <>
                        <VoiceRow
                          label="Host A"
                          hint="Curious learner"
                          value={voiceURI_A}
                          onChange={applyVoiceA}
                          onPreview={() => previewWith(voiceURI_A)}
                          grouped={grouped}
                        />
                        <VoiceRow
                          label="Host B"
                          hint="Scholarly companion"
                          value={voiceURI_B}
                          onChange={applyVoiceB}
                          onPreview={() => previewWith(voiceURI_B)}
                          grouped={grouped}
                        />
                      </>
                    )}

                    <p className="text-xs text-[color:var(--color-aside)] leading-relaxed">
                      Tip: install free Premium voices in{" "}
                      <em>iOS Settings → Accessibility → Spoken Content → Voices</em>{" "}
                      or <em>macOS System Settings → Accessibility → Spoken Content → Manage Voices</em>. Apple&apos;s Premium voices sound studio-grade.
                    </p>

                    <label className="block">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm">Speed</span>
                        <span className="text-xs text-[color:var(--color-aside)]">
                          {rate.toFixed(2)}×
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.6}
                        max={1.4}
                        step={0.05}
                        value={rate}
                        onChange={(e) => applyRate(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </label>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VoiceRow({
  label,
  hint,
  value,
  onChange,
  onPreview,
  grouped,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (uri: string) => void;
  onPreview: () => void;
  grouped: [string, RankedVoice[]][];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div>
          <span className="text-sm font-medium">{label}</span>
          {hint && (
            <span className="ml-2 text-xs text-[color:var(--color-aside)]">{hint}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-divider)] px-3 text-xs hover:bg-[color:var(--color-ink)]/5"
          aria-label={`Preview ${label}`}
        >
          <Volume2 size={14} /> Preview
        </button>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[color:var(--color-divider)] bg-transparent px-3 py-3 min-h-[44px]"
      >
        <option value="">System default</option>
        {grouped.map(([lang, list]) => (
          <optgroup key={lang} label={lang}>
            {list.map((rv) => (
              <option key={rv.voice.voiceURI} value={rv.voice.voiceURI}>
                {rv.voice.name} — {QUALITY_LABEL[rv.quality]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function ThemeSwatch({ id }: { id: ThemeId }) {
  const styles: Record<ThemeId, { bg: string; ink: string; accent: string }> = {
    parchment: { bg: "#f7f1e3", ink: "#2a2522", accent: "#8b6f3a" },
    codex: { bg: "#1a140f", ink: "#e8d9b8", accent: "#d4a857" },
    sanctuary: { bg: "#ffffff", ink: "#1f2937", accent: "#475569" },
  };
  const s = styles[id];
  return (
    <div
      className="relative h-10 w-10 shrink-0 rounded-lg border border-black/10 overflow-hidden"
      style={{ background: s.bg }}
      aria-hidden
    >
      <div
        className="absolute left-1.5 top-1.5 h-1 w-5 rounded-full"
        style={{ background: s.ink }}
      />
      <div
        className="absolute left-1.5 top-3.5 h-1 w-7 rounded-full"
        style={{ background: s.ink, opacity: 0.7 }}
      />
      <div
        className="absolute left-1.5 h-1 w-4 rounded-full"
        style={{ top: "1.4rem", background: s.accent }}
      />
    </div>
  );
}
