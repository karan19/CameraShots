"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { VariationMode } from "../../components/BuildingWaveScene";

const BuildingWaveScene = dynamic(() => import("../../components/BuildingWaveScene"), { ssr: false });

const options: { label: string; value: VariationMode }[] = [
  { label: "Wave (Z sort)", value: "wave-z" },
  { label: "Radial Ripple", value: "radial" },
  { label: "Diagonal Sweep", value: "diagonal" },
  { label: "Spiral Sweep", value: "spiral" },
  { label: "Cluster Stagger", value: "clusters" },
  { label: "Jitter (post rise)", value: "jitter" },
  { label: "Color Beats", value: "color-beats" },
  { label: "Camera Fly-in", value: "fly-in" },
  { label: "Night Mode", value: "night" },
  { label: "Looping Wave", value: "looping" }
];

export default function ScenePage() {
  const [mode, setMode] = useState<VariationMode>("wave-z");

  return (
    <main className="relative min-h-screen bg-white text-black">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md border border-black/10 bg-white/70 px-3 py-2 shadow-sm transition hover:border-black/20 hover:bg-white"
        >
          ← Back
        </Link>
        <span className="rounded-md border border-black/10 bg-white/70 px-3 py-2 shadow-sm">Buildings Wave</span>
        <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white/70 px-3 py-2 shadow-sm">
          <span className="text-xs uppercase tracking-wide text-black/70">Mode</span>
          <select
            className="bg-transparent text-sm outline-none"
            value={mode}
            onChange={(e) => setMode(e.target.value as VariationMode)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="h-screen w-full">
        <BuildingWaveScene mode={mode} />
      </div>
    </main>
  );
}
