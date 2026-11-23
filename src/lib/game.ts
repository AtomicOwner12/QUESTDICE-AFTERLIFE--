export const GOAL = 150;
export const SPECIAL_COUNT = 50;
export const DEATH_COUNT = 15;
export const CLICK_COUNT = 15;
export const QUIZ_COUNT = 5;
export const SHOP_COUNT = 10;
export const TAX_COUNT = 10;
export const HELP_COUNT = 10;
/** Location-unique platforms per board. */
export const LOCAL_COUNT = 8;
/** Time window (ms) to hit each Death-Penalty quick-time button. */
export const QTE_WINDOW_MS = 1000;
export const QTE_ROUNDS = 3;

export type TileType = "empty" | "task" | "special" | "bad" | "death" | "click" | "quiz" | "shop" | "tax" | "help" | "local" | "demon" | "angel" | "start" | "goal" | `remake-${number}` | `custom-${number}`;

export const SKINS = [
  { id: "penguin", name: "Pinguin", emoji: "🐧" },
  { id: "tiger", name: "Tiger", emoji: "🐯" },
  { id: "human", name: "Mensch", emoji: "🧑" },
  { id: "frog", name: "Frosch", emoji: "🐸" },
  { id: "robot", name: "Roboter", emoji: "🤖" },
  { id: "fox", name: "Fuchs", emoji: "🦊" },
  { id: "alien", name: "Alien", emoji: "👾" },
  { id: "unicorn", name: "Einhorn", emoji: "🦄" },
  { id: "cat", name: "Katze", emoji: "🐱" },
  { id: "dog", name: "Hund", emoji: "🐶" },
  { id: "lion", name: "Löwe", emoji: "🦁" },
  { id: "bear", name: "Bär", emoji: "🐻" },
  { id: "panda", name: "Panda", emoji: "🐼" },
  { id: "koala", name: "Koala", emoji: "🐨" },
  { id: "monkey", name: "Affe", emoji: "🐵" },
  { id: "pig", name: "Schwein", emoji: "🐷" },
  { id: "cow", name: "Kuh", emoji: "🐮" },
  { id: "mouse", name: "Maus", emoji: "🐭" },
  { id: "hamster", name: "Hamster", emoji: "🐹" },
  { id: "rabbit", name: "Hase", emoji: "🐰" },
  { id: "wolf", name: "Wolf", emoji: "🐺" },
  { id: "owl", name: "Eule", emoji: "🦉" },
  { id: "chick", name: "Küken", emoji: "🐥" },
  { id: "eagle", name: "Adler", emoji: "🦅" },
  { id: "duck", name: "Ente", emoji: "🦆" },
  { id: "parrot", name: "Papagei", emoji: "🦜" },
  { id: "flamingo", name: "Flamingo", emoji: "🦩" },
  { id: "octopus", name: "Krake", emoji: "🐙" },
  { id: "shark", name: "Hai", emoji: "🦈" },
  { id: "whale", name: "Wal", emoji: "🐳" },
  { id: "dolphin", name: "Delfin", emoji: "🐬" },
  { id: "turtle", name: "Schildkröte", emoji: "🐢" },
  { id: "snake", name: "Schlange", emoji: "🐍" },
  { id: "croc", name: "Krokodil", emoji: "🐊" },
  { id: "dragon", name: "Drache", emoji: "🐉" },
  { id: "dino", name: "Dino", emoji: "🦖" },
  { id: "trex", name: "Saurier", emoji: "🦕" },
  { id: "bee", name: "Biene", emoji: "🐝" },
  { id: "ladybug", name: "Marienkäfer", emoji: "🐞" },
  { id: "butterfly", name: "Schmetterling", emoji: "🦋" },
  { id: "snail", name: "Schnecke", emoji: "🐌" },
  { id: "crab", name: "Krabbe", emoji: "🦀" },
  { id: "horse", name: "Pferd", emoji: "🐴" },
  { id: "zebra", name: "Zebra", emoji: "🦓" },
  { id: "giraffe", name: "Giraffe", emoji: "🦒" },
  { id: "elephant", name: "Elefant", emoji: "🐘" },
  { id: "hedgehog", name: "Igel", emoji: "🦔" },
  { id: "sloth", name: "Faultier", emoji: "🦥" },
  { id: "ghost", name: "Geist", emoji: "👻" },
  { id: "skull", name: "Skelett", emoji: "💀" },
  { id: "clown", name: "Clown", emoji: "🤡" },
  { id: "ninja", name: "Ninja", emoji: "🥷" },
  { id: "wizard", name: "Zauberer", emoji: "🧙" },
  { id: "vampire", name: "Vampir", emoji: "🧛" },
  { id: "zombie", name: "Zombie", emoji: "🧟" },
  { id: "astronaut", name: "Astronaut", emoji: "🧑‍🚀" },
  { id: "pumpkin", name: "Kürbis", emoji: "🎃" },
  { id: "poop", name: "Häufchen", emoji: "💩" },
] as const;

