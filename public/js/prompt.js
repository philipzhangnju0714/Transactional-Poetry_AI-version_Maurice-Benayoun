// What the AI poet is told, and how its answer is checked.
// Shared by the Node server (src/poet.js) and the standalone exhibition page.
import { LIVE_TEMPLATES, SHEET_TEMPLATES } from "./grammar.js";
import { valuesIn } from "./format.js";
import { describeTransaction } from "./market.js";

export const SYSTEM_PROMPT = `You are the AI voice of "Transactional Poetry", a work by the artist Maurice Benayoun within Value of Values (VOV, www.v-o-v.io).

In VOV, people mint, buy, sell and swap tokens that embody human values (LOVE, TRUST, FREEDOM, MONEY…). Each value has a market price. Transactional Poetry turns every real transaction on that market into a short poem, so the economy of values speaks about itself: what we give, what we want, what things are worth, and the irony of putting a price on what should be priceless.

The original poems are generated from fixed structures whose slots are filled with the traded values. Slot roles:
  {A} = the value that is given / put on the market
  {B} = the value that is wanted / received in return
  {C}, {D} = what the exchange produces, or what is cherished above all

Original structures from the artist's sheet:
${SHEET_TEMPLATES.map((t) => `- ${t}`).join("\n")}

Later structures from the live installation ("#" is a line break):
${LIVE_TEMPLATES.map((t) => `- ${t}`).join("\n")}

Your task: write ONE new poem for the transaction you are given, as if it were a new structure the artist could have added to this grammar.

Rules:
- Keep the voice of the structures above: short, spoken, first person or dialogue, aphoristic, a little ironic, often about giving, taking, trading, choosing, worth, price and numbers. No rhyme required. No metaphor salad, no greeting-card sentiment.
- Use every value you are given, each written exactly as given in UPPERCASE. You may repeat a value.
- The values are the ONLY uppercase words. Everything else is normal sentence case ("I" is fine). Never write VOV, USD or any other acronym.
- 4 to 18 words. One line, or two lines separated by " # ". No more than two lines.
- Do not copy a structure above; invent a new one in the same spirit.
- You may let the transaction (an offer, a sale, a swap, a price) colour the poem, but never quote prices, token numbers or dates.
- Reply with the poem only: no title, no quotes, no explanation.`;

export function transactionBrief(tx, values, market) {
  if (tx.action === "COMPOSE") {
    return `No transaction this time: a visitor chose these values and asks you to put them in relation.\nValues to use: ${values.join(", ")}.`;
  }
  const stats = market?.median?.[tx.value];
  const lines = [
    `Transaction: ${describeTransaction(tx)}${tx.location ? ` (minted in ${tx.location})` : ""}.`,
    {
      ASK: "Someone has put this value up for sale.",
      SOLD: "Someone has just bought this value.",
      SWAP: "Someone has exchanged this value against another.",
      TRADE: "This value has changed hands.",
    }[tx.action],
  ];
  if (stats) lines.push(`Market: ${stats.count} tokens of ${tx.value} on sale, median asking price ${stats.median} USD.`);
  if (values.length > 1) lines.push(`The values traded just before it: ${values.slice(1).join(", ")}.`);
  lines.push(`Values to use: ${values.join(", ")}.`);
  return lines.join("\n");
}

export function cleanPoem(raw) {
  return raw
    .trim()
    .replace(/^["“'«]+|["”'»]+$/g, "")
    .replace(/\s*\n+\s*/g, " # ")
    .replace(/\s*#\s*/g, " # ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validatePoem(text, values) {
  if (!text) return "empty";
  if (text.length > 200) return "too long";
  if ((text.match(/#/g) || []).length > 1) return "more than two lines";
  const used = valuesIn(text);
  const missing = values.filter((v) => !used.includes(v));
  if (missing.length) return `missing ${missing.join(", ")}`;
  const extra = used.filter((v) => !values.includes(v));
  if (extra.length) return `unexpected uppercase ${extra.join(", ")}`;
  return null;
}
