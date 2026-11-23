// The walkable Lost Woods: misty 12×12 clearings with a path out of every side.
// Only the right turn (LOST_WOODS_PATH) leads deeper; any other way out quietly brings you back to the first clearing.
// There are no hints on screen: the right way out is lined with flowers, everything else is plain grass.
import { T, hash } from "./story-terrain";
import { LOST_WOODS_PATH, inSwordGlade, lostWoodsStep, type WoodsDir } from "./story-world";

export const WOODS_N = 12;
const MID = WOODS_N / 2; // lanes run along columns/rows MID-1 and MID
const DIRS: Record<WoodsDir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/** The two pedestal tiles in the sword glade. */
export const SWORD_STONE = [{ x: MID - 1, y: 4 }, { x: MID, y: 4 }] as const;

const laneX = (x: number) => x === MID - 1 || x === MID;
const exitsOf = (stage: number): WoodsDir[] => (inSwordGlade(stage) ? ["S"] : ["N", "E", "S", "W"]);

const cache = new Map<number, Uint8Array>();
/** Tiles of a clearing (T.* values). Deterministic per stage; the glade is a closed ring with one path back south. */
export function woodsCells(stage: number): Uint8Array {
  const hit = cache.get(stage);
  if (hit) return hit;
  const n = WOODS_N, cells = new Uint8Array(n * n), exits = exitsOf(stage), glade = inSwordGlade(stage);
  const right = glade ? null : LOST_WOODS_PATH[stage] ?? null;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const edge = Math.min(x, y, n - 1 - x, n - 1 - y), r = hash(900 + stage, x, y);
    const lane: WoodsDir | null = laneX(x) && y < MID ? "N" : laneX(x) && y >= MID ? "S" : laneX(y) && x < MID ? "W" : laneX(y) && x >= MID ? "E" : null;
    const open = lane && exits.includes(lane);
    let t: number = T.GRASS;
    if (open && (edge < 3 || !glade)) t = T.PATH;
    else if (glade) t = edge < 2 || (edge < 3 && r < 0.7) ? T.TREE : r > 0.7 ? T.FLOWERS : T.GRASS;
    else if (lane && !open) t = T.GRASS;
    else if (edge < 2 || (edge < 3 && r < 0.6)) t = T.TREE;
    else if (Math.abs(x - MID + 0.5) < 2.5 && Math.abs(y - MID + 0.5) < 2.5) t = T.GRASS;
    else if (r < 0.08) t = T.TREE;
    else if (r < 0.12) t = T.ROCK;
    // the quiet clue: flowers line the lane that leads deeper
    if (right && t !== T.PATH && t !== T.TREE) {
      const [dx, dy] = DIRS[right];
      const along = dx ? laneX(y + (y < MID ? 1 : -1)) && (dx > 0 ? x > MID + 1 : x < MID - 2) : laneX(x + (x < MID ? 1 : -1)) && (dy > 0 ? y > MID + 1 : y < MID - 2);
      if (along && edge < 5) t = T.FLOWERS;
    }
    cells[y * n + x] = t;
  }
  if (glade) for (const s of SWORD_STONE) cells[s.y * n + s.x] = T.GRASS;
  cache.set(stage, cells);
  return cells;
}

export const woodsCell = (stage: number, x: number, y: number) => woodsCells(stage)[y * WOODS_N + x];
export const woodsWalkable = (stage: number, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= WOODS_N || y >= WOODS_N) return false;
  if (inSwordGlade(stage) && SWORD_STONE.some((s) => s.x === x && s.y === y)) return false;
  const t = woodsCell(stage, x, y);
  return t !== T.TREE && t !== T.ROCK;
};
/** Where you stand after coming into a clearing heading in `dir` (going north you appear at its south edge). */
export function woodsArrival(dir: WoodsDir): { x: number; y: number } {
  switch (dir) {
    case "N": return { x: MID - 1, y: WOODS_N - 1 };
    case "S": return { x: MID - 1, y: 0 };
    case "E": return { x: 0, y: MID - 1 };
    case "W": return { x: WOODS_N - 1, y: MID - 1 };
  }
}
export type WoodsMove =
  | { kind: "walk"; x: number; y: number }
  | { kind: "blocked" }
  | { kind: "sword" }
  | { kind: "leave" }
  | { kind: "clearing"; stage: number; x: number; y: number; lost: boolean };
/** One step in the woods: walk, bump, touch the sword stone, leave back to the world, or go on into another clearing. */
export function woodsMove(stage: number, x: number, y: number, dir: WoodsDir): WoodsMove {
  const [dx, dy] = DIRS[dir], nx = x + dx, ny = y + dy;
  if (inSwordGlade(stage) && SWORD_STONE.some((s) => s.x === nx && s.y === ny)) return { kind: "sword" };
  const out = nx < 0 || ny < 0 || nx >= WOODS_N || ny >= WOODS_N;
  if (!out) return woodsWalkable(stage, nx, ny) ? { kind: "walk", x: nx, y: ny } : { kind: "blocked" };
  if (!exitsOf(stage).includes(dir)) return { kind: "blocked" };
  if (dir === "S" && (stage === 0 || inSwordGlade(stage))) return { kind: "leave" };
  const next = lostWoodsStep(stage, dir);
  const at = woodsArrival(next === 0 ? "N" : dir);
  return { kind: "clearing", stage: next, ...at, lost: next === 0 };
}
