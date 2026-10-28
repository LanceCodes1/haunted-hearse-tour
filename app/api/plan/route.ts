// Back end only: POST /api/plan { request } turns a visitor's wish into a tour route from the roster.
// It only plans; nothing is saved until the visitor presses Save (POST /api/tours).
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, logAiCost } from "@/lib/aiCost";
import { MAX_REQUEST_CHARS } from "@/lib/planLimits";
import { PLANNER_ROSTER, PLANNER_SYSTEM_PROMPT } from "@/lib/planPrompt";
import { MAX_LEGENDS, MAX_NAME_CHARS, validateTour } from "@/lib/tours";

const MAX_OUTPUT_TOKENS = 300; // cost guard: a name + up to 6 IDs is far less than this
const AI_TIMEOUT_MS = 10_000; // give up on the AI after 10 seconds
const FALLBACK_NAME = "Midnight Hearse Route"; // used if the AI's title is empty or too long

const NOTHING_FITS = "Mortimer couldn't find legends for that. Try naming a vibe, like 'silent-film monsters'.";
const PLANNER_DOWN = "Mortimer lost the map. Try again in a moment.";

const NAMES = new Map(PLANNER_ROSTER.map((legend) => [legend.id, legend.name]));

// The enum means the AI literally cannot return an ID that isn't on the public roster
const PLAN_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    legendIds: { type: "array", items: { type: "string", enum: [...NAMES.keys()] } },
  },
  required: ["name", "legendIds"],
  additionalProperties: false,
};

export async function POST(req: Request) {
  // 1. Bad input checks, all before any AI call
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "That request didn't come through. Try again." }, { status: 400 });
  }
  const raw = (body as { request?: unknown } | null)?.request;
  const wish = typeof raw === "string" ? raw.trim() : "";
  if (!wish) return Response.json({ error: "Tell Mortimer what kind of tour you want." }, { status: 400 });
  if (wish.length > MAX_REQUEST_CHARS) {
    return Response.json({ error: `Keep your wish under ${MAX_REQUEST_CHARS} characters.` }, { status: 400 });
  }
  if (!/\p{L}/u.test(wish)) return Response.json({ error: NOTHING_FITS }, { status: 400 }); // no letters = gibberish

  // 2. Ask the AI; any failure gets a friendly message, the raw error goes to the log
  let picked: unknown;
  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY on the server only
    const response = await client.messages.create(
      {
        model: AI_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" }, // picking from a list of 20 doesn't need thinking
        output_config: { effort: "low", format: { type: "json_schema", schema: PLAN_SCHEMA } },
        system: PLANNER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `<wish>${wish}</wish>` }],
      },
      { timeout: AI_TIMEOUT_MS, maxRetries: 0 }, // no silent retries, so 10 seconds really means 10 seconds
    );
    logAiCost("plan", response.usage);

    // Bad output check: the AI must finish normally (not cut off by max_tokens, not refused)
    if (response.stop_reason !== "end_turn") {
      console.error(`[api/plan] AI stopped early: ${response.stop_reason}`);
      return Response.json({ error: PLANNER_DOWN }, { status: 502 });
    }
    picked = JSON.parse(response.content.find((block) => block.type === "text")?.text ?? "");
  } catch (err) {
    console.error("[api/plan] AI call failed:", err); // raw error goes to the terminal only
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The hearse is stuck in traffic, try again in a moment." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return Response.json({ error: "Mortimer is taking too long. Try again in a moment." }, { status: 504 });
    }
    return Response.json({ error: PLANNER_DOWN }, { status: 502 });
  }

  // 3. Never trust the AI's list: keep public roster IDs only, drop repeats, cap the length
  const { name: aiName, legendIds: aiIds } = (picked ?? {}) as { name?: unknown; legendIds?: unknown };
  const ids = Array.isArray(aiIds) ? aiIds.filter((id): id is string => typeof id === "string" && NAMES.has(id)) : [];
  const legendIds = [...new Set(ids)].slice(0, MAX_LEGENDS);
  if (legendIds.length === 0) return Response.json({ error: NOTHING_FITS }, { status: 422 });

  const cleanName = typeof aiName === "string" ? aiName.trim() : "";
  const name = cleanName && cleanName.length <= MAX_NAME_CHARS ? cleanName : FALLBACK_NAME;

  // Same rules as saving, so any tour the planner returns can always be saved
  const check = validateTour({ name, legendIds });
  if (!check.ok) {
    console.error("[api/plan] Planned tour failed validation:", check.message);
    return Response.json({ error: PLANNER_DOWN }, { status: 502 });
  }
  return Response.json({ name: check.tour.name, legends: check.tour.legendIds.map((id) => ({ id, name: NAMES.get(id) })) });
}
