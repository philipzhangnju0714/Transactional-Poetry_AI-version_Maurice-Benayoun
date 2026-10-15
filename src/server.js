// Transactional Poetry — AI version.
// Polls the Value of Values market, gives every transaction a poem
// (grammar first, then Claude when available) and serves the two pages.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { VALUES } from "../public/js/grammar.js";
import { fetchMarket, grammarPoemFor, valuesForTransaction } from "../public/js/market.js";
import { aiStatus, writePoem } from "./poet.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");
const STORE = join(ROOT, "data", "poems.json");

const PORT = Number(process.env.PORT || 3000);
const POLL_SECONDS = Number(process.env.POLL_SECONDS || 60);
// How many of the most recent transactions get an AI poem.
const AI_BACKFILL = Number(process.env.AI_BACKFILL || 30);

const poems = new Map(); // transaction id -> poem record (AI poems persist in data/poems.json)
let market = { transactions: [], median: {}, totalVovs: null, fetchedAt: null };
let lastError = null;

async function loadStore() {
  try {
    for (const p of JSON.parse(await readFile(STORE, "utf8"))) poems.set(p.id, p);
    console.log(`[store] ${poems.size} poems loaded`);
  } catch {
    // first run
  }
}

let saveTimer = null;
function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await mkdir(join(ROOT, "data"), { recursive: true });
    // Grammar poems are deterministic and rebuilt on start; only AI poems are kept.
    const ai = [...poems.values()].filter((p) => p.source === "ai");
    await writeFile(STORE, JSON.stringify(ai, null, 1));
  }, 1000);
}

// ---- AI queue: one poem at a time, newest transactions first --------------
const queue = [];
let working = false;

function enqueueAi(tx) {
  if (!aiStatus().enabled || queue.some((t) => t.id === tx.id)) return;
  queue.push(tx);
  drainQueue();
}

async function drainQueue() {
  if (working) return;
  working = true;
  while (queue.length && aiStatus().budgetLeftThisHour > 0) {
    const tx = queue.shift();
    const values = valuesForTransaction(tx, market.transactions);
    const poem = await writePoem(tx, values, market);
    if (poem.source === "ai") {
      poems.set(tx.id, { id: tx.id, ...poem, tx, createdAt: new Date().toISOString() });
      saveStore();
      console.log(`[poet] ${tx.vov}: ${poem.text}`);
    }
  }
  working = false;
}

// ---- market polling ---------------------------------------------------------
async function poll() {
  try {
    market = await fetchMarket();
    lastError = null;
    for (const tx of market.transactions) {
      if (!poems.has(tx.id)) {
        poems.set(tx.id, { ...grammarPoemFor(tx, market.transactions), createdAt: new Date().toISOString() });
      }
    }
    for (const tx of market.transactions.slice(0, AI_BACKFILL)) {
      if (poems.get(tx.id)?.source !== "ai") enqueueAi(tx);
    }
  } catch (err) {
    lastError = err.message;
    console.warn(`[market] ${err.message}`);
  }
}

function feed(limit) {
  return market.transactions
    .slice(0, limit)
    .map((tx) => poems.get(tx.id))
    .filter(Boolean);
}

// ---- HTTP -------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const PAGES = { "/": "/poetry.html", "/poetry": "/poetry.html", "/clean-poetry": "/poetry.html", "/dashboard": "/dashboard.html" };

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 10_000) throw new Error("body too large");
  }
  return body ? JSON.parse(body) : {};
}

const lastCompose = new Map(); // ip -> timestamp

async function handleCompose(req, res) {
  const ip = req.socket.remoteAddress;
  if (Date.now() - (lastCompose.get(ip) || 0) < 5000) return sendJson(res, 429, { error: "One poem every 5 seconds, please." });
  lastCompose.set(ip, Date.now());
  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }
  const values = [...new Set((body.values || []).map((v) => String(v).toUpperCase()))].filter((v) => VALUES.includes(v));
  if (values.length < 1 || values.length > 4) return sendJson(res, 400, { error: "Choose between 1 and 4 values." });
  const tx = { id: `compose:${values.join("+")}:${Date.now()}`, value: values[0], action: "COMPOSE" };
  const poem = await writePoem(tx, values, market);
  sendJson(res, 200, { id: tx.id, ...poem, createdAt: new Date().toISOString() });
}

async function serveStatic(pathname, res) {
  const file = normalize(join(PUBLIC, PAGES[pathname] || pathname));
  if (!file.startsWith(PUBLIC)) return sendJson(res, 403, { error: "forbidden" });
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/api/feed") {
      const limit = Math.min(Number(url.searchParams.get("limit")) || 60, 1000);
      return sendJson(res, 200, {
        poems: feed(limit),
        ai: aiStatus(),
        aiQueue: queue.length,
        market: {
          totalVovs: market.totalVovs,
          transactions: market.transactions.length,
          fetchedAt: market.fetchedAt,
          error: lastError,
        },
      });
    }
    if (url.pathname === "/api/poem") {
      const poem = poems.get(url.searchParams.get("id"));
      return poem ? sendJson(res, 200, poem) : sendJson(res, 404, { error: "unknown poem" });
    }
    if (url.pathname === "/api/market") return sendJson(res, 200, { median: market.median, totalVovs: market.totalVovs });
    if (url.pathname === "/api/compose" && req.method === "POST") return handleCompose(req, res);
    if (url.pathname === "/api/health") return sendJson(res, 200, { ok: true, poems: poems.size, ai: aiStatus() });
    return serveStatic(url.pathname, res);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "internal error" });
  }
});

await loadStore();
await poll();
setInterval(poll, POLL_SECONDS * 1000);
server.listen(PORT, () => {
  const ai = aiStatus();
  console.log(`Transactional Poetry on http://localhost:${PORT}  (AI: ${ai.enabled ? ai.model : "off — grammar only"})`);
});
