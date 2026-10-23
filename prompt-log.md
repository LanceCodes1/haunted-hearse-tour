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

### Thu Oct 22 — Step 2c: Create GitHub repo and push
**Tool:** Terminal (gh, git) + Claude Code (logging only)
**Prompt:**
```
Append a log entry: created public repo LanceCodes1/haunted-hearse-tour
with gh, pushed main over SSH, and I verified on GitHub that .env.local
is not in the repo.
```
**Why:** Put the project on GitHub so it's backed up and ready to share for the demo.
**Result:**
- Created public repo `LanceCodes1/haunted-hearse-tour` with `gh repo create`; pushed `main` over SSH, tracking `origin/main`.
- Checked on GitHub that `.env.local` is not in the repo.
**Commit:**
**Mistake caught:**

### Thu Oct 22 — Step 2d: Add repo URL to Wikidata User-Agent
**Tool:** Claude Code
**Prompt:**
```
Update the Wikidata User-Agent to:
HauntedHearseTour/0.1 (https://github.com/LanceCodes1/haunted-hearse-tour)
Change only that one line. Then append a log entry.
```
**Why:** Wikimedia asks callers for a way to contact them; the public repo URL gives one without sharing my email.
**Result:**
- One line changed in `lib/wikidata.ts`: `USER_AGENT` now includes the repo URL.
- Nothing else in the code changed.
**Commit:**
**Mistake caught:**

