// The AI poet: Claude writes a new poem for a transaction, inside the grammar
// of Transactional Poetry. When Claude is unavailable (no key, budget spent,
// refusal, malformed answer) the grammar engine writes it instead.
import Anthropic from "@anthropic-ai/sdk";
import { compose } from "../public/js/grammar.js";
import { SYSTEM_PROMPT, cleanPoem, transactionBrief, validatePoem } from "../public/js/prompt.js";

export { cleanPoem, validatePoem };

const MODEL = process.env.POETRY_MODEL || "claude-opus-5-5";
const EFFORT = process.env.POETRY_EFFORT || "medium";
const MAX_PER_HOUR = Number(process.env.MAX_AI_POEMS_PER_HOUR || 60);

const hasCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasCredentials ? new Anthropic() : null;

let spent = [];
function budgetLeft() {
  const hourAgo = Date.now() - 3600_000;
  spent = spent.filter((t) => t > hourAgo);
  return MAX_PER_HOUR - spent.length;
}

export function aiStatus() {
  return { enabled: Boolean(client), model: client ? MODEL : null, budgetLeftThisHour: client ? budgetLeft() : 0 };
}

async function askClaude(brief) {
  // `fallbacks: "default"` lets the API re-run a declined request on Anthropic's
  // recommended fallback model instead of returning a refusal.
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT },
    cache_control: { type: "ephemeral" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: brief }],
  });
  if (response.stop_reason === "refusal") throw new Error("refused");
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { text: cleanPoem(text), model: response.model };
}

// Returns a poem record for a transaction. Never throws.
export async function writePoem(tx, values, market) {
  const fallback = (reason) => ({
    ...compose(values, { seed: tx.id }),
    source: "grammar",
    fallbackReason: reason,
  });
  if (!client) return fallback("no Anthropic credentials");
  if (budgetLeft() <= 0) return fallback("hourly AI budget spent");

  const brief = transactionBrief(tx, values, market);
  let problem = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    spent.push(Date.now());
    try {
      const { text, model } = await askClaude(brief);
      problem = validatePoem(text, values);
      if (!problem) return { text, values, source: "ai", model };
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) problem = "rate limited";
      else if (err instanceof Anthropic.AuthenticationError) problem = "invalid Anthropic credentials";
      else if (err instanceof Anthropic.APIError) problem = `API error ${err.status ?? ""}`.trim();
      else problem = err.message;
      console.warn(`[poet] ${tx.id}: ${problem}`);
      if (err instanceof Anthropic.AuthenticationError) break;
    }
  }
  return fallback(`AI poem rejected: ${problem}`);
}
