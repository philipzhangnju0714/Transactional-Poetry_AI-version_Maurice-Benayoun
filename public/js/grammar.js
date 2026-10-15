// Transactional Poetry grammar — shared by the browser and the Node server.
//
// Slots keep the meaning they have in Maurice Benayoun's sheet:
//   A = the value that is given / put on the market
//   B = the value that is wanted / received in return
//   C, D = what the exchange produces, or what is cherished above all
// A transaction poem always carries the transacted value: when a template has
// no A slot, its first slot receives that value instead.
//
// "#" marks a line break, exactly as on www.v-o-v.io/poetry.

// From Poetry_structures.xls (Maurice Benayoun, 2019), verbatim.
export const SHEET_TEMPLATES = [
  "{B} may be like {A}, but I chose {B}",
  "for me {B} means much more than {A}",
  "can we say {A} worths like {B}?",
  "I always preferred {B} to {A}",
  "{A} or {B}? make a choice!",
  "{A} is more or less like {B}",
  "I gave so much {A} to get some {B}",
  "with a bit of {A} you get more {B}",
  "What I really want is your {B}",
  "Give me your {B} and take my {A}",
  "Take my {A}, I'll give you my {B}",
  "{A} and {B} together make pretty {C}",
  "{A} and {B} are mere {C}",
  "it takes {A} and {B} to make pure {C}",
  "in {C} there is a bit of {A} and also some {B}",
  "with {A} and {B} you get {C}",
  "I can give all my {A} for a bit of {C}",
  "I cherish {C} above all",
  "it takes {A}, {B}, and {C} to get pure {D}",
  "I'm glad to give {A} and {B}... to get {C}",
  "what is important, if not {D}?",
  "I would give everything for a bit of your {A}",
  "The future is in {B}, take my {A} for it",
  "I loved so much {A}, now I'm more into {B}",
  "My friends want more {A}, why?",
  "all my enemies want {A}... me too!",
  "yesterday {A}, today {B}, tomorrow...",
  "yesterday I sang {A}, today it will be {B}",
  "you repeat {A}, {A}, {A}... try {B} now!",
  "I always give away my {A}, it doesn't make sense to me!",
  "I don't really care about {A}, it is just about numbers!",
  "I love your {B}... such a beautiful number!",
  "never tell how many {A} you got, just say how much",
  "When you already have a lot of {A}, you seek more {B}",
  "I will always say no to {A}, and yes to {B}",
  "Even though I kind of like {A}, I always buy {B}",
  "I know you want my {A}, it will cost your {B}",
  "I got your {B}. What am I missing now?",
  "If you want my {A}, fine! But don't ask for getting your {B} back",
];

// The structures currently served by api.v-o-v.io/api/v1/tokens/poetry/
// (Maurice's later revisions and additions), turned back into templates.
export const LIVE_TEMPLATES = [
  "Don't pretend you believe in {A} # if you give it away",
  "Forget {A}, I prefer {B}",
  "Give me your {A} # and take my {B}",
  "I always give away my {A}, # it doesn't make sense to me!",
  "I always prefer {A} to {B}",
  "I cherish {A} above all",
  "I especially love your {A}, # such a beautiful number!",
  "I gave so much {A} # just to get some {B}",
  "I got your {A}. What am I missing now?",
  "I know you want my {A}, # it will cost you your {B}",
  "I lost {A}, but I won {B}",
  "I loved {A} so much, # now I'm more into {B}",
  "I will always say no to {A}, # and yes to {B}",
  "I won't regret {A}, # if I reach {B}",
  "I would give everything # for a bit of your {A}",
  "I'm glad to give {A} and {B}, # to get {C}",
  "I'm ready to give up my {A} # for a bit of {B}",
  "My friends want more {A}, why not?",
  "Some believe in {A}, # others dream of {B}... It is fine with me!",
  "Take my {A}, # and give me your {B}",
  "The future is in {A}, # take my {B} for it",
  "What I really want is your {A}",
  "When you already have a lot of {A}, # you seek more {B}",
  "When {A} leaves you, # then comes {B}.",
  "You want my {A}? fine! # But don't ask me for your {B} back",
  "all my enemies want {A}. # Me too!",
  "can we really afford {A}?",
  "can we say the worth of {A} # equals that of {B}?",
  "don't confuse believing in {A}, # and knowing {A}",
  "for me {A} means # much more than {B}",
  "in {A} there is a bit of {B} # and also some {C}",
  "it takes {A} and {B} # to make real {C}",
  "it takes {A}, {B}, and {C} # to get pure {D}",
  "like all words made of letters, # {A} is worth nothing, only figures.",
  "please... give me your {A}!",
  "she had too much {A}, # he offered his {B}. Deal!",
  "stop dreaming! # take my {A} and kiss me",
  "the flag of {A} # was floating high in my sky.",
  "what is important, # if not {A}?",
  "with a lot of {A} # you get more {B}",
  "with {A} and {B}, you get true {C}",
  "yesterday I sang {A}, # today it will praise {B}",
  "yesterday {A}, # today {B}, tomorrow...",
  "{A} against {B}... I win!",
  "{A} and {B} make a nice {C}",
  "{A} and {B} together # make a strong {C}",
  "{A} at dawn, {B} at dusk, # and now {C}",
  "{A} gives you {B}... take it!",
  "{A} is desirable, # {B} is necessary",
  "{A} is light, # {B} is darkness, dreaming of blue",
  "{A} is more or less like {B}",
  "{A} may be no more than {B}, # but it is my choice!",
  "{A} or {B}? # make a choice!",
  "{A}! she said",
  "{A}, {A}, {A}. # You should try {B} now!",
];