### Thu Oct 22 — Step 3 plan: AI narration route (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan the AI narration route. Plan only, no code yet.
- New route app/api/narrate/route.ts, Lugosi only for now (Q34529).
- Server re-fetches facts with my existing lib/wikidata.ts. The AI gets ONLY those facts.
- Anthropic SDK, model claude-haiku-5-5, key from ANTHROPIC_API_KEY. Read the current SDK docs first.
- Put the system prompt in its own file as a constant, but leave it as a placeholder. I'm writing it myself.
- Guards: max output tokens, 10-second timeout, try/catch, friendly 429 message, check the output exists and matches the shape. Log token usage (input/output) to the terminal.
- Fallback: if the AI fails, still return the Wikidata facts with narration: null.
- Ask me what shape the narration should be before deciding.
Append a log entry when the plan is approved.
```
**Why:** Plan the AI step with every guardrail before any code or API key is used.
**Result:**
- Plan approved; I chose narration shape = title + paragraph (structured JSON with `title` and `text`).
- Guards: 1,000-char input cap, `max_tokens` 400, 10s timeout with retries off, a "no tombstones for the living" check, a shape check, and a token/cost log at $0.10/$0.50 per 1M tokens.
**Commit:**
**Mistake caught:** SDK docs show Haiku 5.5 thinks by default (eats the output cap) and retries twice (a 10s timeout could become 30s); the plan turns both off.  

### Thu Oct 22 — Step 3: Build AI narration route
**Tool:** Claude Code
**Prompt:**
```
build it
```
**Why:** Build the approved Step 3 plan: facts from Wikidata, then a campy narration from Claude, with every guard in place.
**Result:**
- Installed `@anthropic-ai/sdk`; new `app/api/narrate/route.ts` and `lib/narratorPrompt.ts` (placeholder prompt, my text goes here).
- `/api/narrate` returned Lugosi facts + `narration: {title, text}`; terminal logged `tokens in=331 out=101 · est $0.000084/call · $0.084 per 1,000 calls`.
**Commit:**
**Mistake caught:** With the placeholder prompt, the AI added "Culver City, California", which isn't in the Wikidata facts. My system prompt must forbid adding anything not given.

### Thu Oct 22 — Step 3b: Add my narrator system prompt
**Tool:** Claude HQ chat drafted, I edited; Claude Code pasted it in
**Prompt:**
```
Replace the placeholder in lib/narratorPrompt.ts with my system prompt
below. If the FORMAT section conflicts with how the route checks the
title/text shape, tell me before changing anything. Append a log entry
(Tool: Claude HQ chat drafted, I edited).
```
(Followed by my full system prompt, now in `lib/narratorPrompt.ts`.)
**Why:** Give the tour guide a voice (Mortimer Graves) and rules that keep it to Wikidata facts, ending with a fixed sign-off.
**Result:**
- Placeholder replaced word for word; no code logic changed.
- No FORMAT conflict: 3–7 word title and 60–80 word text fit the route's 80-char / 1,200-char checks and the 400-token cap.
**Commit:**
**Mistake caught:** Prompt now forbids adding a city/state/country, fixing the "Culver City, California" leak from Step 3.

### Thu Oct 22 — Step 3c: Fictional example in narrator prompt
**Tool:** Claude Code
**Prompt:**
```
In lib/narratorPrompt.ts, replace the EXAMPLE with a fictional legend so
the model can't copy it for a real person. Use: facts: "Lady Ravenna
Thorne, born 1901-03-13, died 1949-10-31, buried at Blackthorn Abbey."
Write a new title and text in the same style and format. Change nothing
else. Append a log entry: mistake caught, the model copied the Lugosi
example verbatim.
```
**Why:** An example about a real legend can be copied word for word; a fictional one only teaches the style.
**Result:**
- EXAMPLE now uses Lady Ravenna Thorne: title "The Raven Queen Takes Her Rest", 65-word text ending "Keep your hands inside the hearse."
- Rest of the prompt and all route code unchanged.
**Commit:**
**Mistake caught:** The model copied the Lugosi example verbatim instead of writing its own narration.

### Thu Oct 22 — Step 3d: Famous-work exception, cost check, Parked list
**Tool:** Claude Code
**Prompt:**
```
Add one line to CLAUDE.md under Project facts: "Exception: the narrator
may mention a legend's most famous work in general terms. All burial,
date, and place facts still come only from Wikidata. Notable-work field
from Wikidata is parked for W7." Append a log entry that records: the
fictional example fixed the verbatim copy; cost ~885-910 tokens in,
~145-214 out, ~$0.0002/call, ~$0.19 per 1,000 calls. Add to Parked:
narration runs ~86 words; filler "record books go quiet" line.
```
Follow-up: "New parked.md at the repo root with all the earlier items, EXCEPT ?id= param and the card UI. Those are next up, not parked. Add a one-line header: "Ideas and fixes saved for later. Not in this week's build.""
**Why:** Write down the one allowed exception to "Wikidata only", record real cost numbers, and keep later ideas out of the code.
**Result:**
- The fictional example fixed the verbatim copy; cost per call is ~885–910 tokens in, ~145–214 out, ~$0.0002/call, ~$0.19 per 1,000 calls.
- CLAUDE.md now has the famous-work exception; new `parked.md` lists 8 items (?id= and card UI left out as next up).
**Commit:**
**Mistake caught:**

### Thu Oct 22 — Step 3e: Search-box checks moved out of Parked
**Tool:** Claude Code
**Prompt:**
```
Remove "search-box input checks" from parked.md. It's must-ship, next up
with ?id= and the card UI. Change nothing else.
```
Follow-up: "Yes, add a short new log entry: removed search-box checks from parked.md (must-ship)."
**Why:** Search-box checks (empty, too long, gibberish) are must-ship, not a later idea.
**Result:**
- Removed the search-box checks line from `parked.md`; it now lists 7 items (Step 3d said 8).
- Next up: `?id=` param, search-box checks, tour stop card UI.
**Commit:**
**Mistake caught:** Search-box checks were parked by mistake; they're required guardrails.

### Thu Oct 22 — Step 3f: AI-down test + keep coordinates away from the AI
**Tool:** Terminal (AI-down test) + Claude Code (coordinates fix)
**Prompt:**
```
In the narrate route, stop sending coordinates to the AI. The narrator
gets only name, born, died, and burial place. The JSON response still
includes coordinates for the map. Change nothing else. Then append a log
entry for the AI-down test (renamed key, user saw facts + narration null
+ "Our tour guide lost their voice," key restored, narration returned)
and this coordinates fix.
```
**Why:** Prove the fallback works when the AI is down, and send the AI only what it needs to narrate.
**Result:**
- AI-down test passed: with the key renamed, `/api/narrate` showed the facts + `narration: null` + "Our tour guide lost their voice"; with the key restored, narration came back.
- The AI now gets only name, born, died, and burial place; the JSON response still includes coordinates for the map.
**Commit:**
**Mistake caught:** The route was sending the AI every field (coordinates, ID, source), which it didn't need.

### Thu Oct 22 — Step 4 plan: ?id= for both routes + roster file (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan only: add ?id= to /api/legend and /api/narrate so they work for any
of the 20 roster names. Save the roster (name, Wikidata ID, LA Legends or
Beyond LA) in one file, using the verified IDs from earlier. Include
Cassandra Peterson (Elvira) as a test-only living person; look up her ID
live. Tests: Lugosi (normal), Vincent Price (no burial site), Rod Serling
(state, not a cemetery), Elvira (living, rejected before any AI call), and
a bad ID like "abc" (rejected). Append a log entry when approved.
```
**Why:** Make both routes work for the whole roster, with one file as the only list of allowed IDs, before building the search box and card.
**Result:**
- Plan approved: new `lib/roster.ts` with 20 legends + Elvira (Q253942, test only); one shared helper checks roster → Wikidata → living → region fix.
- I chose: Serling keeps "New York" as his burial place but gets no map pin and an honest "only records the state" message.
**Commit:**
**Mistake caught:** The earlier verified ID table only existed in chat, never in the repo, so all 21 IDs had to be re-checked live. They matched the earlier notes (Price/Karloff no burial, Stoker crematorium, Serling = New York).

