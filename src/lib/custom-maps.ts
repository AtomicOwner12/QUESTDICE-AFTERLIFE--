import type { TileType } from "./game";

/** Built-in platforms a player (or Dicey) can paint onto a custom map. */
export const BRUSHES = ["task", "special", "bad", "death", "click", "quiz", "shop", "tax", "help", "local", "empty"] as const;
export type Brush = (typeof BRUSHES)[number];
export const BRUSH_INFO: Record<Brush, { name: string; icon: string }> = {
  task: { name: "Aufgabe", icon: "!" }, special: { name: "Special", icon: "★" }, bad: { name: "Unglück", icon: "☠" },
  death: { name: "Death Penalty", icon: "💀" }, click: { name: "Click spiele", icon: "👆" }, quiz: { name: "Quiz", icon: "?" },
  shop: { name: "Shop", icon: "🛒" }, tax: { name: "Tax", icon: "💰" }, help: { name: "Help", icon: "🤝" },
  local: { name: "Orts-Feld", icon: "📍" }, empty: { name: "Leer", icon: "·" },
};

export const EFFECTS = ["steps", "coins", "shield", "task", "none"] as const;
export type CustomEffect = (typeof EFFECTS)[number];
export const EFFECT_NAMES: Record<CustomEffect, string> = { steps: "Schritte ±", coins: "Münzen ±", shield: "Schutzschild", task: "Aufgabe mit Timer", none: "Nur Spaß" };
export type CustomPlatform = { name: string; emoji: string; effect: CustomEffect; value: number; text: string };

/** Fields between start and goal. No design cap; this only protects storage and the browser. */
export const MIN_TILES = 10;
export const MAX_TILES = 100_000;
export const MAX_PLATFORMS = 24;

export type MapTile = Brush | `custom-${number}`;
export type PlayableMap = { id?: string | undefined; title: string; tiles: MapTile[]; platforms: CustomPlatform[]; dice: number };

export const customTile = (i: number): MapTile => `custom-${i}`;
export const customIndex = (tile: string): number | null => (tile.startsWith("custom-") ? Number(tile.slice(7)) : null);

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));

export function cleanPlatform(p: Partial<CustomPlatform>): CustomPlatform {
  const effect = EFFECTS.includes(p.effect as CustomEffect) ? (p.effect as CustomEffect) : "none";
  const limit = effect === "task" ? 300 : 50;
  return {
    name: String(p.name ?? "Custom").trim().slice(0, 30) || "Custom",
    emoji: [...String(p.emoji ?? "✨").trim()].slice(0, 2).join("") || "✨",
    effect,
    value: effect === "task" ? clamp(p.value ?? 30, 5, limit) : effect === "shield" || effect === "none" ? 0 : clamp(p.value ?? 0, -limit, limit),
    text: String(p.text ?? "").trim().slice(0, 200),
  };
}

/** Keeps only valid tiles and clamps the length; unknown tiles become empty fields. */
export function cleanTiles(tiles: unknown, platformCount: number): MapTile[] {
  const list = Array.isArray(tiles) ? tiles.slice(0, MAX_TILES) : [];
  const out = list.map((t): MapTile => {
    if (typeof t !== "string") return "empty";
    if ((BRUSHES as readonly string[]).includes(t)) return t as Brush;
    const i = customIndex(t);
    return i !== null && Number.isInteger(i) && i >= 0 && i < platformCount ? customTile(i) : "empty";
  });
  while (out.length < MIN_TILES) out.push("empty");
  return out;
}

export type Recipe = { length: number; mix: Partial<Record<Brush, number>>; platformWeights: number[] };

/** Deterministically fills a map from weights (used by "Zufällig füllen" and by Dicey). */
export function generateTiles(recipe: Recipe, seed = 1): MapTile[] {
  const length = clamp(recipe.length, MIN_TILES, MAX_TILES);
  const options: { tile: MapTile; w: number }[] = [
    ...BRUSHES.map((b) => ({ tile: b as MapTile, w: Math.max(0, recipe.mix[b] ?? 0) })),
    ...recipe.platformWeights.map((w, i) => ({ tile: customTile(i), w: Math.max(0, w) })),
  ].filter((o) => o.w > 0);
  if (!options.length) return Array.from({ length }, () => "empty");
  const total = options.reduce((a, o) => a + o.w, 0);
  let x = seed >>> 0 || 1;
  return Array.from({ length }, () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    let r = (x / 4294967296) * total;
    for (const o of options) { r -= o.w; if (r < 0) return o.tile; }
    return options[options.length - 1]!.tile;
  });
}

/** Full board for the game: start, the map's fields, goal. */
export const customBoard = (tiles: MapTile[]): TileType[] => ["start", ...(tiles as TileType[]), "goal"];

/** Applies a custom platform after the player finishes it. */
export function applyCustomPlatform(state: { pos: number; coins: number; shield: boolean }, p: CustomPlatform, goal: number) {
  if (p.effect === "steps") return { ...state, pos: Math.max(0, Math.min(goal - 1, state.pos + p.value)) };
  if (p.effect === "coins") return { ...state, coins: Math.max(0, state.coins + p.value) };
  if (p.effect === "shield") return { ...state, shield: true };
  return state;
}

export function effectLabel(p: CustomPlatform) {
  if (p.effect === "steps") return `${p.value >= 0 ? "+" : ""}${p.value} Schritte`;
  if (p.effect === "coins") return `${p.value >= 0 ? "+" : ""}${p.value} Münzen`;
  if (p.effect === "shield") return "Schutzschild";
  if (p.effect === "task") return `Aufgabe · ${p.value} Sek.`;
  return "Nur Spaß";
}

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
