// Help-platform sidekicks: each has exactly one unique ability (kind + value).
export type SidekickKind =
  | "rollPlus" | "minRoll" | "sixBonus" | "evenBonus" | "oddBonus" | "oneBoost"
  | "coinsTurn" | "coinMult" | "emptyCoins" | "taskCoins" | "behindCoins"
  | "badReduce" | "deathReduce" | "shopDiscount" | "taxImmune" | "freezeImmune";
export type Sidekick = { id: string; name: string; emoji: string; kind: SidekickKind; value: number; desc: string };

export const HELP_COST = 10;

const SPEC: [SidekickKind, number[], (v: number) => string][] = [
  ["rollPlus", [1, 2, 3], (v) => `Jeder Wurf +${v}`],
  ["minRoll", [2, 3, 4, 5, 6], (v) => `Du würfelst mindestens ${v}`],
  ["sixBonus", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => `Bei einer 6: +${v} Extra-Schritte`],
  ["evenBonus", [1, 2, 3, 4, 5], (v) => `Gerade Würfe +${v}`],
  ["oddBonus", [1, 2, 3, 4, 5], (v) => `Ungerade Würfe +${v}`],
  ["oneBoost", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], (v) => `Eine 1 zählt als ${v}`],
  ["coinsTurn", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => `+${v} Münzen pro Zug`],
  ["coinMult", [2, 3], (v) => `Schritte bringen ${v}× Münzen`],
  ["emptyCoins", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => `Leeres Feld: +${v} Münzen`],
  ["taskCoins", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => `Aufgaben-Feld: +${v} Münzen`],
  ["behindCoins", [1, 2, 3, 4, 5], (v) => `+${v} Münzen je Gegner hinter dir`],
  ["badReduce", [1, 2, 3], (v) => `Unglück kostet ${v} Schritt${v > 1 ? "e" : ""} weniger`],
  ["deathReduce", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], (v) => `Death Penalty kostet ${v} Schritte weniger`],
  ["shopDiscount", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => `Shop-Items ${v} Münzen billiger`],
  ["taxImmune", [1], () => "Tax kann dir nichts stehlen"],
  ["freezeImmune", [1], () => "Eisblock wirkt nicht bei dir"],
];

const ANIMALS: [string, string][] = [
  ["🐶", "Hund"], ["🐱", "Katze"], ["🐭", "Maus"], ["🐹", "Hamster"], ["🐰", "Hase"], ["🦝", "Waschbär"], ["🐻", "Bär"], ["🐼", "Panda"],
  ["🐨", "Koala"], ["🦁", "Löwe"], ["🐮", "Kuh"], ["🐷", "Schwein"], ["🐵", "Affe"], ["🐔", "Huhn"], ["🦉", "Eule"], ["🦆", "Ente"],
  ["🦅", "Adler"], ["🐺", "Wolf"], ["🐗", "Keiler"], ["🐴", "Pferd"], ["🐝", "Biene"], ["🐢", "Schildkröte"], ["🐍", "Schlange"], ["🦖", "Dino"],
  ["🐙", "Oktopus"], ["🦀", "Krabbe"], ["🐬", "Delfin"], ["🦈", "Hai"], ["🦒", "Giraffe"], ["🦔", "Igel"], ["🦥", "Faultier"], ["🐉", "Drache"],
  ["🦩", "Flamingo"], ["🦜", "Papagei"], ["🐌", "Schnecke"], ["🦦", "Otter"], ["🐧", "Pinguin"], ["🧚", "Fee"], ["👻", "Geist"], ["🤖", "Bot"],
];
const TITLES = ["Turbo", "Glücks", "Gold", "Ninja", "Zauber", "Mega", "Blitz", "Schatten", "Sternen", "Disco", "Pixel", "Retro", "Kosmo", "Magma", "Frost"];

export const SIDEKICKS: Sidekick[] = SPEC.flatMap(([kind, values, text]) => values.map((value) => ({ kind, value, desc: text(value) }))).map((a, i) => {
  const [emoji, animal] = ANIMALS[i % ANIMALS.length]!;
  const title = TITLES[Math.floor(i / ANIMALS.length) * 5 % TITLES.length + (i % 5)]!;
  return { id: `${a.kind}-${a.value}`, name: `${title}-${animal}`, emoji, ...a };
});

const has = (sk: Sidekick | null | undefined, kind: SidekickKind) => (sk && sk.kind === kind ? sk.value : 0);

/** Dice face after the sidekick ability. */
export function sidekickRoll(face: number, sk: Sidekick | null | undefined) {
  let r = face;
  if (face === 1 && has(sk, "oneBoost")) r = has(sk, "oneBoost");
  r = Math.max(r, has(sk, "minRoll"));
  r += has(sk, "rollPlus");
  if (face === 6) r += has(sk, "sixBonus");
  if (face % 2 === 0) r += has(sk, "evenBonus"); else r += has(sk, "oddBonus");
  return r;
}

/** Coins earned for a move of `steps` landing on `tile`, with `behind` opponents behind the player. */
export function sidekickCoins(steps: number, tile: string | undefined, behind: number, sk: Sidekick | null | undefined) {
  return steps * (has(sk, "coinMult") || 1) + has(sk, "coinsTurn") + (tile === "empty" ? has(sk, "emptyCoins") : 0)
    + (tile === "task" ? has(sk, "taskCoins") : 0) + behind * has(sk, "behindCoins");
}

/** Penalty steps after reduction (never negative). */
export function sidekickPenalty(kind: "bad" | "death", steps: number, sk: Sidekick | null | undefined) {
  return Math.max(0, steps - has(sk, kind === "bad" ? "badReduce" : "deathReduce"));
}

export const shopDiscount = (sk: Sidekick | null | undefined) => has(sk, "shopDiscount");
export const isImmune = (sk: Sidekick | null | undefined, what: "tax" | "freeze") => has(sk, what === "tax" ? "taxImmune" : "freezeImmune") > 0;
