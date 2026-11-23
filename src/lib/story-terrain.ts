// Huge generated open worlds and big multi-room dungeons for the Story-Modus (Minish-Cap-style tile maps).
// Pure and deterministic: every map is built from its world index, cached, and drawn by story-tiles.ts.
// One cell = one tile. Villages, roads, rivers, forests, the castle, the climbable mountains, the hedge labyrinth and the
// far-away dungeon come from the same recipe, so every world is open, fully connected and its places are reachable on foot.
// The layout is authored on a 192×144 grid and stretched by SCALE, so places keep their relative spots while distances grow.

export const T = { GRASS: 0, PATH: 1, FLOWERS: 2, TREE: 3, WATER: 4, ROCK: 5, SAND: 6, BRIDGE: 7, BUILDING: 8, WALL: 9, FLOOR: 10, CARPET: 11, PLAZA: 12, MOUNTAIN: 13, HIGH: 14, LADDER: 15, CLIFF: 16, HEDGE: 17, UPPER: 18, SUMMIT: 19 } as const;
const OPEN = [true, true, true, false, false, false, true, true, false, false, true, true, true, false, true, true, false, false, true, true];
export const terrainOpen = (t: number | undefined) => t !== undefined && OPEN[t] === true;
/** Mountain ground: the first plateau (HIGH), the terrace above it (UPPER) and the summit terrace (SUMMIT). */
export const isHighGround = (t: number | undefined) => t === T.HIGH || t === T.UPPER || t === T.SUMMIT;

/** How much bigger than the authored 192×144 layout every world is. */
export const SCALE = 2.5;
const sc = (n: number) => Math.round(n * SCALE);
export const WORLD_W = sc(192);
export const WORLD_H = sc(144);
export const DUNGEON_W = 48;
export const DUNGEON_H = 80;
/** Village size: half width and rows above/below the main street. */
export const VILLAGE_HALF_W = 22, VILLAGE_ROWS_UP = 15, VILLAGE_ROWS_DOWN = 15;
/** The hedge labyrinth is a perfect maze of LAB_CELLS×LAB_CELLS corridors (walls one tile thick). */
export const LAB_CELLS = 15;
export const LAB_SIZE = LAB_CELLS * 2 + 1;

export type XY = readonly [number, number];
export type StructureKind = "house" | "shop" | "temple" | "home" | "cabin" | "ruin" | "grove" | "castle" | "tower" | "shrine" | "cave"
  | "hut" | "crypt" | "camp" | "well" | "statue" | "stones" | "smithy" | "stall" | "falls";
/** Landmarks in the open countryside that you can look at but not enter. */
export const LANDMARKS: readonly StructureKind[] = ["camp", "well", "statue", "stones"];
export type Structure = { kind: StructureKind; x: number; y: number; w: number; h: number; v: number };
export type TileMap = { w: number; h: number; cells: Uint8Array; structures: Structure[] };
/** A big mountain: a raised plateau (HIGH) ringed by cliffs (CLIFF), climbed by ladders. */
export type Peak = { x: number; y: number; rx: number; ry: number; ladders: XY[]; tiers: number };
export type Labyrinth = { x: number; y: number; size: number; door: XY; center: XY };
export type WorldSites = {
  spawn: XY; dungeon: XY; cities: XY[]; npcs: XY[]; romance: XY | null; home: XY | null; rose: XY | null;
  /** The blacksmith's door of each village (same order as `cities`). */
  smiths: XY[];
  guide: { home: XY; lost: XY }; cottage: XY | null; woods: XY | null;
  /** The castle gate (door cell) in the middle of the world. */
  castle: XY;
  /** The hedge labyrinth (its treasure chest stands in the middle), if one fit. */
  labyrinth: Labyrinth | null;
  /** Side quests: a hermit standing beside their hut (structure index) and the lost item lying near a far landmark. */
  quests: { hut: number; giver: XY; item: XY; at: StructureKind }[];
};
export type FieldFoeSpot = { x: number; y: number; slot: number };
export type WorldMap = TileMap & {
  sites: WorldSites;
  /** Villages and forecourts: enemies never walk in here. */
  safe: Uint8Array;
  /** Cuttable bushes (they block until cut with the sword). */
  bushes: XY[]; bushAt: Map<number, number>;
  /** Where enemies roam in the open world. */
  foes: FieldFoeSpot[];
  /** The big climbable mountains of this world. */
  peaks: Peak[];
  /** Guards standing at the castle gate, and the loop the patrolling guards walk around the moat. */
  guardPosts: XY[]; patrol: XY[];
  /** Treasure chests standing in the open world (blocked cells you open by walking into them). */
  treasures: XY[]; treasureAt: Map<number, number>;
};

