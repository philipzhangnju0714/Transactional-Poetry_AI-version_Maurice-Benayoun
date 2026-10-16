// Builds the exhibition package: an offline player (one HTML file), stills and
// two 1920×1080 videos (a presentation with title cards, and a seamless loop).
//
//   node exhibition/render.mjs [outDir]        (default: dist/exhibition)
//
// Needs ffmpeg (with libx264) and Chromium; set CHROME_PATH if Playwright
// cannot find a browser on its own.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const here = new URL(".", import.meta.url);
const read = (p) => readFileSync(new URL(p, here));
const out = resolve(process.argv[2] || "dist/exhibition");
const frames = join(out, ".frames");
const VERSION = JSON.parse(read("../package.json")).version;

// ---- 1. offline player ----------------------------------------------------------
const font = (family, weight, file) =>
  `@font-face { font-family: "${family}"; font-weight: ${weight}; font-display: block; src: url(data:font/woff2;base64,${read(`fonts/${file}`).toString("base64")}) format("woff2"); }`;
const fonts = [
  font("Archivo Black", 400, "ArchivoBlack-Regular.woff2"),
  font("Space Mono", 400, "SpaceMono-Regular.woff2"),
  font("Space Mono", 700, "SpaceMono-Bold.woff2"),
].join("\n  ");
const player = read("player.template.html")
  .toString()
  .replace("/*__FONTS__*/", () => fonts)
  .replace("/*__POEMS__*/", () => read("poems.json").toString())
  .replace("/*__VERSION__*/", `v${VERSION}`);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "player.html"), player);

// The poems as text, one trade per entry: the artist's grammar line next to the AI line.
const flat = (t) => t.replace(/\s*#\s*/g, " / ");
const list = JSON.parse(read("poems.json")).poems.map((p, i) =>
  [`${String(i + 1).padStart(2, "0")}  ${p.tx.vov}  ${p.tx.action} ${p.tx.price}  ${p.tx.location || ""}  ${p.tx.date.slice(0, 10)}`,
   `    values:   ${p.values.join(", ")}`,
   `    grammar:  ${flat(p.grammar)}`,
   `    AI:       ${flat(p.ai)}`].join("\n"));
writeFileSync(join(out, "poems.txt"), `Transactional Poetry, AI version v${VERSION}: ${list.length} real trades\n\n${list.join("\n\n")}\n`);

// ---- 2. stills ------------------------------------------------------------------
rmSync(frames, { recursive: true, force: true });
mkdirSync(join(out, "stills"), { recursive: true });
mkdirSync(frames, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${pathToFileURL(join(out, "player.html"))}?render`);
await page.evaluate(() => document.fonts.ready);

async function shoot(name, fn, arg) {
  await page.evaluate(([f, a]) => window.__render[f](...a), [fn, arg]);
  await page.waitForTimeout(50);
  const file = join(frames, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}
const count = await page.evaluate(() => window.__render.count);
const shots = { intro: await shoot("intro", "card", ["intro"]), how: await shoot("how", "card", ["how"]), poems: [] };
for (let i = 0; i < count; i++) shots.poems.push(await shoot(`poem-${String(i).padStart(2, "0")}`, "poem", [i, "ai"]));
shots.end = await shoot("end", "card", ["end"]);
await browser.close();
for (const [i, f] of shots.poems.entries()) writeFileSync(join(out, "stills", `poem-${String(i + 1).padStart(2, "0")}.png`), readFileSync(f));
writeFileSync(join(out, "stills", "how-it-works.png"), readFileSync(shots.how));

// ---- 3. videos --------------------------------------------------------------------
const FADE = 0.8;
function clip(png, seconds, name) {
  const file = join(frames, `${name}.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-loop", "1", "-t", String(seconds), "-i", png,
    "-vf", `fade=t=in:st=0:d=${FADE},fade=t=out:st=${seconds - FADE}:d=${FADE},format=yuv420p`,
    "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "stillimage", file,
  ]);
  return file;
}
function concat(clips, name) {
  const list = join(frames, `${name}.txt`);
  writeFileSync(list, clips.map((c) => `file '${c}'`).join("\n"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", join(out, name)]);
}
const poemClips = shots.poems.map((png, i) => clip(png, 7, `poem-${i}`));
concat([clip(shots.intro, 5, "intro"), clip(shots.how, 10, "how"), ...poemClips, clip(shots.end, 5, "end")], "transactional-poetry-ai_presentation_1080p.mp4");
concat(poemClips, "transactional-poetry-ai_exhibition-loop_1080p.mp4");
rmSync(frames, { recursive: true, force: true });
console.log(`Exhibition package written to ${out}`);
