# Haunted Hearse Tour

*Before Freddy, Jason, and Chucky, these are the people who invented the monsters. Hop in.*

## What it is

A campy, grindhouse-style roadside attraction on the web. Pick one of 20 horror legends (Bela Lugosi, Mary Shelley,
Vincent Price, Edgar Allan Poe…) or search a name. The hearse "pulls up" to their resting place:

- **Facts from Wikidata:** name, birth and death dates, burial place, and a map pin on the grave.
- **Narration by AI:** Mortimer Graves, our gravel-voiced driver, tells a short, campy story that celebrates their work.

Every tour stop is labeled **"Facts from Wikidata · Narration by AI"**, and the two are kept visibly separate.

## How it works

```
browser → my server → Wikidata → Claude → my server → screen
```

1. You click a legend (or search one). The browser only ever calls **my own server** (`/api/narrate?id=…`).
2. The server checks the ID is on the tour, then asks **Wikidata** for the facts (dates, burial place, coordinates).
3. The server sends **only those facts** to **Claude** to write the narration. The API key never leaves the server.
4. The server sends facts + narration back to the screen, and the map shows the pin (map tiles from OpenStreetMap).

Wikidata is the **only** source of facts. The AI writes the narration from those facts and is told never to invent any.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Anthropic SDK** (`@anthropic-ai/sdk`) with **Claude Haiku 5.5** for narration
- **Wikidata** SPARQL endpoint for facts
- **Leaflet** + **OpenStreetMap** tiles for the map
- Fonts: Creepster, Special Elite, Geist (via `next/font/google`)
- No database (yet)

## Setup

1. Install packages:
   ```bash
   npm install
   ```
2. Create a file named `.env.local` in the project folder with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```
   `.env.local` is git-ignored, so the key is never committed. Never put the key in front-end code.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Guardrails

**Bad input** (rejected before any API call):
- Empty search, over 60 characters, or no letters at all ("gibberish")
- A name that isn't on the tour → "That legend isn't on our tour."
- A living person (test case: Cassandra Peterson / Elvira) → "No tombstones for the living."
  The server checks again with Wikidata's death date, so calling the URL directly can't skip it.

**Bad output:**
- The AI must return exactly a `title` and a `text` (structured JSON), finish normally (not cut off or refused),
  and stay within length limits. Otherwise the narration is dropped.
- No burial place on Wikidata → "This legend's resting place is unknown, or their ashes were scattered." and no map.
- A burial "place" that's a region, not a cemetery (Rod Serling: "New York") → the fact is shown, but no misleading pin.

**Failure and slowness:**
- Timeouts: **8 seconds** for Wikidata, **10 seconds** for the AI (with automatic retries turned off, so 10 really means 10).
- Rate limited (429) → "The hearse is stuck in traffic, try again in a moment."
- AI down → you still get the Wikidata facts and the map, plus "Our tour guide lost their voice."
- Raw errors go to the server log only; visitors see plain-language messages.

**Cost cap:**
- Facts sent to the AI are capped at 1,000 characters; the AI's answer is capped at 400 tokens.
- Every AI call logs its token usage and estimated cost to the terminal.

## Cost

About **$0.0002 per narration** (≈ 900 tokens in, ≈ 180 tokens out at Haiku 5.5 prices of $0.10 / $0.50 per million tokens),
or roughly **$0.19 per 1,000 tour stops**. Wikidata and OpenStreetMap are free.

## Where AI was used

- **Building it:** the code was written step by step with **Claude Code**, with me planning, reviewing, testing, and committing each step.
  Every prompt is logged in [`prompt-log.md`](prompt-log.md).
- **In the app:** the narration is written live by **Claude Haiku 5.5**, from Wikidata facts only.
- **Legend taglines** (the ghost tooltips) are **AI-drafted copy, cross-checked by hand**. They are not Wikidata facts.

## Credits

- **[Wikidata](https://www.wikidata.org/)**: all facts (dates, burial places, coordinates), under CC0.
- **[OpenStreetMap](https://www.openstreetmap.org/copyright)**: map tiles, © OpenStreetMap contributors.
- **[Leaflet](https://leafletjs.com/)**: the map library.

## Parked for W7

The full list is in [`parked.md`](parked.md). Highlights:

- **Save a tour route** (Phase 2 CRUD with Prisma + Neon)
- **Search any legend**, not just the 20, which needs Wikidata name search, wrong-person handling, and a general "is this really a cemetery?" check
- **Notable-work field from Wikidata**, so the narrator's one named work comes from Wikidata too
- **Caching** Wikidata answers and narrations so repeat visits are faster and free
- A tighter narrator example, a smaller map-pin image, and the `npm audit` warnings in the ESLint tooling