/** Castle footprint (same spot in every world: the middle, north of the river). The gate is the bottom middle cell. */
export const CASTLE = { x: Math.round(WORLD_W / 2) - 10, y: sc(40), w: 21, h: 13 } as const;
const CASTLE_DOOR: XY = [CASTLE.x + Math.floor(CASTLE.w / 2), CASTLE.y + CASTLE.h - 1];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash(seed: number, x: number, y: number) {
  let h = (Math.imul(seed, 374761393) + Math.imul(x, 668265263) + Math.imul(y, -2048144789)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(seed: number, x: number, y: number, g: number) {
  const gx = x / g, gy = y / g, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(gx - x0), v = s(gy - y0);
  const a = hash(seed, x0, y0), b = hash(seed, x0 + 1, y0), c = hash(seed, x0, y0 + 1), d = hash(seed, x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Forests, lakes and rock fields grow with the world (but not fully, so the countryside stays varied). */
const NS = 1.6;
const noise = (seed: number, x: number, y: number) => vnoise(seed, x, y, 11 * NS) * 0.65 + vnoise(seed + 1, x, y, 5 * NS) * 0.35;

type Theme = { tree: number; water: number; rock: number; flowers: number; edge: number; shore: boolean; sea?: boolean };
const THEMES: Theme[] = [
  { tree: 0.6, water: 0.76, rock: 0.78, flowers: 0.64, edge: T.TREE, shore: false },
  { tree: 0.72, water: 0.82, rock: 0.66, flowers: 0.8, edge: T.ROCK, shore: true },
  { tree: 0.6, water: 0.64, rock: 0.8, flowers: 0.72, edge: T.TREE, shore: false },
  { tree: 0.62, water: 0.74, rock: 0.72, flowers: 0.78, edge: T.ROCK, shore: false },
  { tree: 0.66, water: 0.74, rock: 0.7, flowers: 0.8, edge: T.ROCK, shore: false },
  { tree: 0.7, water: 0.68, rock: 0.64, flowers: 0.82, edge: T.ROCK, shore: false },
  { tree: 0.7, water: 0.62, rock: 0.76, flowers: 0.7, edge: T.WATER, shore: false },
  { tree: 0.64, water: 0.78, rock: 0.78, flowers: 0.68, edge: T.TREE, shore: true, sea: true },
  { tree: 0.6, water: 0.7, rock: 0.74, flowers: 0.8, edge: T.TREE, shore: false },
];
/** Each world's mountains look different: how many, how big, how stretched, and what grows on top. */
type PeakTop = "forest" | "mesa" | "crags" | "snow" | "spires" | "crater" | "cloud";
const PEAK_STYLE: { n: number; r: [number, number]; sx: number; sy: number; top: PeakTop }[] = [
  { n: 5, r: [7, 10], sx: 1.25, sy: 0.9, top: "forest" }, // Würfelwald: rolling wooded mountains
  { n: 5, r: [6, 9], sx: 1.7, sy: 0.75, top: "mesa" }, // Glitzerwüste: wide flat mesas
  { n: 4, r: [6, 8], sx: 1, sy: 1.15, top: "crags" }, // Schlangensumpf: mossy crags
  { n: 4, r: [9, 12], sx: 1.15, sy: 1, top: "snow" }, // Eisberge: huge snowy peaks
  { n: 5, r: [6, 9], sx: 0.9, sy: 1.3, top: "spires" }, // Zitadelle: tall iron spires
  { n: 3, r: [10, 13], sx: 1.1, sy: 1, top: "crater" }, // Glutgipfel: volcanoes with lava craters
  { n: 5, r: [6, 9], sx: 1.45, sy: 0.8, top: "cloud" }, // Wolkengarten: floating cloud plateaus
  { n: 4, r: [7, 10], sx: 1.5, sy: 0.85, top: "forest" }, // Korallenküste: green sea cliffs
  { n: 4, r: [8, 11], sx: 1, sy: 1, top: "spires" }, // Schattenreich: dark crowns
];
/** Mountains are this much bigger (and there are PEAK_COUNT times as many) than the authored style. */
const PEAK_SIZE = 1.5, PEAK_COUNT = 3;
/** Column of each world's dungeon (authored grid): always far north and away from the start village. */
const DUNGEON_X = [147, 45, 96, 45, 147, 96, 147, 45, 96];

const worldCache = new Map<number, WorldMap>();
export function worldMap(world: number): WorldMap {
  const w = Math.max(0, Math.min(8, Math.floor(world) || 0));
  let m = worldCache.get(w);
  if (!m) { m = buildWorld(w); worldCache.set(w, m); }
  return m;
}
export const riverRow = (world: number, x: number) => Math.round(WORLD_H * 0.54 + Math.sin(x / (9 * SCALE) + world) * 3 * SCALE + Math.sin(x / (23 * SCALE) + world * 2) * 2 * SCALE);

// ---------- Minish-Cap-style area patchwork ----------
export type Biome = "meadow" | "woods" | "lake" | "swamp" | "rocky" | "flowers";
/** Which areas each world is made of (dealt out over the REGION_COLS x REGION_ROWS grid). */
const BIOMES: Biome[][] = [
  ["meadow", "woods", "lake", "flowers", "woods", "meadow", "rocky", "woods", "meadow", "flowers", "woods", "lake"], // Würfelwald
  ["rocky", "meadow", "rocky", "lake", "rocky", "flowers", "rocky", "meadow", "rocky", "rocky", "flowers", "meadow"], // Glitzerwüste
  ["swamp", "woods", "swamp", "lake", "meadow", "swamp", "woods", "swamp", "flowers", "swamp", "woods", "meadow"], // Schlangensumpf
  ["rocky", "woods", "lake", "meadow", "rocky", "woods", "rocky", "flowers", "meadow", "rocky", "lake", "woods"], // Eisberge
  ["rocky", "meadow", "flowers", "rocky", "woods", "meadow", "rocky", "lake", "meadow", "rocky", "flowers", "woods"], // Zitadelle
  ["rocky", "rocky", "lake", "meadow", "rocky", "woods", "rocky", "flowers", "rocky", "meadow", "lake", "rocky"], // Glutgipfel
  ["flowers", "meadow", "lake", "flowers", "woods", "meadow", "flowers", "lake", "meadow", "flowers", "woods", "flowers"], // Wolkengarten
  ["meadow", "lake", "woods", "flowers", "swamp", "meadow", "rocky", "lake", "woods", "meadow", "flowers", "swamp"], // Korallenküste
  ["woods", "swamp", "rocky", "woods", "meadow", "swamp", "woods", "rocky", "flowers", "woods", "lake", "swamp"], // Schattenreich
];
export const REGION_COLS = 4, REGION_ROWS = 3;
/** How thick the tree/boulder walls between areas are, and how wide their openings. */
export const BORDER_HALF = 2, GAP_HALF = 3;
type Regions = { ys: number[]; xs: number[][]; biome: Biome[]; wall: number[]; rowGaps: number[][]; colGaps: number[][] };
const regionCache = new Map<number, Regions>();
/** The area grid of a world: row lines, per-row column lines, each area's biome and where the walls open up. */
export function worldRegions(world: number): Regions {
  const hit = regionCache.get(world);
  if (hit) return hit;
  const r = rng(world * 7919 + 31), jit = (n: number) => Math.round((r() - 0.5) * 2 * n);
  const W = WORLD_W, H = WORLD_H;
  const ys = [0, ...Array.from({ length: REGION_ROWS - 1 }, (_, k) => Math.round((H * (k + 1)) / REGION_ROWS) + jit(sc(6))), H];
  const xs = Array.from({ length: REGION_ROWS }, () => [0, ...Array.from({ length: REGION_COLS - 1 }, (_, k) => Math.round((W * (k + 1)) / REGION_COLS) + jit(sc(9))), W]);
  const pool = BIOMES[world] ?? BIOMES[0]!;
  const biome = Array.from({ length: REGION_COLS * REGION_ROWS }, (_, i) => pool[i % pool.length]!);
  const edge = THEMES[world]?.edge ?? T.TREE;
  const wall = Array.from({ length: REGION_COLS * REGION_ROWS * 2 }, () => (edge === T.ROCK && r() < 0.5 ? T.ROCK : T.TREE));
  // Openings: on every row line one or two per column span; on every column line one or two per row.
  const rowGaps = ys.slice(1, -1).map(() => {
    const g: number[] = [];
    for (let c = 0; c < REGION_COLS; c++) {
      const a = Math.round((W * c) / REGION_COLS), b = Math.round((W * (c + 1)) / REGION_COLS);
      g.push(a + Math.round((b - a) * (0.25 + r() * 0.5)));
      if (r() < 0.5) g.push(a + Math.round((b - a) * (0.15 + r() * 0.7)));
    }
    return g;
  });
  const colGaps = xs.map((_, row) => {
    const a = ys[row]!, b = ys[row + 1]!, g = [a + Math.round((b - a) * (0.3 + r() * 0.4))];
    if (r() < 0.5) g.push(a + Math.round((b - a) * (0.15 + r() * 0.7)));
    return g;
  });
  const out = { ys, xs, biome, wall, rowGaps, colGaps };
  regionCache.set(world, out);
  return out;
}
/** Which area a cell belongs to (row-major index). */
export function regionAt(world: number, x: number, y: number) {
  const g = worldRegions(world);
  let row = 0;
  while (row < REGION_ROWS - 1 && y >= g.ys[row + 1]!) row++;
  const xs = g.xs[row]!;
  let col = 0;
  while (col < REGION_COLS - 1 && x >= xs[col + 1]!) col++;
  return row * REGION_COLS + col;
}
/** The terrain of the area patchwork before any village, road or mountain is built. */
function regionCell(world: number, x: number, y: number): number {
  const g = worldRegions(world), th = THEMES[world]!, seed = world * 1013 + 7;
  // Walls between areas (gently wavy), with openings.
  const wave = (a: number, b: number) => Math.round((vnoise(seed + 300, a, b, 9) - 0.5) * 3);
  for (let k = 1; k < g.ys.length - 1; k++) {
    if (Math.abs(y - g.ys[k]! - wave(x, k)) <= BORDER_HALF) {
      if (g.rowGaps[k - 1]!.some((gx) => Math.abs(x - gx) <= GAP_HALF)) return T.GRASS;
      return g.wall[k * REGION_COLS + Math.min(REGION_COLS - 1, Math.floor((x * REGION_COLS) / WORLD_W))]!;
    }
  }
  const id = regionAt(world, x, y), row = Math.floor(id / REGION_COLS), xs = g.xs[row]!;
  for (let k = 1; k < xs.length - 1; k++) {
    if (Math.abs(x - xs[k]! - wave(k + 50, y)) <= BORDER_HALF) {
      if (g.colGaps[row]!.some((gy) => Math.abs(y - gy) <= GAP_HALF)) return T.GRASS;
      return g.wall[REGION_COLS * REGION_ROWS + row * REGION_COLS + k]!;
    }
  }
  // Inside an area: tidy, readable fills like the handheld Zelda overworld.
  const x0 = xs[id % REGION_COLS]!, x1 = xs[(id % REGION_COLS) + 1]!, y0 = g.ys[row]!, y1 = g.ys[row + 1]!;
  const n = noise(seed + 10, x, y), f = noise(seed + 40, x, y);
  // Neat 2x2 tree clumps on a loose lattice (the classic paired trees of the fields).
  const clump = (every: number, chance: number) => {
    const cx = Math.floor(x / every), cy = Math.floor(y / every);
    if (hash(seed + 310, cx, cy) > chance) return false;
    const ox = cx * every + 1 + Math.floor(hash(seed + 311, cx, cy) * (every - 3)), oy = cy * every + 1 + Math.floor(hash(seed + 312, cx, cy) * (every - 3));
    return x >= ox && x <= ox + 1 && y >= oy && y <= oy + 1;
  };
  switch (g.biome[id]) {
    case "woods":
      if (n > th.tree - 0.18) return T.TREE;
      if (clump(5, 0.5)) return T.TREE;
      return f > th.flowers ? T.FLOWERS : T.GRASS;
    case "lake": {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) * 0.32, ry = (y1 - y0) * 0.3;
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (n - 0.5) * 0.5;
      if (d < 0.05) return T.FLOWERS; // a little island in the middle
      if (d < 0.1) return T.TREE;
      if (d < 1) return T.WATER;
      if (d < 1.35 && th.shore) return T.SAND;
      return clump(9, 0.35) ? T.TREE : f > th.flowers ? T.FLOWERS : T.GRASS;
    }
    case "swamp": {
      const w = noise(seed + 20, x, y);
      if (Math.abs(w - 0.5) < 0.07) return T.WATER;
      if (w > 0.7) return T.WATER;
      return clump(6, 0.45) ? T.TREE : n > th.tree ? T.TREE : T.GRASS;
    }
    case "rocky":
      if (noise(seed + 30, x, y) > th.rock - 0.04) return T.ROCK;
      if (clump(8, 0.3)) return T.TREE;
      return th.shore && f > 0.55 ? T.SAND : T.GRASS;
    case "flowers":
      if (clump(10, 0.4)) return T.TREE;
      return f > th.flowers - 0.22 ? T.FLOWERS : T.GRASS;
    default: // meadow
      if (noise(seed + 20, x, y) > th.water + 0.04) return T.WATER;
      if (clump(8, 0.55)) return T.TREE;
      return f > th.flowers ? T.FLOWERS : T.GRASS;
  }
}

/** Points already given to someone; `near` looks only into the few buckets around a cell (the worlds are big). */
function takenSet() {
  const all: XY[] = [], grid = new Map<number, XY[]>();
  const key = (bx: number, by: number) => by * 4096 + bx;
  const push = (p: XY) => { all.push(p); const k = key(p[0] >> 3, p[1] >> 3); const b = grid.get(k); if (b) b.push(p); else grid.set(k, [p]); };
  const near = (x: number, y: number, r: number) => {
    for (let by = (y - r) >> 3; by <= (y + r) >> 3; by++) for (let bx = (x - r) >> 3; bx <= (x + r) >> 3; bx++) {
      const b = grid.get(key(bx, by));
      if (b && b.some((p) => Math.max(Math.abs(p[0] - x), Math.abs(p[1] - y)) <= r)) return true;
    }
    return false;
  };
  return { all, push, near };
}

function buildWorld(world: number): WorldMap {
  const W = WORLD_W, H = WORLD_H, th = THEMES[world]!, seed = world * 1013 + 7;
  const rnd = rng(seed);
  const cells = new Uint8Array(W * H), reserved = new Uint8Array(W * H), safe = new Uint8Array(W * H), road = new Uint8Array(W * H), keep = new Uint8Array(W * H);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const at = (x: number, y: number) => y * W + x;
  const j = (n: number) => Math.round((rnd() - 0.5) * 2 * n);
  const structures: Structure[] = [];

  // 1. A Minish-Cap-style patchwork: the world is split into big areas (fields, woods, a lake, swamp, rocky
  //    highlands, flower meadows), each fenced in by a thick wall of trees or boulders with openings between them.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells[at(x, y)] = regionCell(world, x, y);
  if (th.sea) for (let y = 0; y < H; y++) { const edge = W - sc(18) + Math.round((noise(seed + 50, 3, y) - 0.5) * 10); for (let x = edge; x < W; x++) cells[at(x, y)] = T.WATER; }
  // 2. A wide river (or lava stream, canal, sky gap) crosses the world; the start is south of it, the dungeon far north.
  for (let x = 0; x < W; x++) { const yc = riverRow(world, x); for (let d = -2; d <= 2; d++) if (inside(x, yc + d)) cells[at(x, yc + d)] = T.WATER; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (d < 3 + Math.floor(noise(seed + 60, x, y) * 3)) cells[at(x, y)] = th.edge;
  }

  const clear = (x0: number, y0: number, x1: number, y1: number, t: number = T.GRASS, mark?: Uint8Array) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(x, y) && !reserved[at(x, y)]) { cells[at(x, y)] = t; if (mark) mark[at(x, y)] = 1; }
  };
  const stamp = (kind: StructureKind, x: number, y: number, w: number, h: number, v = 0) => {
    structures.push({ kind, x, y, w, h, v });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (inside(xx, yy)) { cells[at(xx, yy)] = T.BUILDING; reserved[at(xx, yy)] = 1; }
  };
  /** A street: straight, three tiles wide (water underneath becomes a bridge). */
  const brush = (x: number, y: number, r: number) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy;
      if (!inside(xx, yy) || reserved[at(xx, yy)]) continue;
      const c = cells[at(xx, yy)]!;
      cells[at(xx, yy)] = c === T.WATER || c === T.BRIDGE ? T.BRIDGE : c === T.PLAZA ? T.PLAZA : T.PATH;
      road[at(xx, yy)] = 1;
    }
  };
  const line = (a: XY, b: XY, paint: (x: number, y: number) => void) => {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    for (let i = 0; i <= steps; i++) paint(Math.round(a[0] + ((b[0] - a[0]) * i) / steps), Math.round(a[1] + ((b[1] - a[1]) * i) / steps));
  };
  const street = (a: XY, b: XY) => line(a, b, (x, y) => brush(x, y, 1));
  const lane = (x0: number, x1: number, y: number) => { for (let x = x0; x <= x1; x++) if (inside(x, y) && !reserved[at(x, y)]) { cells[at(x, y)] = T.PATH; road[at(x, y)] = 1; } };

  // 3. The castle in the middle: a moat with one bridge to the gate, a plaza and a guard walk all around.
  const K = CASTLE;
  // The castle town (like Hyrule Town): a stone town wall around the castle with gates in the west, east and south,
  // a main street, a back lane and rows of homes. A ring of open grass runs around the outside of the wall.
  const TX0 = K.x - 14, TX1 = K.x + K.w + 13, TY0 = K.y - 11, TY1 = K.y + K.h + 18, MY = K.y + K.h + 7;
  for (let y = TY0 - 3; y <= TY1 + 3; y++) for (let x = TX0 - 3; x <= TX1 + 3; x++) if (inside(x, y)) { cells[at(x, y)] = T.GRASS; keep[at(x, y)] = 1; }
  clear(TX0, TY0, TX1, TY1, T.GRASS, safe);
  clear(K.x - 6, K.y - 6, K.x + K.w + 5, K.y + K.h + 9, T.GRASS, safe);
  const patrol: XY[] = [];
  {
    const x0 = K.x - 4, x1 = K.x + K.w + 3, y0 = K.y - 4, y1 = K.y + K.h + 4;
    for (let x = x0; x <= x1; x++) patrol.push([x, y0]);
    for (let y = y0 + 1; y <= y1; y++) patrol.push([x1, y]);
    for (let x = x1 - 1; x >= x0; x--) patrol.push([x, y1]);
    for (let y = y1 - 1; y > y0; y--) patrol.push([x0, y]);
    for (const [x, y] of patrol) { cells[at(x, y)] = T.PATH; road[at(x, y)] = 1; }
  }
  for (let y = K.y - 2; y < K.y + K.h + 2; y++) for (let x = K.x - 2; x < K.x + K.w + 2; x++) {
    if (x >= K.x && x < K.x + K.w && y >= K.y && y < K.y + K.h) continue;
    cells[at(x, y)] = T.WATER; reserved[at(x, y)] = 1;
  }
  for (let y = K.y + K.h; y < K.y + K.h + 2; y++) for (let x = CASTLE_DOOR[0] - 1; x <= CASTLE_DOOR[0] + 1; x++) cells[at(x, y)] = T.BRIDGE;
  for (let y = K.y + K.h + 2; y <= K.y + K.h + 3; y++) for (let x = K.x + 2; x < K.x + K.w - 2; x++) { cells[at(x, y)] = T.PLAZA; road[at(x, y)] = 1; }
  stamp("castle", K.x, K.y, K.w, K.h, world);
  const guardPosts: XY[] = [[CASTLE_DOOR[0] - 3, K.y + K.h + 2], [CASTLE_DOOR[0] + 3, K.y + K.h + 2]];
  for (const [x, y] of guardPosts) reserved[at(x, y)] = 1;
  const M: XY = [CASTLE_DOOR[0], MY];
  const town: Structure[] = [];
  const townStamp = (kind: StructureKind, x: number, y: number, w: number, h: number, v: number) => {
    town.push({ kind, x, y, w, h, v });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { cells[at(xx, yy)] = T.BUILDING; reserved[at(xx, yy)] = 1; }
  };
  {
    const gate = (x: number, y: number) => ((x <= TX0 + 1 || x >= TX1 - 1) && Math.abs(y - MY) <= 1) || (y >= TY1 - 1 && Math.abs(x - M[0]) <= 1);
    for (let y = TY0; y <= TY1; y++) for (let x = TX0; x <= TX1; x++) {
      if (x > TX0 + 1 && x < TX1 - 1 && y > TY0 + 1 && y < TY1 - 1) continue;
      if (gate(x, y)) continue;
      cells[at(x, y)] = T.WALL; reserved[at(x, y)] = 1;
    }
    let v = 200 + world * 40;
    // Homes behind the castle, down both sides and along the back lane (doors face a free step and a lane).
    for (const dx of [-3, 3, 13, 19]) townStamp("house", K.x + dx, K.y - 9, 5, 4, ++v);
    for (const dy of [-8, -2, 4, 10]) { townStamp("house", K.x - 12, K.y + dy, 5, 4, ++v); townStamp("house", K.x + K.w + 7, K.y + dy, 5, 4, ++v); }
    for (const dx of [-21, -15, -9, 5, 11, 17]) townStamp("house", M[0] + dx, MY + 3, 5, 4, ++v);
    townStamp("stall", K.x - 11, MY - 4, 3, 2, ++v); townStamp("stall", K.x + K.w + 8, MY - 4, 3, 2, ++v);
    for (let y = K.y - 7; y < MY; y++) for (const x of [K.x - 6, K.x + K.w + 5]) { cells[at(x, y)] = T.PATH; road[at(x, y)] = 1; }
    lane(TX0 + 2, TX1 - 2, MY + 8);
  }

  // 4. Places: start village in the south, four more villages far apart, the dungeon temple far in the north.
  const VX = VILLAGE_HALF_W, VT = VILLAGE_ROWS_UP, VB = VILLAGE_ROWS_DOWN;
  const S: XY = [sc(96) + j(sc(12)), H - 24];
  const C1: XY = [sc(34) + j(4), sc(104) + j(3)];
  const C2: XY = [(th.sea ? sc(140) : sc(160)) + j(3), sc(44) + j(3)];
  const D: XY = [sc(DUNGEON_X[world]!) + j(3), 14];
  const E: XY = [sc(128), sc(100)];
  const smiths: XY[] = [];
  /** A big village around a main street: market square with stalls, the shop and the blacksmith, and 23 homes in four rows.
   *  Every door has a free step in front of it that connects to a lane, the square or the main street. */
  const village = ([cx, cy]: XY, k: number): XY => {
    clear(cx - VX - 2, cy - VT - 2, cx + VX + 2, cy + VB + 1, T.GRASS, safe);
    clear(cx - 7, cy - 4, cx + 7, cy + 3, T.PLAZA);
    lane(cx - VX, cx + VX, cy - 11); lane(cx - VX, cx + VX, cy + 8); lane(cx - VX, cx + VX, cy + 14);
    for (let y = cy + 2; y <= cy + VB + 1; y++) lane(cx - 1, cx + 1, y);
    stamp("shop", cx - 3, cy - 9, 7, 5, world * 5 + k);
    stamp("smithy", cx + 5, cy - 9, 6, 5, world * 5 + k);
    smiths.push([cx + 8, cy - 5]);
    let v = k * 32;
    for (const dx of [-21, -15, -9, 12, 18]) stamp("house", cx + dx, cy - 8, 5, 4, ++v);
    for (const dx of [-21, -14, -7, 3, 10, 17]) stamp("house", cx + dx, cy - 15, 5, 4, ++v);
    for (const dx of [-21, -15, -9, 5, 11, 17]) { stamp("house", cx + dx, cy + 4, 5, 4, ++v); stamp("house", cx + dx, cy + 10, 5, 4, ++v); }
    for (const [dx, dy] of [[-7, -3], [5, -3], [-7, 2], [5, 2]] as const) stamp("stall", cx + dx, cy + dy, 3, 2, ++v);
    return [cx, cy - 5];
  };
  const cities = [village(S, 0), village(C1, 1), village(C2, 2)];
  const lost: XY = world === 2 ? [sc(168), sc(22)] : [Math.min(W - 16, E[0] + sc(12) + j(2)), E[1] - sc(12) + j(3)];
  const homeX = S[0] - VX - 12;
  // Two more villages: the first candidate spots that keep far away from every other village and place.
  const vbox = ([cx, cy]: XY): [number, number, number, number] => [cx - VX - 4, cy - VT - 4, cx + VX + 4, cy + VB + 3];
  const boxes: [number, number, number, number][] = [
    vbox(S), vbox(C1), vbox(C2),
    [D[0] - 11, 0, D[0] + 11, D[1] + 8], [TX0 - 6, TY0 - 6, TX1 + 6, TY1 + 6], [E[0] - 3, E[1] - 3, E[0] + 3, E[1] + 3], [lost[0] - 3, lost[1] - 3, lost[0] + 3, lost[1] + 3],
    ...(world === 0 ? [[homeX - 7, S[1], homeX + 7, S[1] + 11], [sc(4), sc(118), sc(28), H - 2], [sc(14), 0, sc(27), sc(86)], [sc(176), sc(126), W - 2, H - 2]] as [number, number, number, number][] : []),
  ];
  const fits = ([cx, cy]: XY) => {
    const [x0, y0, x1, y1] = vbox([cx, cy]);
    if (x0 < 4 || y0 < 4 || x1 > W - 5 || y1 > H - 4) return false;
    if (th.sea && x1 > W - sc(24)) return false;
    if (boxes.some(([a, b, c, d]) => x0 <= c && x1 >= a && y0 <= d && y1 >= b)) return false;
    if (cities.some(([x, y]) => Math.abs(x - cx) + Math.abs(y - cy) < sc(45))) return false;
    for (let x = x0; x <= x1; x++) { const r = riverRow(world, x); if (r + 3 >= y0 && r - 3 <= y1) return false; }
    return true;
  };
  const CANDIDATES: XY[] = ([[42, 40], [160, 114], [56, 22], [146, 120], [40, 62], [126, 22], [62, 132]] as const).map(([x, y]) => [sc(x), sc(y)] as XY);
  const extra: XY[] = [];
  for (const c of CANDIDATES) {
    if (extra.length >= 2) break;
    if (!fits(c)) continue;
    extra.push(c);
    boxes.push(vbox(c));
    cities.push(village(c, 3 + extra.length - 1));
  }
  clear(D[0] - 9, D[1] - 8, D[0] + 9, D[1] + 6, T.GRASS, safe);
  clear(D[0] - 3, D[1] + 1, D[0] + 3, D[1] + 4, T.PLAZA);
  stamp("temple", D[0] - 5, D[1] - 6, 11, 7, world);
  let home: XY | null = null;
  if (world === 0) {
    clear(homeX - 5, S[1] + 1, homeX + 5, S[1] + 9, T.GRASS, safe);
    stamp("home", homeX - 2, S[1] + 3, 5, 4, 0);
    home = [homeX, S[1] + 6];
  }

  // 5. Wide roads (three tiles, with open grass beside them); water under a road becomes a bridge.
  //    Inside villages the streets run straight; out in the country they bend.
  const bend = (a: XY, b: XY, amount: number): XY => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.max(1, Math.hypot(dx, dy)), k = j(amount);
    return [Math.round((a[0] + b[0]) / 2 - (dy / len) * k), Math.round((a[1] + b[1]) / 2 + (dx / len) * k)];
  };
  const roadThrough = (pts: XY[]) => { for (let i = 0; i + 1 < pts.length; i++) { const m = bend(pts[i]!, pts[i + 1]!, sc(5)); street(pts[i]!, m); street(m, pts[i + 1]!); } };
  const exitE = ([cx, cy]: XY): XY => [cx + VX + 3, cy], exitW = ([cx, cy]: XY): XY => [cx - VX - 3, cy], exitS = ([cx, cy]: XY): XY => [cx, cy + VB + 2];
  for (const c of [S, C1, C2, ...extra]) { street([c[0] - 7, c[1]], exitW(c)); street([c[0] + 7, c[1]], exitE(c)); street([c[0], c[1] + 2], exitS(c)); }
  const bx = S[0] + VX + 7, B: XY = [bx, riverRow(world, bx)];
  const gateRow = K.y + K.h + 4;
  // The town gates: the main street runs straight from the west gate to the east gate, the south street up to the castle.
  const gW: XY = [TX0 - 3, MY], gE: XY = [TX1 + 3, MY], gS: XY = [M[0], TY1 + 3];
  street(gW, gE);
  street(gS, [M[0], gateRow]);
  roadThrough([exitE(S), [bx, S[1] - sc(12)], B, [bx - 2, B[1] - sc(8)], gS]);
  const side = D[0] > M[0] ? 1 : -1, sideX = M[0] + side * sc(22), north: XY = [sideX, sc(28)];
  roadThrough([side > 0 ? gE : gW, [sideX, M[1]], north, [D[0], D[1] + 9], [D[0], D[1] + 2]]);
  roadThrough([exitW(S), exitE(C1)]);
  roadThrough([exitW(C2), [sc(118), sc(50)], [sc(118), M[1]], gE]);
  roadThrough([exitW(C1), [C1[0] - VX - 3, C1[1] - sc(20)], [M[0] - sc(30), M[1] + 4], gW]);
  for (const c of extra) {
    const hub = [gW, gE, gS, E, S, north].reduce((a, b) => (Math.abs(b[0] - c[0]) + Math.abs(b[1] - c[1]) < Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1]) ? b : a));
    roadThrough([hub[0] >= c[0] ? exitE(c) : exitW(c), hub]);
  }
  roadThrough([exitS(C2), [C2[0] - 4, riverRow(world, C2[0] - 4) + 6], E]);
  roadThrough([E, exitE(S)]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!road[at(x, y)]) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (inside(xx, yy) && !reserved[at(xx, yy)] && (cells[at(xx, yy)] === T.TREE || cells[at(xx, yy)] === T.ROCK)) cells[at(xx, yy)] = T.GRASS;
    }
  }
  // Hidden trails (two tiles wide, plain grass) to the secret places.
  // They only clear trees, rocks and water, so roads they cross stay roads; mountains are never built on them.
  const soften = (x0: number, y0: number, x1: number, y1: number, t: number = T.GRASS) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inside(x, y) || reserved[at(x, y)]) continue;
      const c = cells[at(x, y)];
      keep[at(x, y)] = 1;
      if (!terrainOpen(c) || (t === T.FLOWERS && c === T.GRASS)) cells[at(x, y)] = t;
    }
  };
  const trail = (pts: XY[]) => { for (let i = 0; i + 1 < pts.length; i++) line(pts[i]!, pts[i + 1]!, (x, y) => soften(x, y, x + 1, y + 1)); };
  const glade = (c: XY, r: number, t: number = T.GRASS) => soften(c[0] - r, c[1] - r, c[0] + r, c[1] + r, t);

  let cottage: XY | null = null, woods: XY | null = null, rose: XY | null = null;
  if (world === 0) {
    trail([[homeX, S[1] + 8], [homeX + 6, S[1] + 8], exitW(S)]);
    cottage = [sc(14), sc(130)];
    glade(cottage, 3);
    trail([exitS(C1), [C1[0], C1[1] + VB + sc(10)], [sc(18), sc(126)], [sc(14), sc(131)]]);
    // The Lost Woods start at the northern forest edge: a trail leads up to an archway of two ancient trees.
    const wx = sc(21);
    woods = [wx, 6];
    glade([wx, 21], 2);
    glade([wx, 12], 2, T.FLOWERS);
    trail([[C1[0] - VX - 3, C1[1] - sc(20)], [sc(24), sc(60)], [wx, sc(40)], [wx, 20], [wx, 10]]);
    for (let y = 6; y <= 10; y++) { cells[at(wx, y)] = T.GRASS; reserved[at(wx, y)] = 1; if (y < 9) { cells[at(wx - 1, y)] = T.TREE; cells[at(wx + 1, y)] = T.TREE; } }
    structures.push({ kind: "grove", x: wx - 3, y: 2, w: 7, h: 5, v: 0 });
    rose = [sc(182), sc(132)];
    glade(rose, 2, T.FLOWERS);
    trail([E, [sc(168), sc(120)], [sc(182), sc(133)]]);
  }
  glade(lost, 2);
  trail(world === 2 ? [exitE(C2), [sc(164), sc(30)], lost] : [E, lost]);

  // 6. Explorable cabins and ruins in the wild: each stands beside a road with one free step in front of its door.
  const lodges: XY[] = [];
  const freeFor = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inside(x, y) || x < 4 || y < 4 || x > W - 5 || y > H - 5) return false;
      const i = at(x, y), c = cells[i]!;
      if (reserved[i] || safe[i] || road[i] || keep[i] || c === T.WATER || c === T.BRIDGE || c === T.PLAZA) return false;
    }
    return true;
  };
  const roadCells: number[] = [];
  for (let i = 0; i < W * H; i++) if (road[i] && cells[i] === T.PATH && !safe[i]) roadCells.push(i);
  const pathCells = roadCells.slice();
  roadCells.sort((a, b) => hash(seed + 90, a % W, (a / W) | 0) - hash(seed + 90, b % W, (b / W) | 0));
  for (const i of roadCells) {
    if (lodges.length >= 14) break;
    const rx = i % W, ry = (i - rx) / W, w = 4, h = 3, x = rx - 1, y = ry - h - 1;
    if (!freeFor(x - 1, y - 1, x + w, y + h)) continue;
    if (lodges.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < sc(26)) || Math.abs(x - S[0]) + Math.abs(y - S[1]) < VX + 12) continue;
    if (world === 0 && ((x < sc(32) && y > sc(112)) || (x < sc(30) && y < sc(86)))) continue;
    for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) cells[at(xx, yy)] = T.GRASS;
    stamp(lodges.length % 2 === 1 ? "ruin" : "cabin", x, y, w, h, lodges.length);
    lodges.push([x, y]);
    for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) keep[at(xx, yy)] = 1;
  }
  /** A two-tile trail from a door step along the shortest way around buildings and mountains to the nearest road
   *  (water on the way becomes a bridge). */
  const bfsMark = new Int32Array(W * H), bfsPrev = new Int32Array(W * H);
  let bfsGen = 0;
  const toRoad = (fx: number, fy: number, t: number = T.PATH) => {
    if (!inside(fx, fy)) return;
    const gen = ++bfsGen, q = [at(fx, fy)];
    bfsMark[q[0]!] = gen; bfsPrev[q[0]!] = -1;
    let goal = -1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h]!;
      if (road[i]) { goal = i; break; }
      const x = i % W, y = (i - x) / W;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        const xx = x + dx, yy = y + dy;
        if (xx < 3 || yy < 3 || xx > W - 4 || yy > H - 4) continue;
        const k = at(xx, yy);
        if (bfsMark[k] === gen || reserved[k]) continue;
        bfsMark[k] = gen; bfsPrev[k] = i; q.push(k);
      }
    }
    if (goal < 0) return;
    for (let i = goal; i !== -1; i = bfsPrev[i]!) {
      const x = i % W, y = (i - x) / W;
      for (const xx of [x, x + 1]) {
        if (!inside(xx, y) || reserved[at(xx, y)]) continue;
        const k = at(xx, y), c = cells[k];
        if (c === T.WATER || c === T.BRIDGE) cells[k] = T.BRIDGE; else if (c !== T.PLAZA && c !== T.LADDER && (t === T.PATH || !terrainOpen(c))) cells[k] = t;
        keep[k] = 1;
      }
    }
  };

  // 6b. The hedge labyrinth: a perfect maze of hedges with one entrance in the south and a treasure room in the middle.
  let labyrinth: Labyrinth | null = null;
  {
    const N = LAB_SIZE, tries: XY[] = [];
    for (let y = 8; y + N + 8 < H; y += 5) for (let x = 8; x + N + 8 < W; x += 5) tries.push([x, y]);
    tries.sort((a, b) => hash(seed + 200, a[0], a[1]) - hash(seed + 200, b[0], b[1]));
    const fitsLab = (x0: number, y0: number) => {
      if (Math.abs(x0 + N / 2 - S[0]) + Math.abs(y0 + N / 2 - S[1]) < sc(40)) return false;
      if (th.sea && x0 + N > W - sc(26)) return false;
      if (world === 0 && x0 < sc(34)) return false;
      for (let y = y0 - 3; y <= y0 + N + 3; y++) for (let x = x0 - 3; x <= x0 + N + 2; x++) {
        const i = at(x, y);
        if (reserved[i] || safe[i] || road[i] || keep[i] || Math.abs(y - riverRow(world, x)) <= 3) return false;
      }
      return true;
    };
    const spotLab = tries.find(([x, y]) => fitsLab(x, y));
    if (spotLab) {
      const [x0, y0] = spotLab, mr = rng(seed + 210);
      for (let y = y0 - 1; y <= y0 + N; y++) for (let x = x0 - 1; x <= x0 + N; x++) { cells[at(x, y)] = T.GRASS; keep[at(x, y)] = 1; }
      for (let y = y0; y < y0 + N; y++) for (let x = x0; x < x0 + N; x++) { cells[at(x, y)] = T.HEDGE; reserved[at(x, y)] = 1; }
      const open = (cx: number, cy: number) => { cells[at(x0 + 1 + cx * 2, y0 + 1 + cy * 2)] = T.GRASS; };
      const seen = new Uint8Array(LAB_CELLS * LAB_CELLS), stack: [number, number][] = [[7, LAB_CELLS - 1]];
      seen[(LAB_CELLS - 1) * LAB_CELLS + 7] = 1; open(7, LAB_CELLS - 1);
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1]!;
        const next = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).filter(([dx, dy]) => {
          const nx = cx + dx, ny = cy + dy;
          return nx >= 0 && ny >= 0 && nx < LAB_CELLS && ny < LAB_CELLS && !seen[ny * LAB_CELLS + nx];
        });
        if (!next.length) { stack.pop(); continue; }
        const [dx, dy] = next[Math.floor(mr() * next.length)]!, nx = cx + dx, ny = cy + dy;
        seen[ny * LAB_CELLS + nx] = 1;
        cells[at(x0 + 1 + cx * 2 + dx, y0 + 1 + cy * 2 + dy)] = T.GRASS;
        open(nx, ny);
        stack.push([nx, ny]);
      }
      const mid = x0 + Math.floor(N / 2), midY = y0 + Math.floor(N / 2);
      for (let y = midY - 2; y <= midY + 2; y++) for (let x = mid - 2; x <= mid + 2; x++) cells[at(x, y)] = T.FLOWERS;
      const door: XY = [mid, y0 + N - 1];
      cells[at(door[0], door[1])] = T.GRASS;
      for (let y = y0 + N; y <= y0 + N + 2; y++) for (let x = mid - 2; x <= mid + 2; x++) { cells[at(x, y)] = T.GRASS; keep[at(x, y)] = 1; }
      toRoad(mid, y0 + N + 1, T.GRASS);
      labyrinth = { x: x0, y: y0, size: N, door, center: [mid, midY] };
    }
  }

  // 7. Big mountains: a raised plateau ringed by two-tile cliffs, with ladders up the south and north faces.
  //    On top stands a lookout tower or a mountain shrine; cliffs hide caves and waterfalls pour down them. Each world has its own style.
  const style = PEAK_STYLE[world]!, peaks: Peak[] = [];
  let caves = 0, falls = 0;
  for (let tries = 0; tries < 3000 && peaks.length < style.n * PEAK_COUNT; tries++) {
    const r = (style.r[0] + rnd() * (style.r[1] - style.r[0])) * PEAK_SIZE;
    const rx = Math.max(6, Math.round(r * style.sx)), ry = Math.max(6, Math.round(r * style.sy));
    const cx = 8 + rx + Math.floor(rnd() * (W - 16 - 2 * rx)), cy = 8 + ry + Math.floor(rnd() * (H - 16 - 2 * ry));
    const x0 = cx - rx - 4, x1 = cx + rx + 4, y0 = cy - ry - 4, y1 = cy + ry + 4;
    if (x0 < 3 || y0 < 3 || x1 > W - 4 || y1 > H - 4 || (th.sea && x1 > W - sc(28))) continue;
    let ok = true;
    for (let y = y0; y <= y1 && ok; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = at(x, y);
        if (road[i] || reserved[i] || safe[i] || keep[i] || Math.abs(y - riverRow(world, x)) <= 4) { ok = false; break; }
      }
    }
    if (!ok) continue;
    const bw = x1 - x0 + 1, local = (x: number, y: number) => (y - y0) * bw + (x - x0);
    const mask = new Uint8Array(bw * (y1 - y0 + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1 - (noise(seed + 120, x, y) - 0.5) * 0.45) mask[local(x, y)] = 1;
    }
    const inM = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && mask[local(x, y)] === 1;
    const ring = (x: number, y: number) => {
      if (!inM(x, y)) return false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!inM(x + dx, y + dy)) return true;
      return false;
    };
    const top = (x: number, y: number) => inM(x, y) && !ring(x, y);
    if (!top(cx, cy)) continue;
    // Ladders: straight down (south face) and straight up (north face) through the cliff, from the plateau to open ground.
    const ladderAt = (x: number, dir: 1 | -1): { cells: XY[]; foot: XY } | null => {
      let y = cy;
      if (!top(x, y)) return null;
      while (top(x, y + dir)) y += dir;
      const out: XY[] = [];
      y += dir;
      while (ring(x, y)) { out.push([x, y]); y += dir; }
      if (out.length < 1 || out.length > 3 || inM(x, y)) return null;
      if (ring(x - 1, out[0]![1] - dir) || ring(x + 1, out[0]![1] - dir)) return null;
      return { cells: out, foot: [x, y] };
    };
    const cols = [0, -1, 1, -2, 2, -3, 3].map((d) => cx + d);
    const south = cols.map((x) => ladderAt(x, 1)).find(Boolean) ?? null;
    const northL = cols.map((x) => ladderAt(x, -1)).find(Boolean) ?? null;
    if (!south && !northL) continue;
    // Stamp the mountain.
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inM(x, y)) continue;
      const i = at(x, y);
      cells[i] = ring(x, y) ? T.CLIFF : T.HIGH; reserved[i] = 1;
    }
    const ladders: XY[] = [], ladderTops: XY[] = [], feet: XY[] = [];
    const calm = new Set<number>();
    for (const l of [south, northL]) {
      if (!l) continue;
      for (const [x, y] of l.cells) cells[at(x, y)] = T.LADDER;
      ladders.push(l.cells[0]!);
      const topCell = l.cells[0]![1] - (l === south ? 1 : -1);
      for (let d = -1; d <= 1; d++) calm.add(at(l.cells[0]![0] + d, topCell));
      ladderTops.push([l.cells[0]![0], topCell]);
      // Open ground at the foot of the ladder and a trail to the nearest road.
      const [fx, fy] = l.foot, dir = l === south ? 1 : -1;
      for (let yy = fy; yy !== fy + dir * 2; yy += dir) for (let xx = fx - 1; xx <= fx + 1; xx++) {
        if (!inside(xx, yy) || reserved[at(xx, yy)]) continue;
        if (!terrainOpen(cells[at(xx, yy)])) cells[at(xx, yy)] = T.GRASS;
        keep[at(xx, yy)] = 1;
      }
      feet.push([fx, fy + dir]);
    }
    // Mount-Crenel-style stacked terraces: up to two smaller plateaus rise from the first one, each ringed by its own
    // two-tile cliff and climbed by its own ladder, so the summit is a climb in several stages.
    const bh = y1 - y0 + 1, tierTile = new Uint8Array(bw * bh);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (top(x, y)) tierTile[local(x, y)] = T.HIGH;
    const innerTops: XY[] = [];
    let lower = top, tiers = 1;
    // Each terrace sits a little further back (north), so the front of the plateau keeps room for the tower or shrine.
    for (const [fr, back, tile] of [[0.62, 0.12, T.UPPER], [0.34, 0.2, T.SUMMIT]] as const) {
      const m2 = new Uint8Array(bw * bh), tcy = Math.round(cy - ry * back);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / (rx * fr), dy = (y - tcy) / (ry * fr);
        if (dx * dx + dy * dy > 1 - (noise(seed + 125 + tile, x, y) - 0.5) * 0.35) continue;
        let deep = true;
        for (let yy = -2; yy <= 2 && deep; yy++) for (let xx = -2; xx <= 2; xx++) if (!lower(x + xx, y + yy)) { deep = false; break; }
        if (deep) m2[local(x, y)] = 1;
      }
      const inT = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && m2[local(x, y)] === 1;
      const ringT = (x: number, y: number) => {
        if (!inT(x, y)) return false;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!inT(x + dx, y + dy)) return true;
        return false;
      };
      const topT = (x: number, y: number) => inT(x, y) && !ringT(x, y);
      if (!topT(cx, tcy)) break;
      const lowerTop = lower;
      // A ladder up this terrace's cliff. Where the cliff comes out thicker than a ladder, a narrow notch is cut into
      // it from the terrace above, so the ladder itself always spans the last two cliff tiles.
      const climb = (x: number, dir: 1 | -1): { cells: XY[]; notch: XY[]; foot: XY } | null => {
        let y = tcy;
        if (!topT(x, y)) return null;
        while (topT(x, y + dir)) y += dir;
        const out: XY[] = [];
        y += dir;
        while (ringT(x, y)) { out.push([x, y]); y += dir; }
        if (out.length < 1 || out.length > 8 || inT(x, y) || !lowerTop(x, y) || !lowerTop(x, y + dir)) return null;
        const cut = Math.max(0, out.length - 2);
        return { cells: out.slice(cut), notch: out.slice(0, cut), foot: [x, y] };
      };
      const ups = ([1, -1] as const).map((dir) => cols.map((x) => climb(x, dir)).find(Boolean) ?? null).filter((l): l is { cells: XY[]; notch: XY[]; foot: XY } => l !== null);
      if (!ups.length) break;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!inT(x, y)) continue;
        const ring = ringT(x, y);
        cells[at(x, y)] = ring ? T.CLIFF : tile;
        tierTile[local(x, y)] = ring ? 0 : tile;
      }
      for (const l of ups) for (const [x, y] of l.notch) { cells[at(x, y)] = tile; tierTile[local(x, y)] = tile; calm.add(at(x, y)); }
      for (const l of ups) {
        const dir = l.foot[1] > l.cells[0]![1] ? 1 : -1;
        for (const [x, y] of l.cells) cells[at(x, y)] = T.LADDER;
        ladders.push(l.cells[0]!);
        const tx = l.cells[0]![0], ty = (l.notch[0] ?? l.cells[0]!)[1] - dir;
        for (let d = -1; d <= 1; d++) { calm.add(at(tx + d, ty)); calm.add(at(tx + d, l.foot[1])); calm.add(at(tx + d, l.foot[1] + dir)); }
        innerTops.push([tx, ty]);
      }
      lower = topT;
      tiers++;
    }
    // A lookout tower or mountain shrine on the plateau (3x3, door at the bottom with a free step in front).
    let sum: XY | null = null, sd = Infinity;
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      let fit = true;
      for (let yy = y - 1; yy <= y + 4 && fit; yy++) for (let xx = x - 1; xx <= x + 3; xx++) if (!top(xx, yy) || !isHighGround(cells[at(xx, yy)]) || calm.has(at(xx, yy))) { fit = false; break; }
      if (!fit) continue;
      const d = Math.abs(x + 1 - cx) + Math.abs(y + 1 - cy);
      if (d < sd) { sd = d; sum = [x, y]; }
    }
    const k = peaks.length;
    if (sum) {
      stamp((k + world) % 2 === 0 ? "tower" : "shrine", sum[0], sum[1], 3, 3, k);
      for (let yy = sum[1] - 1; yy <= sum[1] + 4; yy++) for (let xx = sum[0] - 1; xx <= sum[0] + 3; xx++) calm.add(at(xx, yy));
    }
    // Spots in the south cliff (3 wide, plateau right above, open ground right below), away from the ladder.
    const lx = south ? south.cells[0]![0] : -99;
    const used: number[] = [];
    const cliffSpot = (pad: number): { x: number; ya: number; yb: number } | null => {
      for (const d of [-4, 4, -6, 6, -5, 5, -8, 8, -3, 3, -10, 10, -7, 7]) {
        const x = cx + d;
        if (Math.abs(x - lx) < 3 || used.some((u) => Math.abs(u - x) < 5)) continue;
        let y = cy;
        if (!top(x, y)) continue;
        while (top(x, y + 1)) y++;
        const ya = y + 1, yb = y + 2;
        let fit = true;
        if (!top(x, ya - 1) || inM(x, yb + 1)) continue;
        for (let xx = x - 1; xx <= x + 1 && fit; xx++) if (!ring(xx, ya) || !ring(xx, yb)) fit = false;
        for (let xx = x - pad; xx <= x + pad && fit; xx++) for (let yy = yb + 1; yy <= yb + 2; yy++) {
          const i = at(xx, yy);
          if (!inside(xx, yy) || (!inM(xx, yy) && (road[i] || reserved[i] || keep[i]))) { fit = false; break; }
        }
        if (fit) { used.push(x); return { x, ya, yb }; }
      }
      return null;
    };
    // A waterfall pouring from the plateau into a pool at the foot of the cliff.
    if (falls < 10) {
      const f = cliffSpot(2);
      if (f) {
        stamp("falls", f.x - 1, f.ya, 3, 2, k);
        for (let xx = f.x - 2; xx <= f.x + 2; xx++) for (let yy = f.yb + 1; yy <= f.yb + 2; yy++) if (!inM(xx, yy)) { cells[at(xx, yy)] = T.WATER; reserved[at(xx, yy)] = 1; }
        for (let xx = f.x - 3; xx <= f.x + 3; xx++) for (let yy = f.yb + 1; yy <= f.yb + 3; yy++) if (inside(xx, yy)) keep[at(xx, yy)] = 1;
        falls++;
      }
    }
    // A cave you can walk into.
    if (caves < 10) {
      const c = cliffSpot(1);
      if (c) {
        stamp("cave", c.x - 1, c.ya, 3, 2, k);
        for (let xx = c.x - 1; xx <= c.x + 1; xx++) for (let yy = c.yb + 1; yy <= c.yb + 2; yy++) {
          if (inM(xx, yy)) continue;
          if (!terrainOpen(cells[at(xx, yy)])) cells[at(xx, yy)] = T.GRASS;
          keep[at(xx, yy)] = 1;
        }
        toRoad(c.x, c.yb + 2, T.GRASS);
        caves++;
      }
    }
    for (const [fx, fy] of feet) toRoad(fx, fy, T.GRASS);
    // What grows on top: trees, rocks, snowy summits, lava craters, cloud flowers or iron spires.
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = at(x, y);
      if (!isHighGround(cells[i]) || calm.has(i)) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy), n = hash(seed + 130 + k, x, y);
      const t = style.top;
      if (t === "forest" && noise(seed + 140, x, y) > 0.6 && n < 0.8) cells[i] = T.TREE;
      else if ((t === "mesa" || t === "crags") && n < (t === "crags" ? 0.1 : 0.05)) cells[i] = T.ROCK;
      else if (t === "crags" && noise(seed + 140, x, y) > 0.66) cells[i] = T.TREE;
      else if (t === "snow" && d < 0.3) cells[i] = T.MOUNTAIN;
      else if (t === "crater" && d < 0.2) cells[i] = T.WATER;
      else if (t === "crater" && d < 0.3) cells[i] = T.MOUNTAIN;
      else if (t === "spires" && n < 0.08) cells[i] = T.MOUNTAIN;
      else if (t === "cloud" && n < 0.18) cells[i] = n < 0.05 ? T.TREE : T.FLOWERS;
    }
    // A clear walk from the ladders up every terrace to the tower or shrine door, whatever grows on top
    // (the shortest way over the terraces and their ladders; cliffs and buildings stay as they are).
    const prev = new Int32Array(bw * bh);
    const carve = (from: XY, to: XY) => {
      prev.fill(-2);
      const s0 = local(from[0], from[1]), goal = local(to[0], to[1]), q = [s0];
      prev[s0] = -1;
      for (let h = 0; h < q.length && prev[goal] === -2; h++) {
        const li = q[h]!, x = x0 + (li % bw), y = y0 + Math.floor(li / bw);
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const xx = x + dx, yy = y + dy;
          if (!inM(xx, yy)) continue;
          const k = local(xx, yy), c = cells[at(xx, yy)];
          if (prev[k] !== -2 || c === T.CLIFF || c === T.BUILDING) continue;
          prev[k] = li; q.push(k);
        }
      }
      if (prev[goal] === -2) return;
      for (let li = goal; li !== -1; li = prev[li]!) {
        const i = at(x0 + (li % bw), y0 + Math.floor(li / bw));
        if (tierTile[li] && !terrainOpen(cells[i])) cells[i] = tierTile[li]!;
      }
    };
    for (const lt of ladderTops) {
      if (sum) carve(lt, [sum[0] + 1, sum[1] + 3]);
      for (const it of innerTops) carve(lt, it);
    }
    peaks.push({ x: cx, y: cy, rx, ry, ladders, tiers });
  }

  // 7b. Fill the open countryside: hermit huts and old crypts to walk into, and camps, wells, statues and
  //     standing stones as landmarks. Each keeps a free apron of grass and its distance from everything else.
  const WILD: Partial<Record<StructureKind, readonly [number, number]>> = { hut: [4, 3], crypt: [3, 3], camp: [3, 2], well: [2, 2], statue: [2, 2], stones: [3, 2] };
  const WILD_BASE: StructureKind[] = ["hut", "camp", "crypt", "well", "statue", "hut", "stones", "camp", "crypt", "well", "hut", "statue",
    "stones", "camp", "crypt", "hut", "well", "statue", "stones", "camp", "crypt", "well", "statue", "stones", "camp", "well",
    "hut", "statue", "camp", "crypt", "stones", "well", "camp", "statue"];
  const WILD_ORDER: StructureKind[] = [...WILD_BASE, ...WILD_BASE.map((k) => (k === "hut" ? "camp" : k)), ...WILD_BASE.map((k) => (k === "hut" ? "stones" : k))];
  const wildKey = new Float64Array(W * H);
  const wildCells: number[] = [];
  for (let y = 6; y < H - 8; y++) for (let x = 6; x < W - 8; x++) { const i = at(x, y); wildKey[i] = hash(seed + 150, x, y); wildCells.push(i); }
  wildCells.sort((a, b) => wildKey[a]! - wildKey[b]!);
  const crowded = (x: number, y: number, w: number, h: number, d: number) => structures.some((o) => x - d < o.x + o.w && x + w + d > o.x && y - d < o.y + o.h && y + h + d > o.y);
  const wild: Structure[] = [];
  for (const i of wildCells) {
    if (wild.length >= WILD_ORDER.length) break;
    const kind = WILD_ORDER[wild.length]!, [w, h] = WILD[kind]!;
    const x = i % W, y = (i - x) / W;
    if (world === 0 && x < sc(34) && (y > sc(106) || y < sc(86))) continue;
    if (th.sea && x + w > W - sc(26)) continue;
    if (!freeFor(x - 2, y - 2, x + w + 1, y + h + 2) || crowded(x, y, w, h, 10)) continue;
    for (let yy = y - 2; yy <= y + h + 2; yy++) for (let xx = x - 2; xx <= x + w + 1; xx++) { if (!terrainOpen(cells[at(xx, yy)])) cells[at(xx, yy)] = T.GRASS; keep[at(xx, yy)] = 1; }
    stamp(kind, x, y, w, h, wild.length);
    wild.push(structures[structures.length - 1]!);
    if (kind === "hut" || kind === "crypt") toRoad(x + Math.floor(w / 2), y + h + 1);
  }

  // The castle town's homes join the list last, so the other places keep their numbers.
  structures.push(...town);

  // 8. Every open cell must be reachable from the start: cut-off pockets grow over.
  const reach = new Uint8Array(W * H);
  const queue: number[] = [at(S[0], S[1])];
  reach[queue[0]!] = 1;
  while (queue.length) {
    const i = queue.pop()!, x = i % W, y = (i - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy;
      if (!inside(xx, yy)) continue;
      const k = at(xx, yy);
      if (!reach[k] && terrainOpen(cells[k])) { reach[k] = 1; queue.push(k); }
    }
  }
  for (let i = 0; i < W * H; i++) if (!reach[i] && terrainOpen(cells[i])) cells[i] = isHighGround(cells[i]) ? T.ROCK : th.edge === T.WATER ? T.WATER : T.TREE;
  // A hut or crypt whose door cannot be reached becomes a ring of standing stones instead (nothing to enter).
  for (const s of wild) if ((s.kind === "hut" || s.kind === "crypt") && !reach[at(s.x + Math.floor(s.w / 2), s.y + s.h)]) s.kind = "stones";
  // A cave whose mouth cannot be reached is just rock.
  for (const s of structures) if (s.kind === "cave" && !reach[at(s.x + 1, s.y + s.h)]) s.kind = "stones";
  // Sandy shores on beaches and in the desert.
  if (th.shore) for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = cells[at(x, y)];
    if ((c === T.GRASS || c === T.FLOWERS) && !keep[at(x, y)] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells[at(x + dx!, y + dy!)] === T.WATER)) cells[at(x, y)] = T.SAND;
  }

  // 9. People and places stand on reachable open ground next to the roads.
  const taken = takenSet();
  for (const p of [...cities, ...smiths, [D[0], D[1]] as XY, ...guardPosts]) taken.push(p);
  if (home) taken.push(home);
  const free = (x: number, y: number) => inside(x, y) && reach[at(x, y)] === 1 && terrainOpen(cells[at(x, y)]) && cells[at(x, y)] !== T.LADDER && !taken.near(x, y, 2)
    && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => terrainOpen(cells[at(x + dx!, y + dy!)])).length >= 3;
  const spot = (near: XY): XY => {
    for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = near[0] + dx, y = near[1] + dy;
      if (free(x, y)) { const p: XY = [x, y]; taken.push(p); return p; }
    }
    taken.push(near);
    return near;
  };
  const guide = { home: spot([S[0] + 4, S[1] - 3]), lost: spot(lost) };
  const npcs = [spot([bx + 3, S[1] - sc(12)]), spot([M[0] - sc(14), M[1] + 3])];
  const romance = world < 5 ? spot([C2[0] + 3, C2[1] + 1]) : null;
  if (cottage) cottage = spot(cottage);
  if (woods) taken.push(woods);
  if (rose) rose = spot(rose);
  const near = taken.near;
  // Nobody stands right in front of a door.
  for (const s of structures) taken.push([s.x + Math.floor(s.w / 2), s.y + s.h]);

  // 9b. Treasure chests: in the heart of the labyrinth, beside some landmarks (on open ground), and tucked into dead ends of the countryside.
  const treasures: XY[] = [], treasureAt = new Map<number, number>();
  const ground = (x: number, y: number) => inside(x, y) && reach[at(x, y)] === 1 && (cells[at(x, y)] === T.GRASS || cells[at(x, y)] === T.FLOWERS || cells[at(x, y)] === T.SAND) && !safe[at(x, y)] && !road[at(x, y)];
  const openAll = (x: number, y: number) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!terrainOpen(cells[at(x + dx, y + dy)])) return false; return true; };
  const putChest = (x: number, y: number) => { treasureAt.set(at(x, y), treasures.length); treasures.push([x, y]); taken.push([x, y]); cells[at(x, y)] = T.BUILDING; };
  if (labyrinth && reach[at(labyrinth.center[0], labyrinth.center[1])]) putChest(labyrinth.center[0], labyrinth.center[1]);
  for (const s of wild) {
    if (!LANDMARKS.includes(s.kind) || hash(seed + 160, s.x, s.y) > 0.7) continue;
    const spots: XY[] = [[s.x + s.w + 1, s.y + s.h - 1], [s.x - 2, s.y + s.h - 1], [s.x + s.w + 1, s.y], [s.x - 2, s.y]];
    const c = spots.find(([x, y]) => ground(x, y) && openAll(x, y) && !near(x, y, 1));
    if (c) putChest(c[0], c[1]);
  }
  const ends: { x: number; y: number; r: number }[] = [];
  for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
    if (!ground(x, y) || keep[at(x, y)] || Math.abs(x - S[0]) + Math.abs(y - S[1]) < 24) continue;
    const openSides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => terrainOpen(cells[at(x + dx!, y + dy!)])).length;
    if (openSides === 1) ends.push({ x, y, r: hash(seed + 170, x, y) });
  }
  ends.sort((a, b) => a.r - b.r);
  let hidden = 0;
  for (const e of ends) {
    if (hidden >= 20) break;
    if (near(e.x, e.y, 3) || treasures.some(([x, y]) => Math.abs(x - e.x) + Math.abs(y - e.y) < sc(22))) continue;
    putChest(e.x, e.y); hidden++;
  }

  // 9c. Side quests: every hermit waits beside their hut; what they lost lies near a far-away landmark.
  const marks = wild.filter((s) => LANDMARKS.includes(s.kind));
  const quests: WorldSites["quests"] = [];
  for (const s of wild) {
    if (s.kind !== "hut" || !marks.length) continue;
    const dx = s.x + Math.floor(s.w / 2), dy = s.y + s.h;
    // A walk away, but not across the whole world: the nearest landmarks at least 50 steps from the hut.
    const dist = (o: Structure) => Math.abs(o.x - dx) + Math.abs(o.y - dy);
    const away = marks.filter((o) => dist(o) >= 50).sort((a, b) => dist(a) - dist(b));
    const pool = away.length ? away : marks;
    const m = pool[quests.length % Math.min(3, pool.length)]!;
    const giver = spot([dx + 3, dy]);
    const item = spot([m.x + m.w + 1, m.y + m.h]);
    quests.push({ hut: structures.indexOf(s), giver, item, at: m.kind });
  }

  // 10. Bushes to cut and monsters in the wild, never inside villages or the castle grounds.
  const bushes: XY[] = [], bushAt = new Map<number, number>();
  for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
    const i = at(x, y);
    if (cells[i] !== T.GRASS || safe[i] || road[i] || keep[i] || hash(seed + 70, x, y) > 0.045 || near(x, y, 3)) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const k = at(x + dx, y + dy); if (bushAt.has(k) || road[k] || !terrainOpen(cells[k])) { ok = false; break; } }
    if (ok) { bushAt.set(i, bushes.length); bushes.push([x, y]); }
  }
  const foes: FieldFoeSpot[] = [], foeNear = new Uint8Array(W * H);
  const FOE_GAP = 9;
  for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 6; x++) {
    const i = at(x, y), c = cells[i];
    if (!(c === T.GRASS || c === T.SAND || c === T.FLOWERS || isHighGround(c)) || !reach[i] || safe[i] || bushAt.has(i) || foeNear[i]) continue;
    if (Math.abs(x - S[0]) + Math.abs(y - S[1]) < VX + 18 || hash(seed + 80, x, y) > 0.05 || near(x, y, 4)) continue;
    foes.push({ x, y, slot: foes.length % 6 });
    for (let yy = Math.max(0, y - FOE_GAP + 1); yy <= Math.min(H - 1, y + FOE_GAP - 1); yy++) for (let xx = Math.max(0, x - FOE_GAP + 1); xx <= Math.min(W - 1, x + FOE_GAP - 1); xx++) foeNear[at(xx, yy)] = 1;
  }

  // Mountains: the big rock fields and the rocky world edges rise into peaks; dense forest cores far from roads too.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y), c = cells[i];
    if (c === T.ROCK && (noise(seed + 30, x, y) > th.rock + 0.05 || Math.min(x, y, W - 1 - x, H - 1 - y) < 3)) cells[i] = T.MOUNTAIN;
    else if (c === T.TREE && noise(seed + 95, x, y) > 0.7 && !reserved[i] && !near(x, y, 6)) {
      let isWild = true;
      for (let dy = -3; dy <= 3 && isWild; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (inside(xx, yy) && (road[at(xx, yy)] || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && terrainOpen(cells[at(xx, yy)])))) { isWild = false; break; } }
      if (isWild) cells[i] = T.MOUNTAIN;
    }
  }

  return {
    w: W, h: H, cells, structures, safe, bushes, bushAt, foes, peaks, guardPosts, patrol, treasures, treasureAt,
    sites: { spawn: S, dungeon: [D[0], D[1]], cities, smiths, npcs, romance, home, rose, guide, cottage, woods, castle: CASTLE_DOOR, labyrinth, quests },
  };
}

