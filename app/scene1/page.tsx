"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

type RevealMode = "grow" | "clip";
type ModelOption = { label: string; path: string };

const modelOptions: ModelOption[] = [
  { label: "City Pack 3", path: "/models/city_pack_3.glb" },
  { label: "City Pack 7", path: "/models/city_pack_7.glb" },
  { label: "City Pack Blur Controlled", path: "/models/city_pack_blur_controlled.glb" }
];

const Scene1Model = dynamic(() => import("../../components/Scene1Model"), { ssr: false });

export default function Scene1Page() {
  const [mode, setMode] = useState<RevealMode>("grow");
  const [modelPath, setModelPath] = useState<string>(modelOptions[0].path);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#03050a] via-[#060a12] to-black text-white">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm transition hover:border-white/20 hover:bg-white/20"
        >
          ← Back
        </Link>
        <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm text-white/80">
          City Packs GLB
        </span>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm">
          <span className="text-xs uppercase tracking-wide text-white/60">Reveal</span>
          <select
            className="bg-transparent text-sm outline-none"
            value={mode}
            onChange={(e) => setMode(e.target.value as RevealMode)}
          >
            <option value="grow">Grow Up (scale)</option>
            <option value="clip">Clipping Plane</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm">
          <span className="text-xs uppercase tracking-wide text-white/60">Model</span>
          <select
            className="bg-transparent text-sm outline-none"
            value={modelPath}
            onChange={(e) => setModelPath(e.target.value)}
          >
            {modelOptions.map((opt) => (
              <option key={opt.path} value={opt.path}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="h-screen w-full">
        <Scene1Model mode={mode} modelPath={modelPath} />
      </div>
    </main>
  );
}
