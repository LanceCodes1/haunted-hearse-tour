import type { Metadata } from "next";
import { Creepster, Geist, Geist_Mono, Special_Elite } from "next/font/google";
import "./globals.css";

// Horror display font for the title and headline only
const creepster = Creepster({
  variable: "--font-creepster",
  weight: "400",
  subsets: ["latin"],
});

// Typewriter font for small sign-style labels
const specialElite = Special_Elite({
  variable: "--font-special-elite",
  weight: "400",
  subsets: ["latin"],
});

// Readable body font for facts and narration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospace font from the Next.js starter (available as font-mono)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Browser tab title and search-engine description
export const metadata: Metadata = {
  title: "Haunted Hearse Tour",
  description: "A campy tour of horror legends' resting places. Facts from Wikidata, narration by AI.",
};

// The page shell every route renders inside: loads all four fonts on <html>
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${creepster.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
