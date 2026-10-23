// Back end only: the tour roster, the ONLY list of legends the routes will look up.
import { getBurialFacts, WikidataError, type BurialFacts } from "@/lib/wikidata";

export type Legend = {
  id: string; // Wikidata ID, checked live on 2026-10-22
  name: string;
  group: "LA Legends" | "Beyond LA";
  testOnly?: true; // used for guardrail tests, hidden from the tour list
  burialIsRegion?: true; // Wikidata lists a region, not a cemetery, so no map pin
  tagline?: string; // AI-drafted one-liner, cross-checked by hand (not a Wikidata fact)
};

export const ROSTER: Legend[] = [
  { id: "Q34529", name: "Bela Lugosi", group: "LA Legends", tagline: "The iconic screen Dracula, cape and all." },
  { id: "Q78505", name: "Peter Lorre", group: "LA Legends", tagline: "Hollywood's most unsettling wide-eyed villain, star of M." },
  { id: "Q237813", name: "Maila Nurmi", group: "LA Legends", tagline: "Vampira, television's first horror host." },
  { id: "Q312656", name: "Lon Chaney", group: "LA Legends", tagline: "The Man of a Thousand Faces, the original Phantom of the Opera." }, // Sr., 1883–1930
  { id: "Q381831", name: "James Whale", group: "LA Legends", tagline: "The director who brought Frankenstein's monster to life." },
  { id: "Q51476", name: "Tod Browning", group: "LA Legends", tagline: "Director of Dracula and the cult classic Freaks." },
  { id: "Q61074", name: "Carl Laemmle", group: "LA Legends", tagline: "Founder of Universal Pictures, home of the classic monsters." },
  { id: "Q1351410", name: "Tor Johnson", group: "LA Legends", tagline: "The hulking wrestler-turned-actor of Plan 9 from Outer Space." },
  { id: "Q1368948", name: "Glenn Strange", group: "LA Legends", tagline: "Frankenstein's monster in Universal's later monster rallies." },
  { id: "Q219640", name: "Vincent Price", group: "LA Legends", tagline: "The velvet-voiced master of House on Haunted Hill." }, // no burial place: fallback demo
  { id: "Q16867", name: "Edgar Allan Poe", group: "Beyond LA", tagline: "The poet of The Raven and master of the macabre." },
  { id: "Q47152", name: "Mary Shelley", group: "Beyond LA", tagline: "The author who created Frankenstein." },
  { id: "Q169566", name: "H.P. Lovecraft", group: "Beyond LA", tagline: "Creator of Cthulhu and cosmic horror." },
  { id: "Q181667", name: "Washington Irving", group: "Beyond LA", tagline: "Author of The Legend of Sleepy Hollow and its Headless Horseman." },
  { id: "Q131545", name: "Harry Houdini", group: "Beyond LA", tagline: "The escape artist who exposed fake spirit mediums." },
  { id: "Q435920", name: "Rod Serling", group: "Beyond LA", tagline: "Creator and host of The Twilight Zone.", burialIsRegion: true }, // Wikidata says "New York" (the state)
  { id: "Q184785", name: "Anne Rice", group: "Beyond LA", tagline: "Author of Interview with the Vampire." },
  { id: "Q36184", name: "Bram Stoker", group: "Beyond LA", tagline: "The author who unleashed Dracula." }, // a crematorium, not a grave
  { id: "Q203219", name: "Boris Karloff", group: "Beyond LA", tagline: "Universal's Frankenstein monster and the original Mummy." }, // no burial place: fallback demo
  { id: "Q318734", name: "Claude Rains", group: "Beyond LA", tagline: "The Invisible Man himself." },
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
