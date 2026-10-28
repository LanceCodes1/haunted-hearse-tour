"use client";
// Front end: a saved tour's stop list. Clicking a stop asks our /api/narrate route in the tour's saved narrator voice.
// The creator's browser also gets a Delete button.
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Persona } from "@/lib/generated/prisma/enums";
import TourStopCard, { type TourStop } from "../../TourStopCard";
import { forgetDeleteCode, getDeleteCode } from "../../tourCodes";

type Stop = { id: string; name: string };

// The code list doesn't change by itself while this page is open, so there's nothing to listen for
const noSubscribe = () => () => {};

export default function TourStops({
  tourId,
  name,
  persona,
  narratorLabel,
  stops,
}: {
  tourId: string;
  name: string;
  persona: Persona;
  narratorLabel: string;
  stops: Stop[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stop, setStop] = useState<TourStop | null>(null);
  const [loading, setLoading] = useState(false);
  // Server render: null (no localStorage there), so no button. In the browser: the code, only if this browser created the tour.
  const deleteCode = useSyncExternalStore(noSubscribe, () => getDeleteCode(tourId), () => null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function deleteTour() {
    if (!deleteCode || deleting) return; // a double click can't send two deletes
    setDeleting(true);
    setDeleteError(null);
    try {
      // The code goes in a header, not the URL, so it never lands in browser history or server logs
      const res = await fetch(`/api/tours/${encodeURIComponent(tourId)}`, {
        method: "DELETE",
        headers: { "x-delete-code": deleteCode },
      });
      // 404 means it's already gone (say, deleted in another tab), which is what the creator wanted anyway
      if (res.ok || res.status === 404) {
        forgetDeleteCode(tourId);
        setDeleted(true);
        return;
      }
      const data = await res.json();
      setDeleteError(data.error ?? "The crypt is locked right now. Try again in a moment."); // e.g. 403 or database down
    } catch {
      setDeleteError("The hearse broke down. Try again in a moment."); // network failure or a non-JSON reply
    } finally {
      setDeleting(false);
    }
  }

  // After a delete, the stop list is replaced; reloading this page would show the "vanished" page
  if (deleted) {
    return (
      <article className="mx-auto max-w-xl rounded-2xl border border-rust/60 bg-tar/90 p-6 text-center text-bone shadow-[0_0_40px_rgba(168,18,31,0.25)]">
        <h2 className="font-display text-3xl tracking-wide text-blood">Tour deleted.</h2>
        <p className="mt-2 text-bone/80">Its share link now leads into the fog.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-blood px-4 py-2 font-sign text-bone transition duration-200 hover:shadow-[0_0_16px_rgba(168,18,31,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
        >
          Plan a new tour
        </Link>
      </article>
    );
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

        {/* Creator only: shown when this browser holds the tour's delete code. Two clicks, no pop-up. */}
        {deleteCode && (
          <div className="mt-2 rounded-2xl border border-blood/60 bg-tar/80 p-3 text-sm text-bone">
            <p className="text-xs text-bone/60">You created this tour, so only you see this.</p>
            {confirming ? (
              <>
                <p className="mt-2">Delete it for everyone? The share link will stop working.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={deleteTour}
                    disabled={deleting}
                    className="rounded-full bg-blood px-4 py-2 font-sign text-bone transition duration-200 hover:shadow-[0_0_16px_rgba(168,18,31,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60 motion-reduce:transition-none"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="rounded-full border border-rust/60 px-4 py-2 text-bone transition duration-200 hover:border-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-60 motion-reduce:transition-none"
                  >
                    Keep it
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-2 rounded-full border border-blood px-4 py-2 font-sign text-bone transition duration-200 hover:bg-blood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber motion-reduce:transition-none"
              >
                Delete tour
              </button>
            )}
            {deleteError && <p className="mt-2 text-sm italic text-amber">{deleteError}</p>}
          </div>
        )}
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
