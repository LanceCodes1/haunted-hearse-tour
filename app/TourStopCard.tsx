"use client";
// Front end: one tour stop card (facts + map + narration + honesty label). Shared by the home page
// and the share page, so every stop looks the same and always carries the same label.
import dynamic from "next/dynamic";
import Image from "next/image";

// Leaflet needs the browser, so the map skips server rendering and loads on the client only
const TourMap = dynamic(() => import("./TourMap"), {
  ssr: false,
  loading: () => <p className="mt-3 text-sm text-bone/60">Loading map…</p>,
});

// What /api/narrate sends back: facts + narration, or just a friendly error
export type TourStop = {
  name?: string;
  born?: string | null;
  died?: string | null;
  burialPlace?: string | null;
  coordinates?: { lat: number; lon: number } | null;
  message?: string;
  narration?: { title: string; text: string } | null;
  narrationError?: string;
  error?: string;
};

const LABEL = "Facts from Wikidata · Narration by AI";

// Browser event that sends the visitor back to the intro panel (used by the card button and the site title)
export const ENTRANCE_EVENT = "tour:entrance";

// Wikidata dates are "1882-10-20"; format in UTC so a time zone can't shift the day
function formatDate(date?: string | null): string {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

// One tour stop: back button, tombstone, Wikidata facts (+ map), AI narration, and the honesty label
export default function TourStopCard({ stop }: { stop: TourStop }) {
  return (
    <article className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-rust/60 bg-tar/90 text-bone shadow-[0_0_40px_rgba(168,18,31,0.25)]">
      {/* Back to the intro panel, same as clicking the site title */}
      <div className="bg-black/60 px-4 pt-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(ENTRANCE_EVENT))}
          className="rounded-full border border-rust/60 px-3 py-1 font-sign text-sm text-bone transition duration-200 hover:border-amber hover:shadow-[0_0_12px_rgba(242,169,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
        >
          ← Back to the tour entrance
        </button>
      </div>
      <div className="flex justify-center bg-black/60 pt-4">
        <Image src="/images/tombstone-frame.png" alt="Tombstone" width={240} height={219} />
      </div>

      <div className="flex flex-col gap-5 p-6">
        {/* Route-level error (bad ID, rate limit, Wikidata down): show only the friendly message */}
        {stop.error ? (
          <p>{stop.error}</p>
        ) : (
          <>
            {/* Facts block: straight from Wikidata, never from the AI */}
            <div>
              <h3 className="mb-1 font-sign text-xs uppercase tracking-widest text-amber">Facts from Wikidata</h3>
              <p className="text-2xl font-bold">{stop.name}</p>
              <p className="text-bone/80">
                {formatDate(stop.born)} – {formatDate(stop.died)}
              </p>
              <p className="text-bone/80">Resting place: {stop.burialPlace ?? "Unknown"}</p>
              {stop.message && <p className="mt-2 italic text-bone/70">{stop.message}</p>}
              {/* Map only when Wikidata gave real coordinates; a new key builds a fresh map per legend */}
              {stop.coordinates && (
                <TourMap
                  key={stop.name}
                  lat={stop.coordinates.lat}
                  lon={stop.coordinates.lon}
                  place={stop.burialPlace ?? stop.name ?? "this stop"}
                />
              )}
            </div>

            {/* Narration block: kept visibly separate from the facts */}
            <div className="border-t border-rust/40 pt-4">
              <h3 className="mb-1 font-sign text-xs uppercase tracking-widest text-amber">Narration by AI</h3>
              {stop.narration ? (
                <>
                  <p className="mb-2 font-display text-2xl tracking-wide text-blood">{stop.narration.title}</p>
                  <p className="leading-relaxed">{stop.narration.text}</p>
                </>
              ) : (
                <p className="italic text-bone/70">{stop.narrationError ?? "Our tour guide lost their voice. Here are the facts for now."}</p>
              )}
            </div>
          </>
        )}

        {/* Honesty label on every card */}
        <p className="border-t border-rust/40 pt-3 text-center text-xs text-bone/60">{LABEL}</p>
      </div>
    </article>
  );
}
