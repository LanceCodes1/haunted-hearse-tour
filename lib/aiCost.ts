// Back end only: the AI model and its prices live together, so every route logs cost the same way.
// If the model changes, the prices next to it must change too.
export const AI_MODEL = "claude-haiku-5-5";

// Haiku 5.5 prices per 1 million tokens (prompts under 100K tokens)
const INPUT_PRICE_PER_M = 0.1;
const OUTPUT_PRICE_PER_M = 0.5;

// Cost log: tokens used and estimated price, per call and per 1,000 calls.
// `details` adds context to the line, like "persona=kid", so costs can be compared.
export function logAiCost(route: string, usage: { input_tokens: number; output_tokens: number }, details = "") {
  const cost = (usage.input_tokens * INPUT_PRICE_PER_M + usage.output_tokens * OUTPUT_PRICE_PER_M) / 1_000_000;
  console.log(
    `[${route}] ${details ? `${details} ` : ""}tokens in=${usage.input_tokens} out=${usage.output_tokens} · est $${cost.toFixed(6)}/call · $${(cost * 1000).toFixed(3)} per 1,000 calls`,
  );
}
