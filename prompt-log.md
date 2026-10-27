# Prompt Log — Haunted Hearse Tour (W6)

### Wed Oct 21 — Scope decision + project setup
**Tool:** HQ chat (Claude)
**Prompt:** Pressure-test the W6 plan against the spec; riskiest piece + cut order.
**Why:** Lock scope before writing code.
**Result:** Wikidata = riskiest piece (name matching, coordinates two hops away, living-person guard depends on it). CRUD + Prisma/Neon parked until core works. Fallback demo must keep the search box (bad-input guard surface).
**Commit:** `8afd95a` Add prompt log and project CLAUDE.md
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
**Commit:** `03f2cf1` Add guardrail, honesty, and planning rules to CLAUDE.md
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
**Commit:** `03f2cf1` Add guardrail, honesty, and planning rules to CLAUDE.md
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
**Commit:** `873a062` Add image assets and log setup checks
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
**Commit:** `215b937` Add Wikidata burial-facts route for Bela Lugosi
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
**Commit:** `721fce2` Move images to public/images and rename
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
**Commit:** `1f15d64` Log repo setup and add repo URL to User-Agent
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
**Commit:** `1f15d64` Log repo setup and add repo URL to User-Agent
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
**Commit:** `42801b4` Log Step 3 narration route plan
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
**Commit:** `7bb5083` Add AI narration route with guardrails
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
**Commit:** `b0d05d7` Add narrator prompt, famous-work exception, and parked list
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
**Commit:** `b0d05d7` Add narrator prompt, famous-work exception, and parked list
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
**Commit:** `b0d05d7` Add narrator prompt, famous-work exception, and parked list
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
**Commit:** `b0d05d7` Add narrator prompt, famous-work exception, and parked list
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
**Commit:** `d558801` Send only narration facts to the AI
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
**Commit:** `750f552` Log Step 4 roster and id plan
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
**Commit:** `750f552` Log Step 4 roster and id plan
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
**Commit:** `ac687f0` Add roster and ?id= to legend and narrate routes
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
**Commit:** `26f08ab` Tighten narrator rules: one title, no grave-site details, 80 words
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
**Commit:** `6e970fe` Sync CLAUDE.md title exception and park example rewrite
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
**Commit:** `934a0fb` Log Step 5 tour UI plan
**Mistake caught:**

### Thu Oct 22 — Step 5: Build tour UI
**Tool:** Claude Code
**Prompt:**
```
build it
```
**Why:** Build the approved Step 5 plan: the first real screen of the tour.
**Result:**
- `app/page.tsx` replaced with the tour; new `app/TourGuide.tsx` has the grouped roster buttons, the loading message, and the tour stop card (tombstone on top, facts and narration in separate labeled blocks, "Facts from Wikidata · Narration by AI" footer).
- Checks: types + lint pass; home page renders 20 buttons in two groups, Elvira not listed; tab title is "Haunted Hearse Tour".
**Commit:** `204db6e` Add tour UI: roster list and tour stop card
**Mistake caught:**

### Thu Oct 22 — Step 6 plan: Search box with input checks (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan only: add a search box above the roster list.
- User types a name → match against the 20 roster names (case-insensitive,
  partial match OK) → open that legend's card.
- Input checks BEFORE any API call: empty, over 60 characters, gibberish
  (no letters), a name not on the tour, and Cassandra Peterson / Elvira
  (show "No tombstones for the living.").
