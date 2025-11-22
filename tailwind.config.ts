import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        graphite: "#0d0f13",
        cyanGlow: "#7df9ff",
        slate: "#10131a"
      },
      boxShadow: {
        glass: "0 10px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)"
      }
    }
  },
  plugins: []
};

export default config;
