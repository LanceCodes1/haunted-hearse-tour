"use client";
// Front end: the clickable roster and the tour stop card. It only ever calls our own /api/narrate route.
import Image from "next/image";
import { useState } from "react";

export type TourName = { id: string; name: string; group: "LA Legends" | "Beyond LA" };

// What /api/narrate sends back: facts + narration, or just a friendly error
type TourStop = {
  name?: string;
  born?: string | null;
  died?: string | null;
  burialPlace?: string | null;
  message?: string;
  narration?: { title: string; text: string } | null;
  narrationError?: string;
  error?: string;
};

const LABEL = "Facts from Wikidata · Narration by AI";

// Wikidata dates are "1882-10-20"; format in UTC so a time zone can't shift the day
function formatDate(date?: string | null): string {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

export default function TourGuide({ tour }: { tour: TourName[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stop, setStop] = useState<TourStop | null>(null);
  const [loading, setLoading] = useState(false);

  async function visit(id: string) {
    setSelectedId(id);
    setStop(null);
    setLoading(true); // buttons are disabled while loading, so only one AI call runs at a time
    try {
      const res = await fetch(`/api/narrate?id=${encodeURIComponent(id)}`);
      setStop(await res.json()); // facts + narration, or { error } with a friendly message
    } catch {
      setStop({ error: "The hearse broke down. Try again in a moment." }); // network failure or a non-JSON reply
    } finally {
      setLoading(false);
    }
  }

  const groups: TourName["group"][] = ["LA Legends", "Beyond LA"];

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      {/* Roster list, grouped */}
      <nav className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{group}</h2>
            <ul className="flex flex-col gap-1">
              {tour
                .filter((legend) => legend.group === group)
                .map((legend) => (
                  <li key={legend.id}>
                    <button
                      onClick={() => visit(legend.id)}
                      disabled={loading}
                      className={`w-full rounded px-3 py-1.5 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
                        legend.id === selectedId ? "bg-zinc-800 text-white" : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {legend.name}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </nav>

      {/* Tour stop card */}
      <section className="min-h-64">
        {!selectedId && <p className="text-zinc-500">Pick a legend to start the tour.</p>}
        {loading && <p className="text-zinc-500">Mortimer is warming up the hearse…</p>}
        {stop && <TourStopCard stop={stop} />}
      </section>
    </div>
  );
}

function TourStopCard({ stop }: { stop: TourStop }) {
  return (
    <article className="mx-auto max-w-xl overflow-hidden rounded-lg bg-zinc-900 text-zinc-100 shadow-lg">
      <div className="flex justify-center bg-black pt-4">
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
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Facts from Wikidata</h3>
              <p className="text-2xl font-bold">{stop.name}</p>
              <p className="text-zinc-300">
                {formatDate(stop.born)} – {formatDate(stop.died)}
              </p>
              <p className="text-zinc-300">Resting place: {stop.burialPlace ?? "Unknown"}</p>
              {stop.message && <p className="mt-2 italic text-zinc-400">{stop.message}</p>}
            </div>

            {/* Narration block: kept visibly separate from the facts */}
            <div className="border-t border-zinc-700 pt-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Narration by AI</h3>
              {stop.narration ? (
                <>
                  <p className="mb-2 text-lg font-semibold">{stop.narration.title}</p>
                  <p className="leading-relaxed">{stop.narration.text}</p>
                </>
              ) : (
                <p className="italic text-zinc-400">{stop.narrationError ?? "Our tour guide lost their voice. Here are the facts for now."}</p>
              )}
            </div>
          </>
        )}

        {/* Honesty label on every card */}
        <p className="border-t border-zinc-700 pt-3 text-center text-xs text-zinc-500">{LABEL}</p>
      </div>
    </article>
  );
}