export { TASKS, QUICK_TASKS, MINIGAMES, DEATH_GAMES, type Minigame, type DeathGame } from "./content";
import { QUICK_TASKS } from "./content";

export type BadEffect =
  | { kind: "back"; steps: number }
  | { kind: "start" }
  | { kind: "quick"; task: string };

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Builds 151 tiles: index 0 = start, index 150 = goal. */
export function buildBoard(seed = 42): TileType[] {
  const r = rng(seed);
  const tiles: TileType[] = ["start"];
  for (let i = 1; i < GOAL; i++) {
    const x = r();
    tiles.push(x < 0.4 ? "empty" : x < 0.72 ? "task" : "bad");
  }
  tiles.push("goal");
  const idx = Array.from({ length: GOAL - 1 }, (_, i) => i + 1);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const a = idx[i], b = idx[j];
    if (a !== undefined && b !== undefined) [idx[i], idx[j]] = [b, a];
  }
  idx.slice(0, SPECIAL_COUNT).forEach((i) => (tiles[i] = "special"));
  idx.slice(SPECIAL_COUNT, SPECIAL_COUNT + DEATH_COUNT).forEach((i) => (tiles[i] = "death"));
  idx.slice(SPECIAL_COUNT + DEATH_COUNT, SPECIAL_COUNT + DEATH_COUNT + CLICK_COUNT).forEach((i) => (tiles[i] = "click"));
  idx.slice(SPECIAL_COUNT + DEATH_COUNT + CLICK_COUNT, SPECIAL_COUNT + DEATH_COUNT + CLICK_COUNT + QUIZ_COUNT).forEach((i) => (tiles[i] = "quiz"));
  const o = SPECIAL_COUNT + DEATH_COUNT + CLICK_COUNT + QUIZ_COUNT;
  idx.slice(o, o + SHOP_COUNT).forEach((i) => (tiles[i] = "shop"));
  idx.slice(o + SHOP_COUNT, o + SHOP_COUNT + TAX_COUNT).forEach((i) => (tiles[i] = "tax"));
  idx.slice(o + SHOP_COUNT + TAX_COUNT, o + SHOP_COUNT + TAX_COUNT + HELP_COUNT).forEach((i) => (tiles[i] = "help"));
  const h = o + SHOP_COUNT + TAX_COUNT + HELP_COUNT;
  idx.slice(h, h + LOCAL_COUNT).forEach((i) => (tiles[i] = "local"));
  return tiles;
}

export function move(pos: number, roll: number) {
  return Math.min(GOAL, pos + roll);
}

export function applyBad(pos: number, effect: BadEffect) {
  if (effect.kind === "back") return Math.max(0, pos - effect.steps);
  if (effect.kind === "start") return 0;
  return pos;
}

export function randomBad(): BadEffect {
  const x = Math.random();
  if (x < 0.7) return { kind: "back", steps: 3 };
  return { kind: "quick", task: pick(QUICK_TASKS) };
}

export function pick<T>(arr: readonly T[]): T {
  const value = arr[Math.floor(Math.random() * arr.length)];
  if (value === undefined) throw new Error("Cannot pick from an empty pool");
  return value;
}

/**
 * Deterministic horizontal drift of tile `index` on player `player`'s lane,
 * normalized to -1..1. Each player's phases differ, so every lane winds
 * irregularly and differently from the others.
 */
export function laneDrift(index: number, player: number): number {
  const p = player + 1;
  const v =
    Math.sin(index * 0.62 + p * 1.7) * 0.55 +
    Math.sin(index * 0.27 + p * 2.9) * 0.3 +
    Math.sin(index * 1.37 + p * 0.8) * 0.15;
  return Math.max(-1, Math.min(1, v));
}



/** 2v2: players 0 & 2 form team 0, players 1 & 3 form team 1 (turns alternate between teams). */
export const teamOf = (player: number) => player % 2;

/** Returns the team whose members have all reached the goal, or null. */
export function teamWinner(finished: number[], playerCount: number): number | null {
  for (const team of [0, 1]) {
    const members = Array.from({ length: playerCount }, (_, i) => i).filter((i) => teamOf(i) === team);
    if (members.length && members.every((m) => finished.includes(m))) return team;
  }
  return null;
}