export const worldCell = (world: number, x: number, y: number) => {
  const m = worldMap(world);
  return x >= 0 && y >= 0 && x < m.w && y < m.h ? m.cells[y * m.w + x]! : T.TREE;
};
export const bushIdAt = (world: number, x: number, y: number) => {
  const m = worldMap(world);
  return x >= 0 && y >= 0 && x < m.w && y < m.h ? m.bushAt.get(y * m.w + x) ?? -1 : -1;
};
/** Index of the open-world treasure chest on this cell, or -1. */
export const treasureIdAt = (world: number, x: number, y: number) => {
  const m = worldMap(world);
  return x >= 0 && y >= 0 && x < m.w && y < m.h ? m.treasureAt.get(y * m.w + x) ?? -1 : -1;
};
export const inSafeZone = (world: number, x: number, y: number) => {
  const m = worldMap(world);
  return x >= 0 && y >= 0 && x < m.w && y < m.h && m.safe[y * m.w + x] === 1;
};

// ---------- The big dungeon ----------
// One dungeon per world, four rooms stacked from the entrance (south) to the boss (north):
// room 0 entrance hall → room 1 pillar hall (side chest) → room 2 with the treasure room (dungeon item) → room 3 boss.
// Each room's gate opens once its enemies are beaten; the boss gate also needs the dungeon item.
export const DUNGEON_ENTRY = { x: 24, y: 76 };
export const DUNGEON_EXIT_Y = 78;
/** Gate rows between room k and k+1 (four cells wide, x 22–25). */
export const GATE_ROWS = [57, 37, 19] as const;
export const GATE_X = [22, 25] as const;
export const dungeonRoomAt = (y: number) => (y >= 58 ? 0 : y >= 38 ? 1 : y >= 20 ? 2 : 3);
export type DungeonFoeSpot = { index: number; x: number; y: number; room: number; slot: number; boss: boolean };
export const DUNGEON_FOES: readonly DungeonFoeSpot[] = [
  ...([[18, 63], [29, 63], [24, 67]] as const).map(([x, y], j) => ({ x, y, room: 0, slot: j % 6, boss: false })),
  ...([[8, 42], [39, 42], [17, 47], [30, 52]] as const).map(([x, y], j) => ({ x, y, room: 1, slot: (2 + j) % 6, boss: false })),
  ...([[12, 24], [35, 24], [24, 28], [20, 33]] as const).map(([x, y], j) => ({ x, y, room: 2, slot: (4 + j) % 6, boss: false })),
  { x: 24, y: 7, room: 3, slot: 0, boss: true },
].map((f, index) => ({ ...f, index }));
export type DungeonChestSpot = { index: number; x: number; y: number; kind: "weapon" | "item" | "rubies" };
export const DUNGEON_CHESTS: readonly DungeonChestSpot[] = [
  { index: 0, x: 2, y: 47, kind: "weapon" },
  { index: 1, x: 44, y: 28, kind: "item" },
  { index: 2, x: 16, y: 61, kind: "rubies" },
];

