# Prompt Log — Haunted Hearse Tour (W6)

### Wed Oct 21 — Scope decision + project setup
**Tool:** HQ chat (Claude)
**Prompt:** Pressure-test the W6 plan against the spec; riskiest piece + cut order.
**Why:** Lock scope before writing code.
**Result:** Wikidata = riskiest piece (name matching, coordinates two hops away, living-person guard depends on it). CRUD + Prisma/Neon parked until core works. Fallback demo must keep the search box (bad-input guard surface).
**Commit:**
**Mistake caught:** AI gave placeholder paths (`~/path/to/your/projects`) that got pasted literally. Terminal errors (`cd: too many arguments`, `mv: No such file`) caught it; no damage.

### Wed Oct 21 — Phase 1 plan (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan mode. Don't write any code yet.

Read CLAUDE.md and AGENTS.md first.

Project: Haunted Hearse Tour. User clicks or searches a horror legend's
name → a back-end route pulls their burial facts from Wikidata → an AI
tour guide writes a short campy narration from ONLY those facts → a pin
drops on a map.

Phase 1 (must ship, checkpoint Thursday 3 PM):
1. Program AI key in .env.local; confirm it's git-ignored.
2. Back-end route: query Wikidata for one name (Bela Lugosi) and return
   burial place, cemetery coordinates, birth and death dates.
3. Back-end AI route: system prompt in code, input length cap, max
   output tokens, token usage logged.
4. Guardrails:
   - Bad input: empty, too long, gibberish, or a living person (no death
     date in Wikidata) rejected before any AI call.
   - Bad output: check the narration exists and matches the expected shape.
   - Failure: try/catch, timeout on BOTH Wikidata and AI calls, a friendly
     message on 429.
   - Fallback: if AI is down, still show Wikidata facts + map pin.
5. UI: a plain list of 20 names + a search box, a tour stop card labeled
   "Facts from Wikidata · Narration by AI".
6. Map pin with Leaflet + OpenStreetMap.

Phase 2 (only if Phase 1 is done by the checkpoint): save a tour route
with CRUD using Prisma + Neon.
Phase 3 (last): animated marquee + grindhouse styling.

Give me:
- Numbered steps small enough that I can test and commit each one
- Which files each step touches
- What "done" looks like for each step
- The riskiest step and how we'll test it
- Anything in this plan that won't work, or that you'd change

Ask me questions before assuming anything.
```
**Why:** Break Phase 1 into small steps I can test and commit, before any code.
**Result:**
- 7-step plan approved; decisions: Claude, my own 20 names saved by Wikidata ID, AI route takes an ID only.
- Riskiest part: Wikidata (name matching, cremated stars with no pin).
- `.env.local` confirmed git-ignored by the `.env*` rule.
**Commit:**
**Mistake caught:** "Gibberish" had no concrete rule; now defined as failing the character check or no human match on Wikidata.

### Wed Oct 21 — Step 1b: Roster check (live Wikidata lookup)
**Tool:** Claude Code
**Prompt:**
```
Use this exact roster:
LA Legends: Bela Lugosi, Peter Lorre, Maila Nurmi, Lon Chaney (Sr., 1883-1930),
James Whale, Tod Browning, Carl Laemmle, Tor Johnson, Glenn Strange, Vincent Price
Beyond LA: Edgar Allan Poe, Mary Shelley, H.P. Lovecraft, Washington Irving,
Harry Houdini, Rod Serling, Anne Rice, Bram Stoker, Boris Karloff, Claude Rains

Keep Vincent Price, Boris Karloff, and Bram Stoker even with no grave or
coordinates. They're planned demo cases for the "no burial site" fallback.

Look up every Wikidata ID live, not from memory. Add a step in the plan
that shows me a table: name, ID, birth-death years, burial place,
has coordinates (yes/no). I'll spot-check before we save them.
```
**Why:** Get real Wikidata IDs for all 20 names before any code depends on them.
**Result:**
- All 20 IDs found live; table shown in chat, nothing saved to the repo yet.
- Price and Karloff have no burial place; Stoker has coordinates (crematorium); Serling's "burial place" is New York State.
- Wikidata returned a 429 mid-lookup, so the app needs that guard too.
**Commit:**
**Mistake caught:** Plan's Lugosi ID (Q102054) was from AI memory and wrong; real ID is Q34529 (Holy Cross Cemetery).

### Thu Oct 22 — Step 1: API key safety check (no code changes)
**Tool:** Terminal (git) + Claude Code (logging only)
**Prompt:**
```
Log two checks I ran in the terminal (no code changes):
1. git check-ignore .env.local → printed .env.local, key is ignored
2. git log -S "sk-ant" --oneline → no output, key never committed.
   I ran this after yesterday's messy session where you did uncommitted
   work and caught it yourself. Log that as "Mistake caught."
```
**Why:** Prove the API key is git-ignored and was never committed before any step uses it.
**Result:**
- `git check-ignore .env.local` printed `.env.local`, so git ignores the key file.
- `git log -S "sk-ant" --oneline` printed nothing, so no commit ever contained the key.
**Commit:**
**Mistake caught:** Yesterday's session left uncommitted work from Claude Code, which was caught afterward; these checks confirmed the key never reached git history.

### Thu Oct 22 — Step 2: Wikidata route for Bela Lugosi
**Tool:** Claude Code (plan mode, then edit)
**Prompt:**
```
Read CLAUDE.md first. Goal: one back-end route that calls Wikidata for
Bela Lugosi and returns his burial place, coordinates, and birth/death
dates as JSON. Plan only. Wait for my approval.
```
**Why:** Get real burial facts from Wikidata first, since the AI narration and map pin will be built on them.
**Result:**
- New `lib/wikidata.ts` (one SPARQL query, 8s timeout, 429 message, User-Agent) and `app/api/legend/route.ts`.
- `/api/legend` returns Lugosi: 1882-10-20 to 1956-08-16, Holy Cross Cemetery, lat 33.991649 / lon -118.387096.
**Commit:**
**Mistake caught:** Wikidata gives coordinates as `Point(lon lat)` (longitude first); the code swaps them so the pin won't land in the wrong place.

### Thu Oct 22 — Step 2b: Move and rename image assets
**Tool:** Claude Code
**Prompt:**
```
Check where my images are. Make sure they're all in public/images/ and
rename them with git mv to: hearse.png, tombstone-frame.png, map-pin.png,
background.png, billboard.png, header-overlay.svg. Leave Next's default
SVGs (file, globe, next, vercel, window) in public/. Show me the list
before and after. Then append a log entry.
```
**Why:** Short names with no spaces are easier to use in code; one folder keeps my own assets apart from Next's defaults.
**Result:**
- 6 files moved into `public/images/` with `git mv`, so git shows them as renames and keeps their history.
- Next's 5 default SVGs stay in `public/`; no code referenced the old names, so nothing else changed.
**Commit:**
**Mistake caught:**
