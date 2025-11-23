"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import * as THREE from "three";

type RevealMode = "grow" | "clip";

const Scene3Models = dynamic(() => import("../../components/Scene3Models"), { ssr: false });

export default function Scene3Page() {
  const [mode, setMode] = useState<RevealMode>("grow");
  const [focusIndex, setFocusIndex] = useState(0);
  const [useCustom, setUseCustom] = useState(false);
  const [custom, setCustom] = useState({ x: -5.5, y: 0, z: 0 });
  const [savedPoints, setSavedPoints] = useState<[number, number, number][]>([]);
  const pos3: [number, number, number] = [0, 0, 0];
  const rot3: [number, number, number] = [
    0,
    THREE.MathUtils.degToRad(-90),
    0
  ];

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
          City Pack 3
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
          <span className="text-xs uppercase tracking-wide text-white/60">Point</span>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={focusIndex}
            onChange={(e) => setFocusIndex(parseInt(e.target.value, 10))}
            className="accent-cyan-400"
            disabled={useCustom}
          />
          <span className="text-white/80 text-sm">{useCustom ? "Custom" : `#${focusIndex + 1}`}</span>
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            className="accent-cyan-400"
          />
          <span className="text-xs uppercase tracking-wide text-white/60">Use custom point</span>
        </label>
        {useCustom && (
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm">
            {(["x", "y", "z"] as const).map((axis) => (
              <label key={axis} className="flex items-center gap-1 text-xs text-white/70">
                {axis.toUpperCase()}
                <input
                  type="number"
                  step="0.5"
                  value={custom[axis]}
                  onChange={(e) =>
                    setCustom((prev) => ({
                      ...prev,
                      [axis]: parseFloat(e.target.value)
                    }))
                  }
                  className="w-16 rounded bg-black/30 px-1 py-0.5 text-white outline-none"
                />
              </label>
            ))}
          </div>
        )}
        <button
          type="button"
          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm shadow-sm transition hover:border-white/20 hover:bg-white/20"
          onClick={() => {
            const point = useCustom ? [custom.x, custom.y, custom.z] : undefined;
            if (point) {
              setSavedPoints((prev) => [...prev, point]);
            }
          }}
        >
          Save point
        </button>
        {savedPoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 shadow-sm text-xs text-white/70">
            Saved:
            {savedPoints.map((p, idx) => (
              <button
                key={`saved-${idx}`}
                type="button"
                className="rounded border border-white/20 px-2 py-1 text-white/80 transition hover:border-white/40 hover:text-white"
                onClick={() => {
                  setUseCustom(true);
                  setCustom({ x: p[0], y: p[1], z: p[2] });
                }}
              >
                #{idx + 1} ({p.map((v) => v.toFixed(1)).join(", ")})
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-screen w-full">
        <Scene3Models
          mode={mode}
          pos3={pos3}
          rot3={rot3}
          focusIndex={useCustom ? 4 : focusIndex}
          customFocus={useCustom ? [custom.x, custom.y, custom.z] : null}
          savedPoints={savedPoints}
        />
      </div>
    </main>
  );
}
