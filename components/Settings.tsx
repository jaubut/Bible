"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon, X, Volume2, Check } from "lucide-react";
import { THEMES, STORAGE_KEYS, type ThemeId, isThemeId } from "@/lib/settings";
import { listVoices, onVoicesReady, type RankedVoice } from "@/lib/voices";

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
  const [rate, setRate] = useState(0.95);

  // Hydrate from localStorage
  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    if (isThemeId(t)) setTheme(t);

    const vu = localStorage.getItem(STORAGE_KEYS.voiceURI);
    if (vu) setVoiceURI(vu);

    const r = parseFloat(localStorage.getItem(STORAGE_KEYS.voiceRate) ?? "0.95");
    if (!Number.isNaN(r)) setRate(r);
  }, []);

  // Load voices (async on Chrome)
  useEffect(() => {
    const update = () => setVoices(listVoices());
    update();
    const off = onVoicesReady(update);
    return off;
  }, []);

  function applyTheme(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem(STORAGE_KEYS.theme, id);
  }

  function applyVoice(uri: string) {
    setVoiceURI(uri);
    localStorage.setItem(STORAGE_KEYS.voiceURI, uri);
  }

  function applyRate(r: number) {
    setRate(r);
    localStorage.setItem(STORAGE_KEYS.voiceRate, String(r));
  }

  function preview() {
    if (typeof window === "undefined" || !voices.length) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "In the beginning, God created the heavens and the earth.",
    );
    const v = voices.find((rv) => rv.voice.voiceURI === voiceURI)?.voice;
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
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

              {/* Voice */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-aside)]">
                    Voice
                  </h3>
                  <button
                    type="button"
                    onClick={preview}
                    disabled={!voices.length}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--color-divider)] px-3 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-40"
                    aria-label="Preview voice"
                  >
                    <Volume2 size={16} /> Preview
                  </button>
                </div>

                {voices.length === 0 ? (
                  <p className="text-sm text-[color:var(--color-aside)]">
                    Loading voices…
                  </p>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={voiceURI}
                      onChange={(e) => applyVoice(e.target.value)}
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

                    <p className="text-xs text-[color:var(--color-aside)] leading-relaxed">
                      Tip: on iOS, install higher-quality voices in <em>Settings → Accessibility → Spoken Content → Voices</em>. On macOS, install Premium/Enhanced voices in <em>System Settings → Accessibility → Spoken Content → System Voice → Manage Voices</em>.
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
