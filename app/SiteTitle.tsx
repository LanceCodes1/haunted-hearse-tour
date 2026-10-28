"use client";
// Front end: the flickering site title. On the home page, clicking it returns to the intro panel.
// On the share page there's no intro panel, so it's a plain link home (href).
import Link from "next/link";
import { ENTRANCE_EVENT } from "./TourStopCard";

export default function SiteTitle({ href }: { href?: string }) {
  const className = "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber";
  return (
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
  );
}