- Each check shows a friendly message under the box.
- Front end only unless the routes need a change; tell me if they do.
Append a log entry when approved.
```
**Why:** The last must-ship piece; every input check runs in the browser before any API call.
**Result:**
- Plan approved: new `app/searchCheck.ts` runs empty → over 60 → no letters → living → match; no route changes needed (the server's roster + living checks stay as the safety net).
- I chose: 2+ matches show clickable name buttons; no API call until one is picked.
**Commit:** `906fa3b` Log Step 6 search box plan
**Mistake caught:** The plan's test table said "lo" matches Lorre, Chaney, and Lovecraft, but "Karloff" contains "lo" too, so 4 buttons should show.

### Thu Oct 22 — Step 6: Build search box
**Tool:** Claude Code
**Prompt:**
```
build it
```
**Why:** Build the approved Step 6 plan: the last must-ship piece.
**Result:**
- New `app/searchCheck.ts` + a search form in `app/TourGuide.tsx`; `app/page.tsx` passes a small `living` list. No route changes.
- Ran 13 inputs through `checkSearch`: empty/spaces, 61 chars, `12345`, `!!!`, `elvira`, `Cassandra Peterson`, `peterson`, and `dracula` all get the right message; `lo` shows 4 buttons (incl. Karloff); `peter`, `LUGOSI`, and `hp lovecraft` open one card.
**Commit:** `6b9a835` Add search box with input checks; clear card on rejected search
**Mistake caught:** The planned order (living check before matching) would have rejected "peter" and even "a" as living, because "Cassandra Peterson" contains them. Now "living" only applies when no tour legend matches.

### Thu Oct 22 — Step 6b: Search box tests + clear card on rejected search
**Tool:** Browser (search tests) + Claude Code (fix)
**Prompt:**
```
When a search is rejected (empty, too long, no letters, living, not on the
tour), clear the current card so only the message shows. Change nothing
else. Add to parked.md: open the search to any legend beyond the 20 (W7):
needs Wikidata name search, wrong-person handling, and the general
cemetery check. Append a log entry for the search box tests and this fix.
```
**Why:** After a rejected search, the previous legend's card stayed on screen next to the error message, which was confusing.
**Result:**
- Search box tests in the browser: the rejection messages and matches worked, but a rejected search left the old card showing.
- Fix: a rejected search now clears the card and the highlighted name; matches and single opens are unchanged. Added "search any legend beyond the 20 (W7)" to `parked.md`.
**Commit:** `6b9a835` Add search box with input checks; clear card on rejected search
**Mistake caught:** A rejected search kept the previous card on screen.

### Thu Oct 22 — Step 7 plan: Map pin on the tour stop card (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan only: add a map to the tour stop card.
- Leaflet + OpenStreetMap tiles (free, no key). Load it client-side only
  so it doesn't break Next.js server rendering.
- When a legend has coordinates: show the map centered on the pin, using
  public/images/map-pin.png as the marker.
- When coordinates are null (Price, Karloff, Serling): no map, keep the
  existing message.
- Add the OpenStreetMap attribution on the map.
- Front end only. No route changes.
Append a log entry when approved.
```
**Why:** The last Phase 1 item: show each grave on a map, using the coordinates Wikidata already gives us.
**Result:**
- Plan approved: plain Leaflet 1.9.4 (no react-leaflet) in a new `app/TourMap.tsx`, loaded with `next/dynamic` + `ssr: false`; map only when coordinates exist.
- Pin image is 1713×918 with a transparent border, so the marker is anchored at the pin's tip, not the image corner.
**Commit:** `a31eaed` Log Step 7 map plan
**Mistake caught:**

### Thu Oct 22 — Step 7: Build map pin
**Tool:** Claude Code
**Prompt:**
```
build it
```
**Why:** Build the approved Step 7 plan: a map with the skull pin for every legend who has cemetery coordinates.
**Result:**
- Installed `leaflet` 1.9.4 + `@types/leaflet` (dev); new `app/TourMap.tsx`, loaded in `app/TourGuide.tsx` with `next/dynamic` + `ssr: false`, shown only when `coordinates` exist.
- Types, lint, and `npm run build` pass; `npm audit` still shows the same 5 ESLint warnings (nothing new).
**Commit:** `9a130fa` Add Leaflet map pin; Phase 1 complete
**Mistake caught:**

