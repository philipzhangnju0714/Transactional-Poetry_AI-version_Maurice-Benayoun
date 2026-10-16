// Builds exhibition/poems.json: the 16 most recent trades of the market snapshot,
// each with its grammar poem and an AI poem. The AI poems below were written by
// Claude during development, following the prompt in public/js/prompt.js; every
// one is checked by the same validator the live server uses.
import { readFileSync, writeFileSync } from "node:fs";
import { grammarPoemFor, valuesForTransaction } from "../public/js/market.js";
import { validatePoem } from "../public/js/prompt.js";

const AI = {
  PEACE0319: "I put a price on my PEACE # and the buyer paid in KNOWLEDGE.",
  KNOWLEDGE0395: "Sell me your KNOWLEDGE, keep the COMPASSION, # I will pay the difference in HUMOR.",
  COMPASSION0275: "So little for my COMPASSION? # Then keep the change.",
  HUMOR0289: "Laugh now: my HUMOR # was worth more than your KNOWLEDGE.",
  KNOWLEDGE0388: "Everything I know about KNOWLEDGE # I learned from GENEROSITY.",
  GENEROSITY0349: "GENEROSITY bought LOVE, LOVE bought BEAUTY, # and BEAUTY never asked for POWER.",
  LOVE0285: "I sold my LOVE at market price, # BEAUTY was thrown in for free.",
  BEAUTY0346: "Who will bid on my BEAUTY # before the morning takes it back?",
  POWER0377: "My POWER went for almost nothing, # my PURITY is not for sale.",
  PURITY0406: "PURITY for FAIRNESS, FAITH for SEX: # nobody said the swap was even.",
  FAIRNESS0335: "They priced my FAIRNESS low. # That seemed fair.",
  FAITH0308: "I offered FAITH, # you asked if SEX came with it.",
  SEX0356: "SEX is selling well this season, # INTELLIGENCE stays on the shelf.",
  INTELLIGENCE0314: "If INTELLIGENCE has a price, # who was smart enough to set it?",
  SECURITY0425: "Lock my SECURITY in a vault # and sell me the key.",
  FAME0375: "Everyone knows my FAME is for sale, # that is what makes it FAME.",
};

const [, , snapshotPath] = process.argv;
const snap = JSON.parse(readFileSync(snapshotPath, "utf8"));
const txs = snap.transactions;
const poems = txs
  .filter((tx) => AI[tx.vov])
  .map((tx) => {
    const values = valuesForTransaction(tx, txs);
    const problem = validatePoem(AI[tx.vov], values);
    if (problem) throw new Error(`${tx.vov}: ${problem}`);
    return { id: tx.id, values, ai: AI[tx.vov], grammar: grammarPoemFor(tx, txs).text, tx };
  });
writeFileSync(new URL("./poems.json", import.meta.url), JSON.stringify({ snapshotTakenAt: snap.takenAt, poems }, null, 1));
console.log(`${poems.length} poems written, all valid`);
