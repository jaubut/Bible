import Link from "next/link";
import LanguagePicker from "@/components/LanguagePicker";
import Settings from "@/components/Settings";
import HomeBento from "@/components/HomeBento";
import Onboarding from "@/components/Onboarding";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-6 pt-8 sm:pt-12 pb-16">
      <div className="flex items-start justify-between gap-3 mb-10 sm:mb-14">
        <div>
          <h1 className="t-display">Bible Companion</h1>
          <p className="t-body mt-3 text-[color:var(--color-aside)] max-w-xl">
            Read scripture with a companion who reads aloud and brings the
            history, language, and culture alive.
          </p>
        </div>
        <Settings />
      </div>

      <section className="mb-14">
        <HomeBento />
      </section>

      <section id="translations" className="mb-12 scroll-mt-8">
        <h2 className="t-section mb-1">Choose a translation</h2>
        <p className="t-caption text-[color:var(--color-aside)] mb-5">
          Filter by region or browse the full catalog.
        </p>
        <LanguagePicker />
      </section>

      <footer className="t-caption text-[color:var(--color-aside)]">
        <p>
          Personal project. Scripture text via{" "}
          <Link href="https://scripture.api.bible" className="underline">
            api.bible
          </Link>
          . Companion narration by Claude. Public-domain Pseudepigrapha bundled.
        </p>
      </footer>

      <Onboarding />
    </main>
  );
}
