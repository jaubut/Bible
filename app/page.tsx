import Link from "next/link";
import LanguagePicker from "@/components/LanguagePicker";
import Settings from "@/components/Settings";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-6 pt-8 sm:pt-16 pb-16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Bible Companion
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[color:var(--color-aside)] max-w-xl">
            Read Scripture with a knowledgeable companion who reads aloud and weaves
            in the historical, cultural, and linguistic context that brings the text alive.
          </p>
        </div>
        <Settings />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Choose a translation</h2>
        <p className="mt-1 text-sm text-[color:var(--color-aside)]">
          Filter by region or browse the full catalog.
        </p>
        <div className="mt-5">
          <LanguagePicker />
        </div>
      </section>

      <section className="mt-12 text-sm text-[color:var(--color-aside)]">
        <p>
          Personal project. Scripture text via{" "}
          <Link href="https://scripture.api.bible" className="underline">
            api.bible
          </Link>
          . Companion narration by Claude.
        </p>
      </section>
    </main>
  );
}
