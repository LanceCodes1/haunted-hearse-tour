// Back end only: GET /api/narrate returns Bela Lugosi's Wikidata facts plus an AI narration.
import Anthropic from "@anthropic-ai/sdk";
import { connection } from "next/server";
import { getBurialFacts, WikidataError } from "@/lib/wikidata";
import { NARRATOR_SYSTEM_PROMPT } from "@/lib/narratorPrompt";

const BELA_LUGOSI_ID = "Q34529"; // checked live on Wikidata (Holy Cross Cemetery)
const MODEL = "claude-haiku-5-5";
const MAX_INPUT_CHARS = 1000; // cost guard: never send more than this to the AI
const MAX_OUTPUT_TOKENS = 400; // cost guard: hard cap on how much the AI can write
const AI_TIMEOUT_MS = 10_000; // give up on the AI after 10 seconds

// Haiku 5.5 prices per 1 million tokens (prompts under 100K tokens)
const INPUT_PRICE_PER_M = 0.1;
const OUTPUT_PRICE_PER_M = 0.5;

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

export async function GET() {
  await connection(); // run on every request, never prerendered at build time

  // 1. Facts first, from Wikidata only. If this fails, the AI is never called.
  let facts;
  try {
    facts = await getBurialFacts(BELA_LUGOSI_ID);
  } catch (err) {
    console.error("[api/narrate] Wikidata lookup failed:", err); // raw error goes to the terminal only
    if (err instanceof WikidataError) {
      return Response.json({ error: err.userMessage }, { status: err.status });
    }
    return Response.json({ error: "Something went wrong on our side. Try again soon." }, { status: 500 });
  }

  // 2. Living-person guard: no death date means no tour stop
  if (!facts.died) {
    return Response.json({ error: "No tombstones for the living." }, { status: 400 });
  }

  // 3. Input cap: the AI sees only these facts, and only if they're short
  const factsForAI = JSON.stringify(facts);
  if (factsForAI.length > MAX_INPUT_CHARS) {
    console.error(`[api/narrate] Facts too long for AI (${factsForAI.length} chars), skipping narration`);
    return Response.json({ ...facts, narration: null, narrationError: "Our tour guide is speechless. Here are the facts for now." });
  }

  // 4. Ask the AI for a narration; any failure falls back to facts + narration: null
  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env.local, on the server only
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" }, // Haiku 5.5 thinks by default; a short narration doesn't need it
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: NARRATION_SCHEMA }, // force the title + text shape
        },
        system: NARRATOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: factsForAI }],
      },
      { timeout: AI_TIMEOUT_MS, maxRetries: 0 }, // no silent retries, so 10 seconds really means 10 seconds
    );

    // Cost log: tokens used and estimated price, per call and per 1,000 calls
    const { input_tokens, output_tokens } = response.usage;
    const cost = (input_tokens * INPUT_PRICE_PER_M + output_tokens * OUTPUT_PRICE_PER_M) / 1_000_000;
    console.log(
      `[narrate] tokens in=${input_tokens} out=${output_tokens} · est $${cost.toFixed(6)}/call · $${(cost * 1000).toFixed(3)} per 1,000 calls`,
    );

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