const dungeonCache = new Map<number, TileMap>();
export function dungeonMap(world: number): TileMap {
  const w = Math.max(0, Math.min(8, Math.floor(world) || 0));
  let m = dungeonCache.get(w);
  if (m) return m;
  const W = DUNGEON_W, H = DUNGEON_H, cells = new Uint8Array(W * H).fill(T.WALL);
  const rect = (x0: number, y0: number, x1: number, y1: number, t: number = T.FLOOR) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y * W + x] = t; };
  rect(15, 60, 32, 73); rect(22, 74, 25, DUNGEON_EXIT_Y);
  rect(22, 55, 25, 59);
  rect(5, 40, 42, 54); rect(1, 45, 4, 49);
  for (const [x, y] of [[11, 44], [11, 49], [35, 44], [35, 49]] as const) rect(x, y, x + 1, y + 1, T.WALL);
  rect(22, 35, 25, 39);
  rect(9, 22, 38, 34); rect(39, 27, 41, 29); rect(42, 24, 46, 32);
  for (const [x, y] of [[16, 26], [30, 26], [16, 30], [30, 30]] as const) rect(x, y, x + 1, y + 1, T.WALL);
  rect(22, 17, 25, 21);
  rect(8, 2, 39, 16); rect(22, 3, 25, 16, T.CARPET);
  for (const [x, y] of [[13, 5], [33, 5], [13, 12], [33, 12]] as const) rect(x, y, x + 1, y + 1, T.WALL);
  m = { w: W, h: H, cells, structures: [] };
  dungeonCache.set(w, m);
  return m;
}
export const dungeonCell = (world: number, x: number, y: number) => (x >= 0 && y >= 0 && x < DUNGEON_W && y < DUNGEON_H ? dungeonMap(world).cells[y * DUNGEON_W + x]! : T.WALL);
