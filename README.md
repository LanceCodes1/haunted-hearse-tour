# Haunted Hearse Tour

*Before Freddy, Jason, and Chucky, these are the people who invented the monsters. Hop in.*

**Live demo:** [haunted-hearse-tour.vercel.app](https://haunted-hearse-tour.vercel.app)

## What it is

A campy, grindhouse-style roadside attraction on the web. Pick one of 20 horror legends (Bela Lugosi, Mary Shelley,
Vincent Price, Edgar Allan Poe…) or search a name. The hearse "pulls up" to their resting place:

- **Facts from Wikidata:** name, birth and death dates, burial place, and a map pin on the grave.
- **Narration by AI:** a short story that celebrates their work, told by the narrator you pick:
  **Campy Mortimer** (the gravel-voiced driver), the **Scholarly Historian**, or the **Kid-Friendly** Night Guide.
  The narrator changes only the voice; the facts and rules are the same for all three.
- **Plan a tour:** describe the tour you want ("Universal Classics", "Horror Writers"), and the AI picks up to 6 legends
  from the roster. **Save** it to get a share link (`/tour/<id>`) anyone can open. Only the browser that saved a tour
  sees its **Delete** button.

Every tour stop is labeled **"Facts from Wikidata · Narration by AI"**, and the two are kept visibly separate.
Planned routes are labeled **"Route picked by AI from our roster."**

## How it works

```
browser → my server → Wikidata → Claude → my server → screen
```

1. You click a legend (or search one). The browser only ever calls **my own server** (`/api/narrate?id=…&persona=…`).
2. The server checks the ID is on the tour, then asks **Wikidata** for the facts (dates, burial place, coordinates).
3. The server sends **only those facts** to **Claude** to write the narration. The API key never leaves the server.
4. The server sends facts + narration back to the screen, and the map shows the pin (map tiles from OpenStreetMap).

Wikidata is the **only** source of facts. The AI writes the narration from those facts and is told never to invent any.

**Planning and saving a tour:**

1. The planner sends your wish to `/api/plan`. Claude sees only the 20 public legends and can only answer with their IDs.
2. **Save** sends the route and your narrator to `/api/tours`, which stores it in **Postgres** and returns a share link
   plus a one-time **delete code**. The code stays in your browser; the database keeps only its fingerprint (a SHA-256 hash).
3. The share page `/tour/<id>` reads the tour from the database on every visit and narrates each stop in the saved voice.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Anthropic SDK** (`@anthropic-ai/sdk`) with **Claude Haiku 5.5** for narration and tour planning
- **Postgres on Neon** + **Prisma 7.10.1** for saved tours
- **Wikidata** SPARQL endpoint for facts
- **Leaflet** + **OpenStreetMap** tiles for the map (loaded in the browser only)
- Fonts: Creepster, Special Elite, Geist (via `next/font/google`)

## Setup

1. Install packages (this also generates the Prisma client into `lib/generated/prisma`):
   ```bash
   npm install
   ```
2. Create a file named `.env.local` in the project folder with these three variables:
   ```
   ANTHROPIC_API_KEY=your-anthropic-key
   DATABASE_URL=your-neon-direct-connection-string
   DATABASE_URL_POOLED=your-neon-pooled-connection-string
   ```
   - `ANTHROPIC_API_KEY`: narration and tour planning.
   - `DATABASE_URL`: Neon's **direct** connection, used by Prisma migrations.
   - `DATABASE_URL_POOLED`: Neon's **pooled** connection, used by the app while it runs.

   `.env.local` is git-ignored, so keys are never committed. Never put a key in front-end code.
3. Create the database table:
   ```bash
   npx prisma migrate dev      # local: applies migrations (and creates new ones after a schema change)
   npx prisma migrate deploy   # production: applies existing migrations only
   ```
   Optional: `npx prisma studio` opens a browser view of the saved tours.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

On Vercel, add the same three variables under **Settings → Environment Variables** (Production and Preview).

## Guardrails

**Bad input** (rejected before any API call):
- Empty search, over 60 characters, or no letters at all ("gibberish")
- A name that isn't on the tour → "That legend isn't on our tour."
- A living person (test case: Cassandra Peterson / Elvira) → "No tombstones for the living."
  The server checks again with Wikidata's death date, so calling the URL directly can't skip it.
- Tour planner: empty, over 300 characters, or no letters → rejected before the AI is called.
- Unknown narrator in the URL → falls back to Mortimer (the narrate route) or is rejected (saving a tour).

**Bad output:**
- The AI must return exactly a `title` and a `text` (structured JSON), finish normally (not cut off or refused),
  and stay under 80 words. Otherwise the narration is dropped.
- The planner's answer can only contain roster IDs (enforced by the JSON schema), and the server still drops unknown IDs,
  removes repeats, caps the route at 6, and re-checks it with the same rules used for saving. Nothing fits → a friendly 422.
- No burial place on Wikidata → "This legend's resting place is unknown, or their ashes were scattered." and no map.
- A burial "place" that's a region, not a cemetery (Rod Serling: "New York") → the fact is shown, but no misleading pin.

**Saved tours:**
- Every tour is validated on the server: name 1–60 characters, 1–6 legends from the public roster, no repeats.
- Share IDs are 8 random characters. Delete codes are 16 random bytes, stored only as a SHA-256 hash and compared in
  constant time. The code travels in a request header, never in the URL.

**Failure and slowness:**
- Timeouts: **8 seconds** for Wikidata, **10 seconds** for each AI call (with automatic retries turned off, so 10 really means 10).
- Rate limited (429) → "The hearse is stuck in traffic, try again in a moment."
- AI down → you still get the Wikidata facts and the map, plus "Our tour guide lost their voice."
- Database down → "The crypt is locked right now. Try again in a moment."
- Raw errors go to the server log only; visitors see plain-language messages.

**Cost cap:**
- Facts sent to the AI are capped at 1,000 characters; the narration answer is capped at 400 tokens.
- Planner wishes are capped at 300 characters; the planner's answer is capped at 300 tokens.
- Every AI call logs its token usage and estimated cost to the terminal.

## Cost

- **Narration:** about **$0.0002 per tour stop** (≈ 900 tokens in, ≈ 180 tokens out at Haiku 5.5 prices of
  $0.10 / $0.50 per million tokens), or roughly **$0.19 per 1,000 stops**.
- **Tour planner:** about **$0.00015 per plan** (≈ 1,300 tokens in, ≈ 50 out), or roughly **$0.15 per 1,000 plans**.
- Wikidata and OpenStreetMap are free; Neon's free tier covers the saved tours.

## Where AI is used in the app

- **Narration** is written live by **Claude Haiku 5.5**, from Wikidata facts only.
- **Tour planning** is done live by **Claude Haiku 5.5**, choosing only from the 20-legend roster.
- **Legend taglines** (the ghost tooltips) are **AI-drafted copy, cross-checked by hand**. They are not Wikidata facts.

## How this was built

I built this with Claude Code as my coding agent, and I stayed in the driver’s seat the whole way. I set the scope, approved every change before it was saved, ran every test myself, and wrote the rules it had to follow in CLAUDE.md. When I didn’t understand something, I took the code to a separate Claude chat and asked questions until I could explain it in my own words. Then I came back and kept building. I verified with curl tests, browser tests, and by reading the SQL my database migrations generated. A few catches I’m proud of: the first Vercel build failed because my env vars never saved, and I traced it from the build log; I accidentally exposed an API key and rotated it the same day; and I tried to trick my own planner into adding Elvis, and it refused. Every step, what I checked, and every mistake I caught lives in prompt-log.md.

## Credits

- **[Wikidata](https://www.wikidata.org/)**: all facts (dates, burial places, coordinates), under CC0.
- **[OpenStreetMap](https://www.openstreetmap.org/copyright)**: map tiles, © OpenStreetMap contributors.
- **[Leaflet](https://leafletjs.com/)**: the map library.

## Parked

The full list is in [`parked.md`](parked.md). Next up (Should):

- **Click-to-explore map:** the map stays still until you click it
- **My Tours list:** the tours this browser created
- **Flickering back-arrow** by the site title, and **longer blood drips** in the header

Later: searching any legend beyond the 20, a notable-work field from Wikidata, caching Wikidata answers and narrations,
an editable tour name, and per-IP rate limiting.
