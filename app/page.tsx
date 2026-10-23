// Server component: builds the roster list on the server, so no roster or Wikidata code reaches the browser.
import { ROSTER } from "@/lib/roster";
import TourGuide, { type TourName } from "./TourGuide";

export default function Home() {
  // Test-only entries (Elvira) are for guardrail tests, not the public tour
  const tour: TourName[] = ROSTER.filter((legend) => !legend.testOnly).map(({ id, name, group }) => ({ id, name, group }));
  // Living test names go to the search box only, so it can reject them before any API call
  const living = ROSTER.filter((legend) => legend.testOnly).map(({ id, name }) => ({ id, name }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Haunted Hearse Tour</h1>
      <TourGuide tour={tour} living={living} />
    </main>
  );
}