### Thu Oct 22 — Step 7b: Map tests, Phase 1 complete
**Tool:** Browser (map tests) + Claude Code (logging only)
**Prompt:**
```
Append a log entry for the map tests: Lugosi and Lorre pins correct,
Price and Serling show no map, attribution visible. Phase 1 complete.
```
**Why:** Confirm the map works on real stops, including the no-coordinates cases, before closing Phase 1.
**Result:**
- Lugosi and Lorre pins land correctly; Price and Serling show no map; the OpenStreetMap attribution is visible.
- Phase 1 complete: Wikidata facts, AI narration with guardrails, roster + search with input checks, tour stop card, map pin.
**Commit:** `9a130fa` Add Leaflet map pin; Phase 1 complete
**Mistake caught:**

### Thu Oct 22 — Step 8 plan: Grindhouse styling, intro panel, taglines (plan mode)
**Tool:** Claude Code (plan mode)
**Prompt:**
```
Plan only: grindhouse styling pass + intro panel + legend taglines.
Front end only. No new routes or packages (Google Font is OK).
- Intro panel replaces "Pick a legend to start the tour": headline, hook
  "Before Freddy, Jason, and Chucky, these are the people who invented
  the monsters. Hop in.", a 3-step how-it-works line, and
  "Facts from Wikidata · Narration by AI".
- Use my images: background.png (page), header-overlay.svg (title),
  hearse.png (intro panel), billboard.png if it fits.
- Grindhouse feel: rusted signage colors, horror display font, subtle
  title flicker. Original art only. Readable and phone-friendly.
ALSO:
- Legend list: modern 2026-style buttons (rounded, soft glow on hover,
  smooth transitions), keeping the grindhouse colors.
- Ghost tooltip: on hover OR keyboard focus, a translucent "ghost" box
  shows a one-line tagline (what they're known for, no dates). Store the
  20 taglines in the roster file. Show me all 20 so I can spot-check.
- Add to parked.md: Phase 2 CRUD moved to W7 (missed the 3 PM checkpoint).
Append a log entry when approved.
```
**Why:** Give the working Phase 1 app its grindhouse look and a welcome screen before the demo.
**Result:**
- Plan approved: Creepster title with a flicker (off for reduced motion), rust/blood/bone/amber colors, always-dark page; new `app/IntroPanel.tsx`; rounded glowing buttons with a ghost tagline tooltip on hover and keyboard focus.
- I chose: billboard as the intro panel hero with the hearse under it; 20 taglines drafted for my spot-check (they're hand-written facts, not from Wikidata).
**Commit:** `621ab0f` Add grindhouse styling, intro panel, taglines, and loading overlay
**Mistake caught:**

### Thu Oct 22 — Step 8: Build grindhouse styling, intro panel, taglines
**Tool:** Claude Code (+ Claude in Chrome for a visual check)
**Prompt:**
```
1: The iconic screen Dracula, cape and all.
Add a CLAUDE.md exception: "Legend taglines are AI-drafted copy,
cross-checked in HQ chat. Not Wikidata facts."
Then build it.
```
**Why:** Build the approved Step 8 plan, with my tagline fix and a CLAUDE.md note that taglines aren't Wikidata facts.
**Result:**
- Creepster flickering title on the drip header, cemetery background, new `app/IntroPanel.tsx` (billboard + hearse + hook + 3 steps + label), rounded glowing buttons with ghost tagline tooltips; 20 taglines in `lib/roster.ts`; CLAUDE.md tagline exception; Phase 2 CRUD → W7 in `parked.md`.
- Types, lint, and `npm run build` pass; checked in Chrome on desktop: intro panel, tooltip on hover, Lugosi card with map and narration all readable. Phone width not checked yet (window resize didn't apply).
**Commit:** `621ab0f` Add grindhouse styling, intro panel, taglines, and loading overlay
**Mistake caught:**

### Thu Oct 22 — Step 8b: Loading overlay + scroll to card
**Tool:** Claude Code
**Prompt:**
```
Front end only, change nothing else:
- While the narration loads, show "Mortimer is warming up the hearse..."
  as a fixed overlay dead center of the screen, so it's visible no matter
  where I've scrolled. Dim the page behind it.
- Make it bigger, in the Creepster font, with a slow eerie pulse (respect
  reduce motion).
- When the card finishes loading, remove the overlay and scroll the card
  into view.
Append a log entry.
```
**Why:** The small loading line was easy to miss after scrolling down the roster, especially on a phone.
**Result:**
- Loading now shows a fixed, centered overlay over a dimmed, blurred page: big red Creepster text with a slow pulse (off for reduce motion), placed above the map (`z-[1000]`) and announced to screen readers (`role="status"`).
- When the card arrives, the overlay disappears and the card scrolls into view (instant jump instead of smooth scroll for reduce motion). Types and lint pass.
**Commit:** `621ab0f` Add grindhouse styling, intro panel, taglines, and loading overlay
**Mistake caught:**

### Thu Oct 22 — Step 8c: Lighter loading overlay over the card column
**Tool:** Claude Code
**Prompt:**
```
Loading overlay only: remove the blur and lighten the dim to about 30%
so the page and background stay clearly visible behind the text. Keep
the centered Creepster text, size, and pulse. Add a soft dark glow
behind the letters so they stay readable. Change nothing else.
```
Follow-up:
```
Loading overlay: keep it fixed and vertically centered on screen, but
center it horizontally over the card column (right side), not the whole
page, so it never overlaps the legend list. Scale the text down if needed
so it fits that column. On phones, keep it centered full-width. Change
nothing else. Then add a short Step 8c log entry covering the overlay
changes.
```
**Why:** The 8b overlay hid too much of the page, and its text ran over the legend list.
**Result:**
- Dim lowered to 30% with no blur; a dark drop-shadow behind the red letters keeps them readable.
- On wider screens the text centers over the card column only (position calculated from the page layout); full width on phones; text capped at `text-4xl`/`lg:text-5xl` to fit. Types, lint, and build pass.
**Commit:** `621ab0f` Add grindhouse styling, intro panel, taglines, and loading overlay
**Mistake caught:**

### Thu Oct 22 — Step 8d: Intro panel first on phones
**Tool:** Claude Code
**Prompt:**
```
Move the intro panel above the legend list on phones only. Change nothing
else. Append a short log entry.
```
**Why:** On phones, all 20 names came before the intro panel, so the welcome screen was below the fold.
**Result:**
- While the intro panel shows, its column moves first on phones (`order-first`); from tablet width up the layout is unchanged.
- Tour stop cards still appear below the list on phones (and scroll into view). Types and lint pass.
**Commit:** `e9f94fb` Phone intro order, phone taglines, and back to the entrance
**Mistake caught:**

### Thu Oct 22 — Step 8e: Phone taglines + back to the entrance
**Tool:** Claude Code
**Prompt:**
```
Front end only, change nothing else:
1. Phones only: show each legend's tagline as small text under the name
   inside the button (no hover on touch). Keep the ghost tooltip on desktop.
2. Add a "Back to the tour entrance" button at the top of the tour stop
   card. It clears the selection, shows the intro panel again, and
   scrolls to the top. Clicking the site title does the same.
Append a short log entry.
```
**Why:** Touch screens can't hover, so phone users never saw the taglines; and there was no way back to the intro panel.
**Result:**
- Phones: tagline shows as small text inside each button (buttons get rounded corners instead of a pill so two lines fit); the ghost tooltip shows from tablet width up.
- "← Back to the tour entrance" on every card, and a clickable site title (new `app/SiteTitle.tsx`), both send one browser event that clears the card and scrolls to the top. Types, lint, and build pass.
**Commit:** `e9f94fb` Phone intro order, phone taglines, and back to the entrance
**Mistake caught:**

### Thu Oct 22 — Step 9: Rewrite README
**Tool:** Claude Code
**Prompt:**
```
Rewrite README.md for Haunted Hearse Tour. Sections: what it is (hook:
"Before Freddy, Jason, and Chucky…"), how it works (browser → my server →
Wikidata → Claude → screen), stack, setup (npm install, .env.local with
ANTHROPIC_API_KEY=your-key-here placeholder, npm run dev), guardrails
(bad input, bad output, failure, cost cap), cost (~$0.0002/call), where
AI was used (built with Claude Code; narration by Claude Haiku 5.5;
taglines AI-drafted and cross-checked), credits (Wikidata, OpenStreetMap,
Leaflet), and what's parked for W7. Plain language. Append a log entry.
```
**Why:** Replace the Create Next App starter README with one that explains the project for the demo and the class repo.
**Result:**
- README now covers all 9 sections: what it is, how it works, stack, setup, guardrails, cost, AI use, credits, and parked for W7; it links to `prompt-log.md` and `parked.md`.
- Only a placeholder key (`your-key-here`) appears; no real key or secret.
**Commit:** `d1a9aca` Rewrite README and add missing one-line comments
**Mistake caught:**

### Thu Oct 22 — Step 9b: Fill in missing one-line comments
**Tool:** Claude Code
**Prompt:**
```
Yes, add those ~7 one-line comments. Comments only, no code changes.
Append a short log entry.
```
**Why:** A read-only check flagged `app/layout.tsx` and four spots in `app/TourGuide.tsx` with no one-line comment for the demo.
**Result:**
- Added 8 one-line comments: 4 in `app/layout.tsx` (body font, mono font, tab title, page shell) and 4 in `app/TourGuide.tsx` (screen state, `visit()`, list order, `TourStopCard`).
- Diff is comment lines only; types and lint pass.
**Commit:** `d1a9aca` Rewrite README and add missing one-line comments
**Mistake caught:**

---

## Week 6 lab wrap-up (Sun Oct 25)

### Day 2 · Token usage: short vs. long input
**Tool:** Terminal (token log from the narrate route)
**Prompt:** No new prompt. Numbers come from the token log in Steps 3, 3d, and 4b.
**Why:** The lab asks for short vs. long token counts and what drove the difference.
**Result:**
- Placeholder system prompt: **331 in / 101 out**. Full Mortimer prompt: **~885–913 in / ~145–214 out**.
- What drove it: the **system prompt**, not the user. It's paid on every call, so it's my biggest cost lever.
- Why there's no long user input: the AI route only accepts a roster ID, and the facts sent are capped at 1,000 characters. Nobody can paste a giant input, so a "long input" case can't happen by design.
- Cost: **~$0.0002/call, ~$0.19 per 1,000 calls** (Haiku 5.5 at $0.10 / $0.50 per 1M tokens). Cheaper than I expected.
- Cost/limit consideration: caching narrations (parked for W7) would make repeat visits free and cut rate-limit risk.
**Commit:** `8bb235d` Fill commit hashes and add W6 lab wrap-up

### Day 3 · Govern answers
**Where did I use AI?** Two places. In the **build**: Claude Code wrote the code while I planned, reviewed every diff, tested, and committed. In the **product**: Claude Haiku 5.5 writes each narration live. Taglines are AI-drafted copy that I checked by hand.
**What did I check?** Every diff before accepting it. All 21 Wikidata IDs, looked up live and spot-checked (an AI-memory ID for Lugosi was wrong). Break-it tests: empty, too long, gibberish, not on the tour, Elvira, a fake ID, and an AI-down test. All of it is logged above.
**What would I tell a user?** The facts are from Wikidata and the story is written by AI. Every card says **"Facts from Wikidata · Narration by AI,"** so nobody has to guess.

### Day 3 · Project one-liner
**AI narration of horror legends' graves · failure mode: AI invents facts about a real person · guardrail: Wikidata is the only fact source, and every card labels facts vs. AI narration.**

---

## Week 7: Phase 2 gate

### 2026-10-26 — Phase 2 gate plan
**Tool:** Claude Code (plan mode)
**Prompt:** Plan only, no code yet. We're extending Haunted Hearse Tour for my Phase 2 gate
(Thursday). Read README.md, parked.md, and CLAUDE.md first.

Gate non-negotiables: deployed on Vercel, Postgres database (Prisma + Neon),
reliable AI features with guardrails, I can explain every part.

Build in this order. Each phase ends working + committed before the next starts:

MUST
1. Database: Prisma (latest STABLE version) + Neon. A Tour model:
   id (short shareable id), name, legendIds (list of roster IDs), persona,
   createdAt. Create/read/delete saved tours.
2. Narrator personas: Campy Mortimer (default), Scholarly Historian,
   Kid-Friendly. Persona changes only the system prompt; same guardrails and
   Wikidata-facts-only rule for all three.
3. AI Tour Planner: user describes what they want in plain words; AI returns a
   route chosen ONLY from the 20-legend roster (validate every ID server-side,
   structured JSON, length caps). User can save it as a Tour.
4. Shareable tour page at /tour/[id].
5. Leaflet must load client-side only (dynamic import, ssr:false) so the
   Vercel build doesn't fail.

SHOULD
6. Voice: a Play button that reads the narration aloud with a different
   original voice per persona (no imitating real or famous characters).
   Audio generates only on click; fall back to the browser's built-in voice if
   the TTS API fails or times out. Log cost per play.
7. Legend hover cards: expand and push neighbors aside instead of overlapping
   names (use the Motion library).
8. Lightning flash synced to the flickering bulb + thunder sound behind a
   sound toggle that's OFF by default. Respect prefers-reduced-motion.

STRETCH
9. "Graves Visited" counter from the database.

For the plan: list the files you'll touch per phase, new env variables needed,
packages to install (with versions), and the risks for deploying on Vercel.
Keep each phase small enough for one commit.
**Why:** Plan the whole Phase 2 build before writing code, so each phase is one small, testable commit.
**Result:**
- Plan approved: 12 small phases (1a–9), with files, env variables, pinned package versions, and 10 Vercel risks. My choices: ElevenLabs voice, creator-only delete code, Stretch (counter) parked, thunder generated in code.
- Leaflet was already client-only (`dynamic`, `ssr: false`), so Phase 5 is a check plus the first deploy.
**Commit:**
**Mistake caught:** npm's "latest" tag for `prisma` is a release candidate (8.0.0-rc.27), not stable. The plan pins stable 7.10.1. Also, the DB URLs were in `.env` instead of `.env.local`.

### 2026-10-26 — Step 0: Working rules in CLAUDE.md
**Tool:** Claude Code (manual mode)
**Prompt:** Step 0 (before 1a): Propose adding this section to CLAUDE.md, show me the diff, and wait for my approval: [pasted "## Working rules" section]. Follow-ups: "Overlaps: (a) replace the old prompt-log template with the new one (Tool / Prompt / Why / Result / Verified / Mistake caught; drop Commit:). (b) Remove the old "one-line comments on key logic" line. One rule per topic, no duplicates." / "Prompt-log move: approved, keep the rule in the "## Prompt log" section only. Planning trim: rejected. Restore the Planning section exactly as it was."
**Why:** Lock in manual mode, no git/npm/prisma runs by Claude, one commit per step, and pinned versions before the Phase 2 build starts.
**Result:**
- Added "## Working rules". Removed 4 "How I work" lines that duplicated it. Prompt-log template now has Verified instead of Commit.
- Planning section unchanged (Claude's trim was rejected).
- Also: fixed the plan-log clause ("Stretch (counter) parked"), marked Phases 6–8 "Roadmap (not approved)" in the plan, and moved the counter to parked.md.
**Verified:** Reviewed the final CLAUDE.md diff before saving.
**Mistake caught:** Claude's plan entry said I chose a site-wide counter. I hadn't, so the counter is now parked as undecided. Claude also tried to trim the Planning section beyond what I asked.
