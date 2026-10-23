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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haunted Hearse Tour",
  description: "A campy tour of horror legends' resting places. Facts from Wikidata, narration by AI.",
};

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
