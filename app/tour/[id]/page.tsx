// Server component: a saved tour's share page. The tour is read from Postgres on every visit, never at build time.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { PERSONAS } from "@/lib/personas";
import { ROSTER } from "@/lib/roster";
import { DB_DOWN_MESSAGE, TOUR_ID_PATTERN } from "@/lib/tours";
import TourStops from "./TourStops";

export default function TourPage({ params }: PageProps<"/tour/[id]">) {
  // The frame shows right away; the tour streams in when the database answers
  return (
    <Suspense fallback={<p className="text-center font-sign text-bone/70">Looking up your tour…</p>}>
      <SavedTour params={params} />
    </Suspense>
  );
}

async function SavedTour({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // read fresh on every visit, so a deleted tour disappears right away
  const { id } = await params;
  if (!TOUR_ID_PATTERN.test(id)) notFound(); // not shaped like one of our IDs: don't even ask the database

  let tour;
  try {
    // deleteCodeHash is never selected: the share page shows the tour, not the creator's secret
    tour = await db.tour.findUnique({ where: { id }, select: { name: true, legendIds: true, persona: true } });
  } catch (err) {
    console.error("[tour/id] Read failed:", err); // raw error goes to the terminal only
    return <p className="text-center italic text-amber">{DB_DOWN_MESSAGE}</p>;
  }
  if (!tour) notFound();

  // Names come from our roster, not the database; a legend that's no longer on the public roster is skipped
  const stops = tour.legendIds.flatMap((legendId) => {
    const legend = ROSTER.find((entry) => entry.id === legendId && !entry.testOnly);
    return legend ? [{ id: legend.id, name: legend.name }] : [];
  });

  // Only the narrator's label goes to the browser; its prompt stays on the server
  return <TourStops name={tour.name} persona={tour.persona} narratorLabel={PERSONAS[tour.persona].label} stops={stops} />;
}
