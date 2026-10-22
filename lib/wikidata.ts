// Back end only: fetches burial facts from Wikidata, our ONLY source of facts.

const SPARQL_URL = "https://query.wikidata.org/sparql";
const USER_AGENT = "HauntedHearseTour/0.1 (https://github.com/LanceCodes1/haunted-hearse-tour)"; // Wikimedia asks every caller to identify itself
const TIMEOUT_MS = 8000; // give up on Wikidata after 8 seconds

export const NO_BURIAL_MESSAGE =
  "This legend's resting place is unknown, or their ashes were scattered.";

export type BurialFacts = {
  id: string;
  name: string;
  born: string | null;
  died: string | null;
  burialPlace: string | null;
  coordinates: { lat: number; lon: number } | null;
  source: "Wikidata";
  message?: string;
};

// A failure with an HTTP status and a plain-language message that is safe to show users
export class WikidataError extends Error {
  constructor(public status: number, public userMessage: string, cause?: unknown) {
    super(userMessage, { cause });
  }
}

type Binding = Record<string, { value: string } | undefined>;

// Wikidata dates look like "1882-10-20T00:00:00Z"; keep just the date part
function toDate(value?: string): string | null {
  return value ? value.slice(0, 10) : null;
}

// Wikidata gives "Point(lon lat)", longitude FIRST, so we swap it into {lat, lon}
function toCoordinates(value?: string): { lat: number; lon: number } | null {
  const match = value?.match(/^Point\(([-\d.]+) ([-\d.]+)\)$/);
  if (!match) return null;
  return { lat: Number(match[2]), lon: Number(match[1]) };
}

export async function getBurialFacts(id: string): Promise<BurialFacts> {
  // Only allow real Wikidata IDs like "Q34529", so nothing else gets pasted into the query
  if (!/^Q\d+$/.test(id)) throw new WikidataError(400, "That isn't a valid legend ID.");

  // One query: birth (P569), death (P570), burial place (P119), and the burial place's coordinates (P625)
  const query = `
    SELECT ?personLabel ?birth ?death ?burialLabel ?coords WHERE {
      BIND(wd:${id} AS ?person)
      ?person wdt:P31 wd:Q5 .
      OPTIONAL { ?person wdt:P569 ?birth }
      OPTIONAL { ?person wdt:P570 ?death }
      OPTIONAL { ?person wdt:P119 ?burial . OPTIONAL { ?burial wdt:P625 ?coords } }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;

  let res: Response;
  try {
    res = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS), // stop waiting after 8 seconds
    });
  } catch (err) {
    // A timeout and a network failure both land here; the user only sees the friendly message
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new WikidataError(504, "Wikidata is taking too long to answer. Try again in a moment.", err);
    }
    throw new WikidataError(502, "We couldn't reach Wikidata right now. Try again soon.", err);
  }

  // Rate limited: the spec's exact wording
  if (res.status === 429) {
    throw new WikidataError(429, "The hearse is stuck in traffic, try again in a moment.");
  }
  if (!res.ok) {
    throw new WikidataError(502, "Wikidata sent back an error. Try again soon.", `HTTP ${res.status}`);
  }

  // Bad output check: the response must have the shape we expect
  let row: Binding | undefined;
  try {
    const data = await res.json();
    row = data?.results?.bindings?.[0];
  } catch (err) {
    throw new WikidataError(502, "Wikidata sent back something we couldn't read.", err);
  }
  if (!row?.personLabel?.value) {
    throw new WikidataError(404, "We couldn't find that legend on Wikidata.");
  }

  const burialPlace = row.burialLabel?.value ?? null;
  const facts: BurialFacts = {
    id,
    name: row.personLabel.value,
    born: toDate(row.birth?.value),
    died: toDate(row.death?.value),
    burialPlace,
    coordinates: toCoordinates(row.coords?.value),
    source: "Wikidata",
  };

  // Fallback: no burial place on record (e.g. cremated, ashes scattered)
  if (!burialPlace) facts.message = NO_BURIAL_MESSAGE;
  return facts;
}
