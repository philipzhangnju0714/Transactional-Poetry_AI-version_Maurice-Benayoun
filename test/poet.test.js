// Runs the AI path against a local stand-in for the Anthropic API.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

let replies = [];
const requests = [];
const mock = createServer(async (req, res) => {
  let body = "";
  for await (const c of req) body += c;
  requests.push({ headers: req.headers, body: JSON.parse(body) });
  const text = replies.shift() ?? "";
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({
    id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5",
    content: [{ type: "text", text }], stop_reason: "end_turn", stop_details: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  }));
});

let poet;
before(async () => {
  await new Promise((r) => mock.listen(0, r));
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  poet = await import("../src/poet.js");
});
after(() => mock.close());

const tx = { id: "PEACE0319@2025-12-29", vov: "PEACE0319", value: "PEACE", action: "ASK", price: "1,600.00", date: "2025-12-29" };

test("an AI poem is accepted when it uses exactly the given values", async () => {
  replies = ["\"I priced my PEACE # so you could afford your TRUST\""];
  const poem = await poet.writePoem(tx, ["PEACE", "TRUST"], { median: { PEACE: { count: 10, median: 610 } } });
  assert.equal(poem.source, "ai");
  assert.equal(poem.text, "I priced my PEACE # so you could afford your TRUST");
  const req = requests.at(-1);
  assert.equal(req.body.model, "claude-opus-5-5");
  assert.equal(req.body.fallbacks, "default");
  assert.match(req.headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.match(req.body.messages[0].content, /Values to use: PEACE, TRUST/);
  assert.match(req.body.messages[0].content, /median asking price 610/);
});

test("a malformed answer is retried, then the grammar takes over", async () => {
  replies = ["PEACE is a USD thing", "no values at all"];
  const poem = await poet.writePoem(tx, ["PEACE"], {});
  assert.equal(poem.source, "grammar");
  assert.match(poem.fallbackReason, /missing PEACE/);
  assert.ok(poem.text.includes("PEACE"));
});

test("validation rules", () => {
  assert.equal(poet.validatePoem("I sold my LOVE", ["LOVE"]), null);
  assert.match(poet.validatePoem("I sold my LOVE for VOV", ["LOVE"]), /unexpected uppercase VOV/);
  assert.match(poet.validatePoem("a # b # LOVE", ["LOVE"]), /two lines/);
  assert.equal(poet.cleanPoem("“first line\nsecond LOVE”"), "first line # second LOVE");
});
