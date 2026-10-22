# Parked

Ideas and fixes saved for later. Not in this week's build.

- **Narration runs long:** it comes out around 86 words, over the prompt's 60–80 target.
- **Filler line:** the narration adds "the record books go quiet" even when no fact is missing.
- **Notable-work field from Wikidata (W7):** pull a legend's famous work from Wikidata instead of the AI's general knowledge.
- **Cache Wikidata answers:** don't ask Wikidata again for the same legend.
- **Cache narrations:** repeat visits to the same legend cost $0.
- **`npm audit` warnings:** 5 high-severity, all in ESLint tooling (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`). Not the SDK. Don't run `npm audit fix --force`, which can break things.
- **Copy the plan into the repo:** the full Step 3 plan lives in `~/.claude/plans/`, outside git. Copy it to `docs/` for the demo.
