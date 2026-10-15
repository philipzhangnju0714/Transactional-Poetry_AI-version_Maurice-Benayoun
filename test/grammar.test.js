import { test } from "node:test";
import assert from "node:assert/strict";
import { SHEET_TEMPLATES, LIVE_TEMPLATES, TEMPLATES, VALUES, compose, fill } from "../public/js/grammar.js";
import { poemToHtml, valuesIn } from "../public/js/format.js";
import { toTransactions, valuesForTransaction, grammarPoemFor } from "../public/js/market.js";

test("the sheet's 39 structures and its values are all present", () => {
  assert.equal(SHEET_TEMPLATES.length, 39);
  assert.equal(LIVE_TEMPLATES.length, 55);
  for (const v of ["ANARCHY", "AUTHENTICITY", "CREATIVITY", "DESIRE", "FINANCE", "FRIENDSHIP", "SOCIAL", "WISDOM"]) {
    assert.ok(VALUES.includes(v), v);
  }
});

test("slots keep their roles; a template without {A} still carries the traded value", () => {
  assert.equal(fill("Give me your {B} and take my {A}", ["LOVE", "MONEY"]), "Give me your MONEY and take my LOVE");
  assert.equal(fill("What I really want is your {B}", ["LOVE"]), "What I really want is your LOVE");
  assert.equal(fill("what is important, if not {D}?", ["TRUST"]), "what is important, if not TRUST?");
});

test("compose uses every value when a structure of that size exists, deterministically", () => {
  for (const values of [["LOVE"], ["LOVE", "MONEY"], ["LOVE", "MONEY", "TRUST"], ["LOVE", "MONEY", "TRUST", "TIME"]]) {
    for (let seed = 0; seed < 40; seed++) {
      const poem = compose(values, { seed });
      assert.deepEqual(new Set(valuesIn(poem.text)), new Set(values), poem.text);
      assert.deepEqual(compose(values, { seed }), poem);
    }
  }
});

test("every template renders without leftover slots", () => {
  for (const t of TEMPLATES) {
    const text = fill(t.text, ["LOVE", "MONEY", "TRUST", "TIME"]);
    assert.doesNotMatch(text, /\{[A-D]\}/, t.text);
  }
});

test("poems render like v-o-v.io: # breaks lines, values are highlighted, HTML is escaped", () => {
  const html = poemToHtml("I gave <so> much LOVE # to get some MONEY");
  assert.match(html, /<br>/);
  assert.match(html, /<b class="value" style="--value:[^"]+">LOVE<\/b>/);
  assert.match(html, /&lt;so&gt;/);
});

test("every transaction gets a grammar poem carrying its own value", () => {
  const txs = toTransactions([
    { vov: "PEACE0319", action: "ASK", price: "1,600.00", date: "2025-12-29T03:11:56" },
    { vov: "KNOWLEDGE2240", action: "SWAP", price: "2VOV", date: "2025-03-22T13:54:15" },
    { vov: "LOVE0001", action: null, price: null, date: "2024-01-01T00:00:00" },
  ]);
  assert.deepEqual(txs.map((t) => [t.value, t.action]), [["PEACE", "ASK"], ["KNOWLEDGE", "SWAP"], ["LOVE", "TRADE"]]);
  for (const tx of txs) {
    const values = valuesForTransaction(tx, txs);
    assert.equal(values[0], tx.value);
    assert.equal(new Set(values).size, values.length);
    assert.ok(valuesIn(grammarPoemFor(tx, txs).text).includes(tx.value));
  }
});
