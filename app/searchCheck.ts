// Front end: search-box input checks. They all run BEFORE any API call.
import type { TourName } from "./TourGuide";

export type LivingName = { id: string; name: string };

export type SearchResult = { open: string } | { matches: TourName[] } | { message: string };

const MAX_LENGTH = 60; // longer than any real name on the tour

// Lowercase, drop periods, squeeze spaces, so "hp  LOVECRAFT" matches "H.P. Lovecraft"
function normalize(text: string): string {
  return text.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

export function checkSearch(input: string, tour: TourName[], living: LivingName[]): SearchResult {
  const query = input.trim();

  // Bad input checks, in order
  if (!query) return { message: "Type a legend's name first." };
  if (query.length > MAX_LENGTH) return { message: "That's too long for a tombstone. Keep it under 60 characters." };
  if (!/\p{L}/u.test(query)) return { message: "That doesn't look like a name. Try letters." }; // no letters at all = gibberish

  // Partial, case-insensitive match against the tour and the living test names
  const q = normalize(query);
  const matches = tour.filter((legend) => normalize(legend.name).includes(q));
  const livingMatch = living.some((person) => normalize(person.name).includes(q));

  // Living-person guard: only when the name matches a living person and no legend
  // (so "peter" still finds Peter Lorre, but "peterson" or "elvira" is rejected)
  if (matches.length === 0 && livingMatch) return { message: "No tombstones for the living." };

  if (matches.length === 0) return { message: "That legend isn't on our tour." };
  if (matches.length === 1) return { open: matches[0].id };
  return { matches }; // several legends match: let the user pick
}
