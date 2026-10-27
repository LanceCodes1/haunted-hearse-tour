# Haunted Hearse Tour — Rules for Claude Code

## How I work
- I'm early-career and building for a class demo. Explain in plain language.
- After each change: 3–5 bullets max (what changed, front end or back end, why).
- Read before you edit. Keep changes small so the diff is easy to review.

## Working rules
- Manual mode: propose every edit; I approve each one.
- Never run git, npm install, or prisma commands. Give me the command
  plus a one-line plain-language explanation; I run it.
- Small steps: each step = one commit with one purpose. When a step is
  ready, tell me the commit message and stop for my test.
- Comments: 1–2 lines explaining WHY, not what, anywhere I might be
  asked "what's this?" in a demo.
- Scope: build only the current step. New ideas go in parked.md.
- Pinned versions only. No rc, beta, or canary.
- If anything is unclear, ask me instead of assuming.

## Secrets
- API keys live in `.env.local` only. Never in front-end code, never committed.
- Confirm `.env.local` is git-ignored before any step that uses a key.
- AI calls happen in back-end routes only (browser → server → AI → server → screen).

## Project facts
- Stack: Next.js 16 (App Router), TypeScript, Tailwind. No database unless I start Phase 2.
- Wikidata is the ONLY source of facts (burial place, coordinates, dates).
  The AI writes narration from those facts and never invents facts.
- Exception: the narrator may name one signature work by title. All burial, date, and place facts still come only from Wikidata. Notable-work field from Wikidata is parked for W7.
- Exception: Legend taglines are AI-drafted copy, cross-checked in HQ chat. Not Wikidata facts.
- Every AI feature needs guards for: bad input, bad output, and failure/slowness
  (try/catch, timeout, friendly messages). Raw errors go to the log; users get plain language.

## Guardrail specifics (from the Week 6 spec)
- Cost: cap input length, set a max output length, and log token usage
  per AI call so I can estimate cost per call and per 1,000 calls.
- Timeout on every AI and Wikidata call. Tell me the value you set.
- 429 / rate limit → "The hearse is stuck in traffic, try again in a moment."
- Reject before calling anything: empty, too long, gibberish, or a living
  person ("No tombstones for the living").
- System prompt rule: "If a fact is missing or you're unsure, say so."
  Narration is campy and celebrates their work. Never mock how someone died.
- Fallbacks: no burial site → "This legend's resting place is unknown, or
  their ashes were scattered." AI down → still show Wikidata facts.
- Wikidata calls send a descriptive User-Agent header.

## Honesty in the UI
- Label every tour stop: "Facts from Wikidata · Narration by AI."
- Facts and narration are visibly separate.

## Planning
- New features start in plan mode. Wait for my approval before editing.
- Ask me when a decision is mine. Don't guess on design or scope.

## Prompt log
- One entry per step in `prompt-log.md` (this exact filename), append-only.
  Short. No file dumps or play-by-play.

  ### [Date] — [Step name]
  **Tool:**
  **Prompt:** (my prompt, word for word)
  **Why:**
  **Result:** (2–3 bullets)
  **Verified:**
  **Mistake caught:** (if any)

@AGENTS.md