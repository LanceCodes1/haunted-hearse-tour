// Back end only: the tour roster, the ONLY list of legends the routes will look up.
import { getBurialFacts, WikidataError, type BurialFacts } from "@/lib/wikidata";

export type Legend = {
  id: string; // Wikidata ID, checked live on 2026-10-22
  name: string;
  group: "LA Legends" | "Beyond LA";
  testOnly?: true; // used for guardrail tests, hidden from the tour list
  burialIsRegion?: true; // Wikidata lists a region, not a cemetery, so no map pin
};

export const ROSTER: Legend[] = [
  { id: "Q34529", name: "Bela Lugosi", group: "LA Legends" },
  { id: "Q78505", name: "Peter Lorre", group: "LA Legends" },
  { id: "Q237813", name: "Maila Nurmi", group: "LA Legends" },
  { id: "Q312656", name: "Lon Chaney", group: "LA Legends" }, // Sr., 1883–1930
  { id: "Q381831", name: "James Whale", group: "LA Legends" },
  { id: "Q51476", name: "Tod Browning", group: "LA Legends" },
  { id: "Q61074", name: "Carl Laemmle", group: "LA Legends" },
  { id: "Q1351410", name: "Tor Johnson", group: "LA Legends" },
  { id: "Q1368948", name: "Glenn Strange", group: "LA Legends" },
  { id: "Q219640", name: "Vincent Price", group: "LA Legends" }, // no burial place: fallback demo
  { id: "Q16867", name: "Edgar Allan Poe", group: "Beyond LA" },
  { id: "Q47152", name: "Mary Shelley", group: "Beyond LA" },
  { id: "Q169566", name: "H.P. Lovecraft", group: "Beyond LA" },
  { id: "Q181667", name: "Washington Irving", group: "Beyond LA" },
  { id: "Q131545", name: "Harry Houdini", group: "Beyond LA" },
  { id: "Q435920", name: "Rod Serling", group: "Beyond LA", burialIsRegion: true }, // Wikidata says "New York" (the state)
  { id: "Q184785", name: "Anne Rice", group: "Beyond LA" },
  { id: "Q36184", name: "Bram Stoker", group: "Beyond LA" }, // a crematorium, not a grave
  { id: "Q203219", name: "Boris Karloff", group: "Beyond LA" }, // no burial place: fallback demo
  { id: "Q318734", name: "Claude Rains", group: "Beyond LA" },
  { id: "Q253942", name: "Cassandra Peterson (Elvira)", group: "LA Legends", testOnly: true }, // living: must be rejected
];

const REGION_MESSAGE = "Wikidata only records the state, not the cemetery, so there's no pin for this stop.";

// Shared by /api/legend and /api/narrate: roster check → Wikidata → living check → region fix
export async function getRosterFacts(id: string | null): Promise<BurialFacts> {
  // Bad input: reject before calling anything
  if (!id) throw new WikidataError(400, "Pick a legend from the tour.");
  const legend = ROSTER.find((entry) => entry.id === id);
  if (!legend) throw new WikidataError(400, "That legend isn't on our tour.");

  const facts = await getBurialFacts(legend.id);

  // Living-person guard: no death date means no tour stop (and no AI call)
  if (!facts.died) throw new WikidataError(400, "No tombstones for the living.");

  // A region isn't a grave: keep the fact, drop the misleading map pin
  if (legend.burialIsRegion) return { ...facts, coordinates: null, message: REGION_MESSAGE };

  return facts;
}
