// Where the pages get their poems: the Node server when it runs (AI poems),
// otherwise straight from the VOV API with grammar poems (static hosting).
import { compose } from "./grammar.js";
import { fetchMarket, grammarPoemFor } from "./market.js";

let staticMarket = null;

async function marketDirect() {
  staticMarket ??= await fetchMarket();
  return staticMarket;
}

export async function getFeed(limit = 120) {
  try {
    const res = await fetch(`api/feed?limit=${limit}`);
    if (!res.ok) throw new Error(res.status);
    return { ...(await res.json()), mode: "server" };
  } catch {
    const market = await marketDirect();
    return {
      mode: "static",
      ai: { enabled: false },
      poems: market.transactions.slice(0, limit).map((tx) => grammarPoemFor(tx, market.transactions)),
      market: { totalVovs: market.totalVovs, transactions: market.transactions.length, fetchedAt: market.fetchedAt },
    };
  }
}

export async function getMarket() {
  try {
    const res = await fetch("api/market");
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch {
    const market = await marketDirect();
    return { median: market.median, totalVovs: market.totalVovs };
  }
}

// Ask the server for an AI poem; fall back to the grammar in the browser.
export async function composePoem(values, { ai = true } = {}) {
  if (ai) {
    try {
      const res = await fetch("api/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || res.status);
      return body;
    } catch (err) {
      return { ...compose(values), source: "grammar", fallbackReason: String(err.message || err) };
    }
  }
  return { ...compose(values), source: "grammar" };
}