// Value colours as published by api.v-o-v.io/api/v1/chart/vov-colors/.
// The five values that only appear in the sheet get colours of our own.
export const VALUE_COLORS = {
  ANARCHY: "#ffff01", ART: "#14c991", AUTHENTICITY: "#c9a227", AUTONOMY: "#277b95",
  BEAUTY: "#ff0000", COMPASSION: "#f8c6b3", CREATIVITY: "#ff8ad8", DEMOCRACY: "#0a39fe",
  DESIRE: "#e0115f", EQUALITY: "#e59ebc", FAIRNESS: "#d72931", FAITH: "#14cabd",
  FAME: "#fd9f00", FAMILY: "#268654", FINANCE: "#b8d900", FREEDOM: "#6666ff",
  FRIENDSHIP: "#40bfea", GENEROSITY: "#fe78e9", HAPPINESS: "#007add", HONESTY: "#fa5758",
  HUMOR: "#57f5ff", INTEGRITY: "#9fa5f5", INTELLIGENCE: "#3a59c3", JUSTICE: "#e58054",
  KINDNESS: "#000099", KNOWLEDGE: "#00ff00", LOVE: "#ff0449", LOYALTY: "#c2c1c3",
  MODESTY: "#47af86", MONEY: "#fbcb37", OPENNESS: "#0099ff", PEACE: "#a20e00",
  PLEASURE: "#af0083", POWER: "#fe5c07", PRIVACY: "#66bd8e", PURITY: "#479eaf",
  RESPECT: "#996633", SECURITY: "#525579", SEX: "#fd02fe", SOCIAL: "#7fd1b9",
  SPACE: "#9cd2ee", STRENGTH: "#1b2c56", SUCCESS: "#f4c2c1", TIME: "#92549d",
  TRUST: "#315199", TRUTH: "#00f395", WISDOM: "#64879b",
};

export const VALUES = Object.keys(VALUE_COLORS);

const SLOT_RE = /\{([A-D])\}/g;

export function slotsOf(template) {
  return [...new Set([...template.matchAll(SLOT_RE)].map((m) => m[1]))].sort();
}

export const TEMPLATES = [
  ...SHEET_TEMPLATES.map((t) => ({ text: t, source: "sheet", slots: slotsOf(t) })),
  ...LIVE_TEMPLATES.map((t) => ({ text: t, source: "live", slots: slotsOf(t) })),
];

// Deterministic randomness so a transaction always reads the same poem.
export function seededRandom(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

// Fill a template. `values` is the ordered list of distinct values available:
// values[0] is the transacted value, the rest are its market neighbours.
export function fill(template, values) {
  const slots = slotsOf(template);
  const roles = {};
  slots.forEach((slot, i) => {
    roles[slot] = values[i];
  });
  return template.replace(SLOT_RE, (_, s) => roles[s]);
}

// Compose a grammar poem out of up to four values (values[0] always appears).
export function compose(values, { seed = Math.random(), source } = {}) {
  const rand = seededRandom(seed);
  const distinct = [...new Set(values.map((v) => v.toUpperCase()))];
  const pool = TEMPLATES.filter(
    (t) => t.slots.length <= distinct.length && (!source || t.source === source),
  );
  // Use every offered value when a structure of that size exists.
  const best = Math.max(...pool.map((t) => t.slots.length));
  const template = pick(rand, pool.filter((t) => t.slots.length === best));
  const text = fill(template.text, distinct);
  return {
    text,
    template: template.text,
    templateSource: template.source,
    values: distinct.slice(0, template.slots.length),
  };
}

// How many values a transaction poem should weave together.
export function arityFor(seed) {
  const r = seededRandom(`arity:${seed}`)();
  return r < 0.25 ? 1 : r < 0.75 ? 2 : r < 0.95 ? 3 : 4;
}
