"use client";
// Front end: the clickable roster and the tour stop card. It only ever calls our own /api/narrate route.
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Persona } from "@/lib/generated/prisma/enums";
import IntroPanel from "./IntroPanel";
import { checkSearch, type LivingName } from "./searchCheck";
import TourPlanner from "./TourPlanner";
import TourStopCard, { ENTRANCE_EVENT, type TourStop } from "./TourStopCard";

export type TourName = { id: string; name: string; group: "LA Legends" | "Beyond LA"; tagline: string };
export type NarratorOption = { id: Persona; label: string }; // just a name for the button, never the prompt

const WARMING_UP = "The hearse is warming up…"; // narrator-neutral: any of the three voices may be driving

// Phones only: a one-line status right where you tapped, instead of an overlay that covers the page
function PhoneLoadingStatus() {
  return (
    <p role="status" aria-live="polite" className="eerie-pulse px-2 text-center font-display text-xl tracking-wide text-blood md:hidden">
      {WARMING_UP}
    </p>
  );
}

export default function TourGuide({
  tour,
  living,
  narrators,
  defaultNarrator,
}: {
  tour: TourName[];
  living: LivingName[];
  narrators: NarratorOption[];
  defaultNarrator: Persona;
}) {
  // Screen state: chosen legend, its card data, loading flag, search text, search message, and match buttons
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stop, setStop] = useState<TourStop | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFrom, setLoadingFrom] = useState<"list" | "search">("list"); // where the phone status line shows
  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [matches, setMatches] = useState<TourName[]>([]);
  const [persona, setPersona] = useState<Persona>(defaultNarrator); // which voice narrates the next stop
  const cardRef = useRef<HTMLDivElement>(null);

  // When a card finishes loading, scroll it into view (no smooth scroll if the user asked for less motion)
  useEffect(() => {
    if (!stop || loading) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [stop, loading]);

  // "Back to the tour entrance": clear the selection, show the intro panel, scroll to the top
  useEffect(() => {
    function goToEntrance() {
      setStop(null);
      setSelectedId(null);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
    window.addEventListener(ENTRANCE_EVENT, goToEntrance); // fired by the back button and the site title
    return () => window.removeEventListener(ENTRANCE_EVENT, goToEntrance);
  }, []);

  // Search box: run every input check first; only a single clear match calls the API
  function search(event: FormEvent) {
    event.preventDefault();
    const result = checkSearch(query, tour, living);
    setSearchMessage("message" in result ? result.message : null);
    setMatches("matches" in result ? result.matches : []);
    if ("message" in result) {
      setStop(null); // rejected search: clear the old card so only the message shows
      setSelectedId(null);
    }
    if ("open" in result) visit(result.open, "search");
  }

  // The main path: a click or search picks a legend → ask our server → show the card (or a friendly error)
  async function visit(id: string, from: "list" | "search") {
    setMatches([]);
    setSelectedId(id);
    setLoadingFrom(from);
    setStop(null);
    setLoading(true); // buttons are disabled while loading, so only one AI call runs at a time
    try {
      // The server re-checks persona against its allow-list, so a tampered value just falls back to Mortimer
      const res = await fetch(`/api/narrate?id=${encodeURIComponent(id)}&persona=${encodeURIComponent(persona)}`);
      setStop(await res.json()); // facts + narration, or { error } with a friendly message
    } catch {
      setStop({ error: "The hearse broke down. Try again in a moment." }); // network failure or a non-JSON reply
    } finally {
      setLoading(false);
    }
  }

  // The order the two roster lists appear in
  const groups: TourName["group"][] = ["LA Legends", "Beyond LA"];

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      {/* Roster list, grouped */}
      <nav className="flex flex-col gap-6">
        {/* Narrator picker: changes only the voice of the next stop, never the facts */}
        <fieldset>
          <legend className="mb-2 px-2 font-sign text-sm uppercase tracking-widest text-amber">Your narrator</legend>
          <div className="flex flex-wrap gap-1">
            {narrators.map((narrator) => (
              <label
                key={narrator.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm text-bone transition duration-200 focus-within:ring-2 focus-within:ring-amber motion-reduce:transition-none ${
                  persona === narrator.id ? "border-blood bg-blood" : "border-rust/60 bg-tar/80 hover:border-amber"
                }`}
              >
                {/* Real radio buttons, visually hidden: arrow keys and screen readers still work */}
                <input
                  type="radio"
                  name="narrator"
                  value={narrator.id}
                  checked={persona === narrator.id}
                  onChange={() => setPersona(narrator.id)}
                  disabled={loading}
                  className="sr-only"
                />
                {narrator.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Search box: checks run in the browser before any API call */}
        <form onSubmit={search} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loading}
              placeholder="Search a legend…"
              aria-label="Search a legend"
              className="min-w-0 flex-1 rounded-full border border-rust/60 bg-tar/80 px-4 py-2 text-bone placeholder:text-bone/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
            />
            <button type="submit" disabled={loading} className="rounded-full bg-blood px-4 py-2 font-sign text-bone transition duration-200 hover:shadow-[0_0_16px_rgba(168,18,31,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60 motion-reduce:transition-none">
              Search
            </button>
          </div>
          {searchMessage && <p className="px-2 text-sm italic text-amber">{searchMessage}</p>}
          {matches.length > 0 && (
            <div className="text-sm">
              <p className="mb-1 px-2 text-bone/70">A few legends match:</p>
              <div className="flex flex-wrap gap-1">
                {matches.map((legend) => (
                  <button
                    key={legend.id}
                    type="button"
                    onClick={() => visit(legend.id, "search")}
                    disabled={loading}
                    className="rounded-full border border-rust/60 bg-tar/80 px-3 py-1 text-bone transition duration-200 hover:border-amber hover:shadow-[0_0_12px_rgba(242,169,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
                  >
                    {legend.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && loadingFrom === "search" && <PhoneLoadingStatus />}
        </form>

        {/* AI Tour Planner: shows the narrator picked above instead of a second picker */}
        <TourPlanner narrator={narrators.find((narrator) => narrator.id === persona) ?? narrators[0]} />

        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-2 px-2 font-sign text-sm uppercase tracking-widest text-amber">{group}</h2>
            <ul className="flex flex-col gap-2">
              {tour
                .filter((legend) => legend.group === group)
                .map((legend) => (
                  <li key={legend.id}>
                    <button
                      onClick={() => visit(legend.id, "list")}
                      disabled={loading}
                      className={`w-full rounded-2xl border px-4 py-2 text-left transition duration-200 ease-out hover:border-amber hover:shadow-[0_0_16px_rgba(242,169,59,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:shadow-[0_0_16px_rgba(242,169,59,0.45)] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none ${
                        legend.id === selectedId ? "border-blood bg-blood text-bone" : "border-rust/60 bg-tar/80 text-bone"
                      }`}
                    >
                      {legend.name}
                      {/* Tagline always visible under the name (every screen size), so nothing pops up or overlaps */}
                      <span className="block text-xs text-bone/60">{legend.tagline}</span>
                    </button>
                    {loading && loadingFrom === "list" && legend.id === selectedId && (
                      <div className="mt-2">
                        <PhoneLoadingStatus />
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </nav>

      {/* Tour stop card */}
      {/* On phones, the intro panel moves above the legend list; cards stay below it */}
      <section className={`min-h-64 ${!selectedId ? "order-first md:order-none" : ""}`}>
        {!selectedId && <IntroPanel />}
        {/* Loading overlay (tablet/desktop only; phones get PhoneLoadingStatus where they tapped):
            fixed and vertically centered over a dimmed page, visible wherever you've scrolled */}
        {loading && (
          <div role="status" aria-live="polite" className="fixed inset-0 z-[1000] hidden bg-tar/30 md:block">
            {/* Only over the card column, matching the page layout
                (side gap + 1.5rem padding + 16rem list + 2rem gap), so it never covers the legend list */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center px-6 md:left-[calc((100vw-min(100vw,64rem))/2+19.5rem)] md:right-[calc((100vw-min(100vw,64rem))/2+1.5rem)]">
              {/* Soft dark glow behind the letters (a filter, so it doesn't fight the pulse's red glow) */}
              <p className="eerie-pulse text-center font-display text-4xl tracking-wide text-blood drop-shadow-[0_0_10px_rgba(0,0,0,0.95)] lg:text-5xl">
                {WARMING_UP}
              </p>
            </div>
          </div>
        )}
        {stop && (
          <div ref={cardRef} className="scroll-mt-4">
            <TourStopCard stop={stop} />
          </div>
        )}
      </section>
    </div>
  );
}
