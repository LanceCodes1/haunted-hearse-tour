# Parked

Ideas and fixes saved for later. Not in this week's build.

- **Narration runs long:** it comes out around 86 words, over the prompt's 60–80 target (Vincent Price hit ~100 in a later test). W7 fix: a hard word-count check in the narrate route that drops or flags any narration over 80 words (today's shape check allows up to 1,200 characters, about 200 words).
- **Filler line:** the narration adds "the record books go quiet" even when no fact is missing.
- **Notable-work field from Wikidata (W7):** pull a legend's famous work from Wikidata instead of the AI's general knowledge.
- **Cache Wikidata answers:** don't ask Wikidata again for the same legend.
- **Cache narrations:** repeat visits to the same legend cost $0.
- **`npm audit` warnings:** 5 high-severity, all in ESLint tooling (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`). Not the SDK. Don't run `npm audit fix --force`, which can break things.
- **Copy the plan into the repo:** the full Step 3 plan lives in `~/.claude/plans/`, outside git. Copy it to `docs/` for the demo.
- **General burial-place check:** confirm on Wikidata that the burial place is a cemetery, crematorium, or church (not a region), so search-box names are covered too. Today's Serling fix is roster-only.
- **Narrator example:** rewrite the EXAMPLE to name one title, skip filler, and avoid present-day claims (W2 lesson: the example drives behavior more than rules).
- **Search any legend beyond the 20 (W7):** needs a Wikidata name search, handling the wrong person with the same name, and the general cemetery check above.
- **Smaller pin image:** `map-pin.png` is about 900 KB (1713×918) and Leaflet loads it at full size. A cropped, small copy would make the map faster.
- **Phase 2 CRUD moved to W7:** saving a tour route with Prisma + Neon. Missed the Thursday 3 PM checkpoint.
- **Deploy to Vercel:** needs `ANTHROPIC_API_KEY` set in Vercel's project settings (never in code), a confirmed spend limit on the Anthropic account, and narration caching (see above) so public traffic doesn't pay for the same story twice.
