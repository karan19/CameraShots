"use client";

import Link from "next/link";
import { Pacifico } from "next/font/google";

const cursive = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Scene4Page() {
  return (
    <main className="min-h-screen bg-[#0A0E15] text-white">
      <div className="absolute left-4 top-4 text-sm text-white/60">
        <Link
          href="/"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
        >
          ← Back
        </Link>
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className={`${cursive.className} text-4xl sm:text-5xl text-white drop-shadow-lg`}>
          Karan Kanchetty&apos;s portfolio
        </h1>
        <p className="mt-3 text-sm text-white/70">Choose how bold you want to browse.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/showoff"
            className="rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-[#0A0E15] shadow-lg shadow-sky-900/40 transition hover:scale-[1.02] hover:shadow-sky-900/60"
          >
            Show-off
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 shadow-lg shadow-black/30 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            Sane mode
          </Link>
        </div>
      </div>
    </main>
  );
}
