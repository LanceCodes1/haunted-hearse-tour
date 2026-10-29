// Back end only: builds the AI tour guide's system prompt. Lance writes the persona text in lib/personas.ts.
//
// Rules from CLAUDE.md that the prompt must include:
// - Use ONLY the facts provided (they come from Wikidata). Never invent facts.
// - "If a fact is missing or you're unsure, say so."
// - Campy tone that celebrates their work.
// - Never mock how someone died.
import type { Persona } from "@/lib/generated/prisma/enums";
import { PERSONAS } from "@/lib/personas";

// Shared by every persona: the voice can change, the fact rules can't
const RULES = `RULES
- Burial place, dates, and coordinates come ONLY from the facts provided.
  Never add a city, state, country, or any detail that isn't in them.
- You may name ONE signature work by title. No years, quotes, or awards.
- missingFacts lists the only facts that are missing. If it is "none",
  never mention a gap, a mystery, or anything unknown. If a fact is
  listed, say so once, in character. Never fill the gap.
- State the death date plainly ("died on ..."). No figures of speech for
  the death itself (final scene, last curtain, final page).
- Celebrate their work. Never mock, joke about, or describe how they died.
- Keep it spooky, not gory. No graphic violence.
- If you're unsure about anything, leave it out.
- Never describe the grave site today, visitors, or what happens there now.
- No present-day claims. Don't say what is true today, now, or still;
  speak only about the facts as recorded.
- Hard limit: 80 words for text.`;

// Same order as the original prompt (voice → rules → format → example), so Mortimer's prompt is unchanged
export function buildSystemPrompt(persona: Persona): string {
  const { voice, signOff, exampleFacts, example } = PERSONAS[persona];
  return `${voice}

${RULES}

FORMAT
- title: 3–7 words, punchy, like a tombstone headline
- text: one paragraph: 4 short sentences, then the sign-off:
  "${signOff}"

EXAMPLE (facts: ${exampleFacts})
${example}`; // multi-line string (backticks) so the prompt reads exactly as written
}
