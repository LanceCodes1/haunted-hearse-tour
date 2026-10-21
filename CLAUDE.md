# Haunted Hearse Tour — Rules for Claude Code

## How I work
- I'm early-career and building for a class demo. Explain in plain language.
- One small step at a time. Stop after each working piece so I can test and commit.
- After each change: 3–5 bullets max (what changed, front end or back end, why).
- Add one-line comments on key logic so I can explain it in my demo.
- Build only what I ask. New ideas go in a "Parked" list, not into the code.
- Never commit for me. I run git myself.
- Read before you edit. Keep changes small so the diff is easy to review.

## Secrets
- API keys live in `.env.local` only. Never in front-end code, never committed.
- Confirm `.env.local` is git-ignored before any step that uses a key.
- AI calls happen in back-end routes only (browser → server → AI → server → screen).

## Project facts
- Stack: Next.js 16 (App Router), TypeScript, Tailwind. No database unless I start Phase 2.
- Wikidata is the ONLY source of facts (burial place, coordinates, dates).
  The AI writes narration from those facts and never invents facts.
- Every AI feature needs guards for: bad input, bad output, and failure/slowness
  (try/catch, timeout, friendly messages). Raw errors go to the log; users get plain language.

## Prompt log
- After each step, append an entry to `prompt-log.md` (this exact filename) before I commit:

  ### [Date] — [Step name]
  **Tool:**
  **Prompt:** (my prompt, word for word)
  **Why:**
  **Result:** (2–3 bullets)
  **Commit:** (leave blank; I fill it in)
  **Mistake caught:** (if any)

@AGENTS.md