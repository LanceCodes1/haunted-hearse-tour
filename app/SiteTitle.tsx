"use client";
// Front end: the flickering site title. On the home page, clicking it returns to the intro panel.
// On the share page there's no intro panel, so it's a plain link home (href).
import Link from "next/link";
import { ENTRANCE_EVENT } from "./TourStopCard";

// Main channel first, then forks that split off its corners (like veins or a cracked windshield)
const BOLT_PATHS = [
  { d: "M70 0 L58 40 L72 46 L52 98 L64 104 L44 160 L50 165 L38 200", width: 2 },
  { d: "M58 40 L42 58 L46 64 L30 82", width: 1 },
  { d: "M72 46 L90 70 L86 76 L104 96", width: 1 },
  { d: "M52 98 L34 116 L38 122 L22 140", width: 1 },
  { d: "M64 104 L80 128 L76 134 L92 156", width: 1 },
];

export default function SiteTitle({ href }: { href?: string }) {
  const className = "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber";
  return (
    <>
      {/* Mounted with the title so both 6s animations start together and stay in sync on every page.
          Above the map (Leaflet uses z-index up to 1000) but never blocks clicks */}
      <div aria-hidden="true" className="lightning pointer-events-none fixed inset-x-0 top-0 z-[2000] h-[45vh] opacity-0" />
      {/* A branching bolt: one main channel plus 4 thinner forks, drawn top-down through the sky glow */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 200"
        className="pointer-events-none fixed right-[8%] top-0 z-[2000] h-[40vh] w-auto"
      >
        <g fill="none" stroke="#e8f0ff" strokeLinejoin="miter" style={{ filter: "drop-shadow(0 0 4px #9fc3ff)" }}>
          {BOLT_PATHS.map(({ d, width }) => (
            <path
              key={d}
              className="lightning-bolt"
              pathLength={1}
              d={d}
              strokeWidth={width}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
      <h1 className="title-flicker text-center font-display text-4xl tracking-wider text-bone md:text-6xl">
        {href ? (
          <Link href={href} className={className}>
            Haunted Hearse Tour
          </Link>
        ) : (
          <button type="button" onClick={() => window.dispatchEvent(new Event(ENTRANCE_EVENT))} className={className}>
            Haunted Hearse Tour
          </button>
        )}
      </h1>
    </>
  );
}
