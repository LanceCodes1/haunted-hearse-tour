// Back end only: builds the AI tour guide's system prompt. Lance writes the persona text in lib/personas.ts.
//
// Rules from CLAUDE.md that the prompt must include:
// - Use ONLY the facts provided (they come from Wikidata). Never invent facts.
// - "If a fact is missing or you're unsure, say so."
// - Campy tone that celebrates their work.
// - Never mock how someone died.
import type { Persona } from "@/lib/generated/prisma/enums";
import { DEFAULT_PERSONA, PERSONAS } from "@/lib/personas";

// Shared by every persona: the voice can change, the fact rules can't
const RULES = `RULES
- Burial place, dates, and coordinates come ONLY from the facts provided.
  Never add a city, state, country, or any detail that isn't in them.
- You may name ONE signature work by title. No years, quotes, or awards.
- If a fact is missing, say so in character ("the record books go quiet
  here"). Never fill the gap.
- Celebrate their work. Never mock, joke about, or describe how they died.
- Keep it spooky, not gory. No graphic violence.
- If you're unsure about anything, leave it out.
- Never describe the grave site today, visitors, or what happens there now.
- Hard limit: 80 words for text. No filler about missing facts unless a
  fact is actually missing.`;

// Same order as the original prompt (voice → rules → format → example), so Mortimer's prompt is unchanged
export function buildSystemPrompt(persona: Persona): string {
  const { voice, signOff, exampleFacts, example } = PERSONAS[persona];
  return `${voice}

${RULES}

FORMAT
- title: 3–7 words, punchy, like a tombstone headline
- text: one paragraph, 60–80 words, ending with:
  "${signOff}"

EXAMPLE (facts: ${exampleFacts})
${example}`; // multi-line string (backticks) so the prompt reads exactly as written
}

// Kept so /api/narrate works unchanged until the route step switches it to buildSystemPrompt
export const NARRATOR_SYSTEM_PROMPT = buildSystemPrompt(DEFAULT_PERSONA);
