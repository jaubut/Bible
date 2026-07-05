import { getCanonInfo, getGroupBlurb, GROUP_LABELS } from "@/lib/canon";

// Canon-history card for a book: membership badges + a short note on how the
// book entered (or stayed out of) the major canons. Static — renders nothing
// when the book isn't in the canon table.

export default function CanonNote({ bookId }: { bookId: string }) {
  const info = getCanonInfo(bookId);
  if (!info) return null;

  const badges = info.hebrewSection
    ? [`Hebrew Bible · ${info.hebrewSection}`, ...info.canons.filter((c) => c !== "Hebrew Bible")]
    : info.canons;

  return (
    <section className="mb-10">
      <h2 className="t-caption font-semibold uppercase tracking-wide text-[color:var(--color-aside)] mb-3">
        Canon history
      </h2>
      <div className="card-flat p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* The combined "Hebrew Bible · <section>" pill already names the group. */}
          {!info.hebrewSection && (
            <span className="rounded-full px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap bg-[color:var(--color-tint)]">
              {GROUP_LABELS[info.group]}
            </span>
          )}
          {badges.map((c) => (
            <span
              key={c}
              className="rounded-full px-2.5 py-1 text-[13px] whitespace-nowrap border border-[color:var(--color-divider)] text-[color:var(--color-aside)]"
            >
              {c}
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed mb-2">{info.note}</p>
        <p className="t-caption text-[color:var(--color-aside)]">{getGroupBlurb(info.group)}</p>
      </div>
    </section>
  );
}
