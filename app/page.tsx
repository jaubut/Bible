import Link from "next/link";
import LanguagePicker from "@/components/LanguagePicker";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Bible Companion</h1>
      <p className="mt-3 text-lg text-[color:var(--color-aside)]">
        Read Scripture with a knowledgeable companion who reads aloud and weaves
        in the historical, cultural, and linguistic context that brings the text alive.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Choose a translation</h2>
        <p className="mt-1 text-sm text-[color:var(--color-aside)]">
          Filter to Ethiopian languages (Amharic, Ge&apos;ez, Tigrinya, Oromo) or browse all.
        </p>
        <div className="mt-4">
          <LanguagePicker />
        </div>
      </section>

      <section className="mt-12 text-sm text-[color:var(--color-aside)]">
        <p>
          Personal project. Scripture text via{" "}
          <Link href="https://scripture.api.bible" className="underline">api.bible</Link>.
          Companion narration by Claude.
        </p>
      </section>
    </main>
  );
}
