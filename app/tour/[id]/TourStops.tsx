"use client";
// Front end: a saved tour's stop list. Clicking a stop asks our /api/narrate route in the tour's saved narrator voice.
import { useState } from "react";
import type { Persona } from "@/lib/generated/prisma/enums";
import TourStopCard, { type TourStop } from "../../TourStopCard";

type Stop = { id: string; name: string };

export default function TourStops({
  name,
  persona,
  narratorLabel,
  stops,
}: {
  name: string;
  persona: Persona;
  narratorLabel: string;
  stops: Stop[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stop, setStop] = useState<TourStop | null>(null);
  const [loading, setLoading] = useState(false);

  // Same path as the home page: our server checks the legend and persona, then calls Wikidata and the AI
  async function visit(id: string) {
    setSelectedId(id);
    setStop(null);
    setLoading(true); // stop buttons are disabled while loading, so only one AI call runs at a time
    try {
      const res = await fetch(`/api/narrate?id=${encodeURIComponent(id)}&persona=${encodeURIComponent(persona)}`);
      setStop(await res.json()); // facts + narration, or { error } with a friendly message
    } catch {
      setStop({ error: "The hearse broke down. Try again in a moment." }); // network failure or a non-JSON reply
    } finally {
      setLoading(false);
    }
  }

  function backToStops() {
    setSelectedId(null);
    setStop(null);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <nav className="flex flex-col gap-3">
        <div className="px-2">
          <h2 className="font-display text-3xl tracking-wide text-blood">{name}</h2>
          <p className="font-sign text-sm text-amber">Narrator: {narratorLabel}</p>
        </div>
        {stops.length === 0 ? (
          <p className="px-2 italic text-bone/70">This tour&apos;s legends are no longer on our roster.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {stops.map((legend, index) => (
              <li key={legend.id}>
                <button
                  onClick={() => visit(legend.id)}
                  disabled={loading}
                  className={`w-full rounded-2xl border px-4 py-2 text-left md:rounded-full transition duration-200 ease-out hover:-translate-y-0.5 hover:border-amber hover:shadow-[0_0_16px_rgba(242,169,59,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                    legend.id === selectedId ? "border-blood bg-blood text-bone" : "border-rust/60 bg-tar/80 text-bone"
                  }`}
                >
                  <span className="mr-2 text-amber">{index + 1}.</span>
                  {legend.name}
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="px-2 text-xs text-bone/50">Route picked by AI from our roster</p>
      </nav>

      <section className="min-h-64">
        {!selectedId && <p className="text-center font-sign text-bone/70">Pick a stop to start the tour.</p>}
        {loading && (
          <p role="status" aria-live="polite" className="eerie-pulse text-center font-display text-3xl tracking-wide text-blood">
            The hearse is warming up…
          </p>
        )}
        {/* Same card as the home page; here "back" returns to this tour's stop list */}
        {stop && <TourStopCard stop={stop} onBack={backToStops} backLabel="← Back to the stop list" />}
      </section>
    </div>
  );
}