### Thu Oct 22 — Step 4 plan follow-up: spot-check + parked burial check
**Tool:** wikidata.org (spot-check) + Claude Code (parked.md, log)
**Prompt:**
```
Add to parked.md: general check that the burial place is a cemetery,
crematorium, or church (not a region), so search-box names are covered
too. Today's Serling fix is roster-only. Also append to the log: I
spot-checked Lon Chaney Sr. (Q312656) on wikidata.org, died 1930.
```
**Why:** Confirm the trickiest roster ID by hand, and note that the Serling fix won't cover names typed into the search box.
**Result:**
- Spot-checked Lon Chaney Sr. (Q312656) on wikidata.org: died 1930, so it's the father, not Lon Chaney Jr.
- Added a general "burial place is a cemetery, crematorium, or church" check to `parked.md`.
**Commit:**
**Mistake caught:**

### Thu Oct 22 — Step 4: Build ?id= + roster
**Tool:** Claude Code
**Prompt:**
```
build it
```
**Why:** Build the approved Step 4 plan so both routes work for any roster legend and reject everything else.
**Result:**
- New `lib/roster.ts` (20 legends + Elvira test-only) with one shared `getRosterFacts`; both routes now take `?id=`.
- All tests passed: Lugosi normal; Price no burial + fallback message; Serling "New York" with no pin; Elvira, `abc`, and no ID → 400 with no AI call (only 3 token lines logged: in ~853–867, out ~175–208, ~$0.00017–0.00019/call).
**Commit:**
**Mistake caught:** My first test run used a loop variable named `path`, which in zsh wipes out the command search path (`curl: command not found`); renamed it and reran. Also, the Lugosi narration added "the living still leave flowers", a detail not in the facts.

### Thu Oct 22 — Step 4b: Tighter narrator rules
**Tool:** Claude Code
**Prompt:**
```
Before UI: update lib/narratorPrompt.ts rules only:
- You may name ONE signature work by title. No years, quotes, or awards.
- Never describe the grave site today, visitors, or what happens there now.
- Hard limit: 80 words for text. No filler about missing facts unless a
  fact is actually missing.
Change nothing else. Rerun Lugosi, Price, and Serling and show me the
narrations with word counts. Append a log entry.
```
**Why:** Step 4 narrations ran over 80 words, invented a grave-site detail ("the living still leave flowers"), and added filler.
**Result:**
- RULES updated: the "famous work in general terms" line replaced with "ONE signature work by title"; added the grave-site and 80-word rules.
- Reruns: Lugosi 75 words, Price 79, Serling 77, all under 80; no grave-site or visitor details. ~899–913 tokens in, ~174–189 out, ~$0.00018/call.
**Commit:**
**Mistake caught:** Lugosi still got filler ("the record books tell us only that much") even though no fact was missing.

### Thu Oct 22 — Step 4c: CLAUDE.md exception + parked example fix
**Tool:** Claude Code
**Prompt:**
```
Add to parked.md: narrator example should name one title, skip filler,
and avoid present-day claims (W2 lesson: the example drives behavior more
than rules). Update the CLAUDE.md exception line to "may name one
signature work by title." Append a log entry.
```
**Why:** Keep CLAUDE.md in sync with the new prompt rule, and save the example rewrite for later.
**Result:**
- CLAUDE.md exception now reads "the narrator may name one signature work by title"; the rest of the line is unchanged.
- Added the narrator-example rewrite to `parked.md`.
**Commit:**
**Mistake caught:**

### Thu Oct 22 — Step 5 plan: Tour UI, roster list + tour stop card (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan only: replace the Next.js starter page with the tour UI.
- A plain list of the 20 roster names, grouped LA Legends / Beyond LA.
- Click a name → call /api/narrate?id= → show a tour stop card: name,
  born-died, burial place, the narration title + text, and the label
  "Facts from Wikidata · Narration by AI".
- Show the route's friendly messages (unknown resting place, region,
  narration down) in the card.
- Loading state while the AI is thinking.
- Use public/images/tombstone-frame.png for the card if it's simple.
- No map, search box, or animation yet.
Append a log entry when approved.
```
**Why:** Replace the starter page with the first real screen, using the routes that already work.
**Result:**
- Plan approved: server `app/page.tsx` passes the roster (Elvira hidden) to a new client `app/TourGuide.tsx`; facts and narration in separate, labeled blocks.
- I chose tombstone image on top, text below (the stone's inner panel is too small for 80 words + facts, especially on phones).
**Commit:**
**Mistake caught:**
