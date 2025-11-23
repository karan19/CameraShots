"use client";

import Link from "next/link";
import { Pacifico } from "next/font/google";
import { useEffect, useRef } from "react";

const cursive = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Scene4Page() {
  const planeRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!planeRef.current || !skyRef.current) return;
    planeRef.current.style.transformOrigin = "50% 100%";
    planeRef.current.style.transformStyle = "preserve-3d";
    planeRef.current.style.transition = "transform 1s ease-in-out";
    planeRef.current.style.transform = "rotateX(0deg)";

    skyRef.current.style.transition = "opacity 1s ease-in-out";
    skyRef.current.style.opacity = "0";
  }, []);

  const handleShowOff = () => {
    if (!planeRef.current || !skyRef.current) return;
    // reset first to allow re-triggering
    planeRef.current.style.transform = "rotateX(0deg)";
    skyRef.current.style.opacity = "0";
    // next frame, apply the fall
    requestAnimationFrame(() => {
      planeRef.current!.style.transform = "rotateX(-90deg)";
      skyRef.current!.style.opacity = "1";
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute left-4 top-4 text-sm text-white/60">
        <Link
          href="/"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
        >
          ← Back
        </Link>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className={`${cursive.className} text-4xl sm:text-5xl text-white drop-shadow-lg`}>
          Karan Kanchetty&apos;s portfolio
        </h1>
        <p className="mt-3 text-sm text-white/70">Choose how bold you want to browse.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleShowOff}
            className="rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-[#0A0E15] shadow-lg shadow-sky-900/40 transition hover:scale-[1.03] hover:shadow-sky-900/60"
          >
            Show-off
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 shadow-lg shadow-black/30 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            Sane mode
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        <div
          ref={skyRef}
          className="absolute inset-0 opacity-0"
          style={{
            backgroundImage:
              "radial-gradient(#7acbff 1px, transparent 1px), radial-gradient(#e0f0ff 1px, transparent 1px)",
            backgroundSize: "120px 120px, 180px 180px",
            backgroundPosition: "0 0, 60px 60px",
            zIndex: 1
          }}
        />
        <div
          ref={planeRef}
          className="absolute inset-0 bg-[#0A0E15]"
          style={{
            zIndex: 2
          }}
        />
      </div>
    </main>
  );
}
