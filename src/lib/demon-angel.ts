import type { TileType } from "./game";

/** Demon/Angel Time appears in 1 of 5 games. */
export const DEMON_CHANCE = 1 / 5;
/** Each of the two chosen players gets this many of their own tiles. */
export const DEMON_TILES = 5;
/** Steps the Demon pushes back / the Angel pushes forward per turn. */
export const POWER_STEPS = 3;

export type Roles = { demon: number; angel: number } | null;

/** Decides whether this game has Demon/Angel Time and picks two different players. */
export function pickRoles(playerCount: number, rand: () => number = Math.random): Roles {
  if (playerCount < 2 || rand() >= DEMON_CHANCE) return null;
  const demon = Math.floor(rand() * playerCount);
  const angel = (demon + 1 + Math.floor(rand() * (playerCount - 1))) % playerCount;
  return { demon, angel };
}

/** Replaces DEMON_TILES ordinary tiles (never start/goal) on a board with the given kind. */
export function placePowerTiles(board: TileType[], kind: "demon" | "angel", rand: () => number = Math.random): TileType[] {
  const out = [...board];
  const ordinary = out.map((t, i) => (t === "empty" || t === "task" || t === "bad" ? i : -1)).filter((i) => i > 0);
  for (let n = 0; n < DEMON_TILES && ordinary.length; n++) {
    const k = Math.floor(rand() * ordinary.length);
    out[ordinary[k]!] = kind;
    ordinary.splice(k, 1);
  }
  return out;
}

/** Demon pushes a target back; the Angel is protected. Returns new positions. */
export function demonStrike(pos: number[], target: number, angelActive: boolean, angel: number | undefined): number[] {
  if (angelActive && target === angel) return pos;
  return pos.map((x, i) => (i === target ? Math.max(0, x - POWER_STEPS) : x));
}

/** Angel pushes a target forward, stopping one before the goal. */
export function angelBless(pos: number[], target: number, goal: number): number[] {
  return pos.map((x, i) => (i === target ? Math.min(goal - 1, x + POWER_STEPS) : x));
}

export type PowerState = { pos: number[]; coins: number[]; frozen: boolean[]; shield: boolean[] };
export type Ability = { id: string; side: "demon" | "angel"; emoji: string; name: string; desc: string; self?: boolean };

/** Choices each turn: Demon controls the game, Angel counters it. */
export const ABILITIES: Ability[] = [
  { id: "strike", side: "demon", emoji: "👊", name: "Höllenstoß", desc: "3 Schritte zurück" },
  { id: "curse", side: "demon", emoji: "🧊", name: "Fluch", desc: "setzt eine Runde aus" },
  { id: "greed", side: "demon", emoji: "🪙", name: "Gier", desc: "stiehlt 5 Münzen" },
  { id: "swap", side: "demon", emoji: "🔄", name: "Seelentausch", desc: "tauscht Platz mit dir" },
  { id: "breaker", side: "demon", emoji: "💔", name: "Schildbrecher", desc: "zerstört das Schild" },
  { id: "bless", side: "angel", emoji: "🕊️", name: "Segen", desc: "3 Schritte vor" },
  { id: "halo", side: "angel", emoji: "🛡️", name: "Heiligenschein", desc: "gibt ein Schild" },
  { id: "gift", side: "angel", emoji: "🎁", name: "Geschenk", desc: "gibt 5 Münzen" },
  { id: "thaw", side: "angel", emoji: "☀️", name: "Erlösung", desc: "taut Eis auf und +1 Schritt" },
  { id: "wings", side: "angel", emoji: "🪽", name: "Flügel", desc: "du fliegst 5 vor", self: true },
];

/** Applies an ability. Demon abilities never affect the active Angel. */
export function applyAbility(s: PowerState, id: string, user: number, target: number, goal: number, angelProtected: boolean): PowerState {
  const n = { pos: [...s.pos], coins: [...s.coins], frozen: [...s.frozen], shield: [...s.shield] };
  const demon = ABILITIES.find((a) => a.id === id)?.side === "demon";
  if (demon && angelProtected) return n;
  const clamp = (x: number) => Math.max(0, Math.min(goal - 1, x));
  switch (id) {
    case "strike": n.pos[target] = clamp(n.pos[target]! - POWER_STEPS); break;
    case "curse": n.frozen[target] = true; break;
    case "greed": { const take = Math.min(5, n.coins[target]!); n.coins[target]! -= take; n.coins[user]! += take; break; }
    case "swap": { const a = n.pos[user]!; n.pos[user] = n.pos[target]!; n.pos[target] = a; break; }
    case "breaker": n.shield[target] = false; break;
    case "bless": n.pos[target] = clamp(n.pos[target]! + POWER_STEPS); break;
    case "halo": n.shield[target] = true; break;
    case "gift": n.coins[target]! += 5; break;
    case "thaw": n.frozen[target] = false; n.pos[target] = clamp(n.pos[target]! + 1); break;
    case "wings": n.pos[user] = clamp(n.pos[user]! + 5); break;
  }
  return n;
}
