// Poem text conventions shared with www.v-o-v.io:
//   - "#" (surrounded by spaces) is a line break
//   - a value is written in UPPERCASE and is the only uppercase word in the poem
import { VALUE_COLORS } from "./grammar.js";

const VALUE_TOKEN = /\b[A-Z]{2,}\b/g;

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Dark value colours (KINDNESS, STRENGTH…) disappear on black: lift them.
export function legibleColor(hex = "#ffffff") {
  const n = parseInt(hex.slice(1), 16);
  let [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum < 0.38) {
    const t = Math.min(0.6, 0.38 - lum + 0.25);
    [r, g, b] = [r, g, b].map((c) => Math.round(c + (255 - c) * t));
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export function valuesIn(text) {
  return [...new Set(text.match(VALUE_TOKEN) || [])];
}

export function poemToHtml(text) {
  return text
    .split(/\s+#\s+|\s*#\s*/)
    .map((line) =>
      escapeHtml(line.trim()).replace(VALUE_TOKEN, (word) => {
        const color = VALUE_COLORS[word];
        const style = color ? ` style="--value:${legibleColor(color)}"` : "";
        return `<b class="value"${style}>${word}</b>`;
      }),
    )
    .join("<br>");
}

export function poemToPlain(text) {
  return text.replace(/\s*#\s*/g, " / ");
}
