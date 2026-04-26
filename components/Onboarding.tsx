"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "bible-onboarded";

export default function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== "1") {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={dismiss}
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-[color:var(--color-surface)] shadow-2xl p-7"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        <h2 id="onboarding-title" className="t-section">
          Welcome
        </h2>
        <p className="t-body mt-3 text-[color:var(--color-aside)]">
          Read scripture with a knowledgeable companion who reads aloud and weaves in the historical, cultural, and linguistic context that brings the text alive.
        </p>
        <div className="mt-7 flex flex-col-reverse sm:flex-row gap-2">
          <button onClick={dismiss} className="btn-ghost">
            Look around
          </button>
          <Link
            href="/read/de4e12af7f28f599-02/GEN/1"
            onClick={dismiss}
            className="btn-primary flex-1"
          >
            Try a chapter →
          </Link>
        </div>
      </div>
    </div>
  );
}
