// Back end only: GET /api/narrate?id=Q34529 returns a roster legend's Wikidata facts plus an AI narration.
import Anthropic from "@anthropic-ai/sdk";
import { connection, type NextRequest } from "next/server";
import { WikidataError } from "@/lib/wikidata";
import { getRosterFacts } from "@/lib/roster";
import { buildSystemPrompt } from "@/lib/narratorPrompt";
import { toPersona } from "@/lib/personas";
import { AI_MODEL, logAiCost } from "@/lib/aiCost";

const MAX_INPUT_CHARS = 1000; // cost guard: never send more than this to the AI
const MAX_OUTPUT_TOKENS = 400; // cost guard: hard cap on how much the AI can write
const AI_TIMEOUT_MS = 10_000; // give up on the AI after 10 seconds
const MAX_WORDS = 80; // the prompt asks for 4 short sentences; this is the code check that makes 80 a real limit

// The exact JSON shape the AI must return: a title and one paragraph, nothing else
const NARRATION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    text: { type: "string" },
  },
  required: ["title", "text"],
  additionalProperties: false,
};

type Narration = { title: string; text: string };

// Bad output check: the AI's answer must parse and have a sensible title and paragraph
function parseNarration(raw: string): Narration | null {
  try {
    const data = JSON.parse(raw);
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    if (title.length < 1 || title.length > 80) return null;
    if (text.length < 20 || text.length > 1200) return null;
    return { title, text };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  await connection(); // run on every request, never prerendered at build time
  // Persona only picks the voice; the facts, guards, and limits below are the same for all three
  const persona = toPersona(request.nextUrl.searchParams.get("persona"));

  // 1. Facts first: roster check, Wikidata, and living-person check. If any fails, the AI is never called.
  let facts;
  try {
    facts = await getRosterFacts(request.nextUrl.searchParams.get("id"));
  } catch (err) {
    console.error("[api/narrate] Lookup failed:", err); // raw error goes to the terminal only
    if (err instanceof WikidataError) {
      return Response.json({ error: err.userMessage }, { status: err.status });
    }
    return Response.json({ error: "Something went wrong on our side. Try again soon." }, { status: 500 });
  }

  // 2. Input cap: the AI sees only these facts, and only if they're short
  // Coordinates stay out of the AI's view; they're only for the map
  const factsForAI = JSON.stringify({ name: facts.name, born: facts.born, died: facts.died, burialPlace: facts.burialPlace });
  if (factsForAI.length > MAX_INPUT_CHARS) {
    console.error(`[api/narrate] Facts too long for AI (${factsForAI.length} chars), skipping narration`);
    return Response.json({ ...facts, narration: null, narrationError: "Our tour guide is speechless. Here are the facts for now." });
  }

  // 3. Ask the AI for a narration; any failure falls back to facts + narration: null
  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env.local, on the server only
    const response = await client.messages.create(
      {
        model: AI_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" }, // Haiku 5.5 thinks by default; a short narration doesn't need it
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: NARRATION_SCHEMA }, // force the title + text shape
        },
        system: buildSystemPrompt(persona),
        messages: [{ role: "user", content: factsForAI }],
      },
      { timeout: AI_TIMEOUT_MS, maxRetries: 0 }, // no silent retries, so 10 seconds really means 10 seconds
    );

    // Persona is logged because each voice has a different-length prompt, so cost differs a little per persona.
    logAiCost("narrate", response.usage, `persona=${persona}`);

    // Bad output check: the AI must finish normally (not cut off, not refused)
    if (response.stop_reason !== "end_turn") {
      console.error(`[api/narrate] AI stopped early: ${response.stop_reason}`);
      return Response.json({ ...facts, narration: null, narrationError: "Our tour guide lost their voice. Here are the facts for now." });
    }

    const raw = response.content.find((block) => block.type === "text")?.text ?? "";
    const narration = parseNarration(raw);
    if (!narration) {
      console.error("[api/narrate] AI output didn't match the expected shape:", raw);
      return Response.json({ ...facts, narration: null, narrationError: "Our tour guide lost their voice. Here are the facts for now." });
    }

    // Bad output check: over-long narrations are dropped, not trimmed (trimming would cut off the sign-off)
    const words = narration.text.split(/\s+/).length;
    if (words > MAX_WORDS) {
      console.error(`[api/narrate] Narration too long (${words} words, limit ${MAX_WORDS}), dropped`);
      return Response.json({ ...facts, narration: null, narrationError: "Our tour guide lost their voice. Here are the facts for now." });
    }

    return Response.json({ ...facts, narration });
  } catch (err) {
    console.error("[api/narrate] AI call failed:", err); // raw error goes to the terminal only
    let narrationError = "Our tour guide lost their voice. Here are the facts for now.";
    if (err instanceof Anthropic.RateLimitError) {
      narrationError = "The hearse is stuck in traffic, try again in a moment."; // 429
    } else if (err instanceof Anthropic.APIConnectionTimeoutError) {
      narrationError = "Our tour guide is taking too long. Here are the facts for now."; // 10s timeout
    }
    // Fallback: the AI failed, but the Wikidata facts are still good
    return Response.json({ ...facts, narration: null, narrationError });
  }
}
