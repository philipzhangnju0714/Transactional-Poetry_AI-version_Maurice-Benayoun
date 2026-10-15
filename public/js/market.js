// Reading the Value of Values market (api.v-o-v.io, public, CORS-open)
// and turning each trade into the material of a poem.
import { VALUES, arityFor, compose, seededRandom } from "./grammar.js";

export const VOV_API = "https://api.v-o-v.io/api/v1";

async function getJson(path, fetchImpl = fetch) {
  const res = await fetchImpl(`${VOV_API}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

export async function fetchMarket(fetchImpl = fetch) {
  const [history, asks, median, tokens] = await Promise.all([
    getJson("/chart/trading-history/", fetchImpl),
    getJson("/chart/ask-order/?sortBy=-created", fetchImpl).catch(() => []),
    getJson("/chart/median-price/", fetchImpl).catch(() => ({})),
    getJson("/tokens/tokens/", fetchImpl).catch(() => ({ count: null })),
  ]);
  const locations = new Map();
  for (const ask of asks) if (ask?.token?.name) locations.set(ask.token.name, ask.token.location);
  return {
    transactions: toTransactions(history.vovs || [], locations),
    median,
    totalVovs: tokens.count,
    fetchedAt: new Date().toISOString(),
  };
}

export const categoryOf = (vovName) => vovName.replace(/\d+$/, "").toUpperCase();

const ACTIONS = { ASK: "ASK", SOLD: "SOLD", SWAP: "SWAP" };

export function toTransactions(rows, locations = new Map()) {
  return rows
    .filter((r) => r.vov)
    .map((r) => ({
      id: `${r.vov}@${r.date}`,
      vov: r.vov,
      value: categoryOf(r.vov),
      action: ACTIONS[r.action] || "TRADE",
      price: r.price,
      date: r.date,
      location: locations.get(r.vov) || null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// The values a transaction poem weaves together: the traded value first,
// then the distinct values that were traded just before it (the market flow
// that led to it). Newest-first `transactions` is expected.
export function valuesForTransaction(tx, transactions) {
  const want = arityFor(tx.id);
  const values = [tx.value];
  const start = transactions.findIndex((t) => t.id === tx.id);
  for (let i = start + 1; i < transactions.length && values.length < want; i++) {
    const v = transactions[i].value;
    if (!values.includes(v)) values.push(v);
  }
  const rand = seededRandom(`fill:${tx.id}`);
  while (values.length < want) {
    const v = VALUES[Math.floor(rand() * VALUES.length)];
    if (!values.includes(v)) values.push(v);
  }
  return values;
}

export function grammarPoemFor(tx, transactions) {
  const values = valuesForTransaction(tx, transactions);
  return {
    id: tx.id,
    ...compose(values, { seed: tx.id }),
    source: "grammar",
    tx,
  };
}

export function describeTransaction(tx) {
  const price = /VOV$/.test(tx.price || "") ? tx.price.replace("VOV", " VOV") : tx.price ? `$${tx.price}` : "";
  const verb = { ASK: "offered for", SOLD: "sold for", SWAP: "swapped for", TRADE: "traded" }[tx.action];
  return [tx.vov, verb, price].filter(Boolean).join(" ");
}
