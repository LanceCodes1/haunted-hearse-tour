"use client";
// Front end: the flickering site title. Clicking it goes back to the tour entrance (the intro panel).
import { ENTRANCE_EVENT } from "./TourGuide";

export default function SiteTitle() {
  return (
    <h1 className="title-flicker text-center font-display text-4xl tracking-wider text-bone md:text-6xl">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(ENTRANCE_EVENT))}
        className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
      >
        Haunted Hearse Tour
      </button>
    </h1>
  );
}
