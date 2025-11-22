import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lapz.io Procedural Prototype",
  description: "Scroll-driven Lapz.io experience built with R3F and procedural geometry."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="noise-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
