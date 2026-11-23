// Walk-in houses, explorable cabins and ruins, and the three heart pieces of every world.
// Pure and deterministic: layouts and hiding spots come from the world index, the save only stores what you took.
import { CASTLE_NAMES } from "./story-content";
import { worldMap, worldCell, inSafeZone, bushIdAt, hash, T, WORLD_W, WORLD_H, type Structure } from "./story-terrain";
import { canWalkWorld } from "./story-world";
import { worldSpawn, HEART_PIECES_PER_WORLD, MAX_BOMBS, piecesFound, type Buy, type StorySave } from "./story";
export type HouseKind = "house" | "cabin" | "ruin" | "tower" | "shrine" | "cave" | "castle" | "hut" | "crypt";
export type House = { index: number; world: number; kind: HouseKind; name: string; emoji: string; door: { x: number; y: number }; s: Structure };

const NAMES: Record<HouseKind, [string, string]> = { house: ["Wohnhaus", "🏠"], cabin: ["Waldhütte", "🛖"], ruin: ["Alte Ruine", "🏚️"], tower: ["Aussichtsturm", "🗼"], shrine: ["Bergschrein", "⛩️"], cave: ["Berghöhle", "🕳️"], castle: ["Schloss", "🏰"], hut: ["Einsiedlerhütte", "🛖"], crypt: ["Alte Gruft", "⚰️"] };
const ENTER = new Set<string>(Object.keys(NAMES));
const houseCache = new Map<number, House[]>();
/** Every house you can walk into: village homes plus the cabins and ruins in the wild (shops and temples have their own screens). */
export function worldHouses(world: number): House[] {
  const hit = houseCache.get(world);
  if (hit) return hit;
  const list: House[] = [];
  for (const s of worldMap(world).structures) {
    if (!ENTER.has(s.kind)) continue;
    const kind = s.kind as HouseKind;
    const [name0, emoji] = NAMES[kind];
    const name = kind === "castle" ? CASTLE_NAMES[world] ?? name0 : name0;
    list.push({ index: list.length, world, kind, name, emoji, door: { x: s.x + Math.floor(s.w / 2), y: s.y + s.h - 1 }, s });
  }
  houseCache.set(world, list);
  return list;
}

/** The house whose door is on this cell (you enter by walking up into it), if any. */
export const houseAtDoor = (world: number, x: number, y: number) => worldHouses(world).find((h) => h.door.x === x && h.door.y === y);

// ---------- Inside ----------
/** Room tiles: wall, floor, rug, exit door, chest, bed, table, fireplace, shelf, pot, rubble, throne, pillar, guard. */
export type RoomTile = "#" | "." | "~" | "D" | "C" | "B" | "T" | "F" | "S" | "P" | "R" | "K" | "I" | "G";
export const ROOM_W = 11;
export const ROOM_H = 8;
export type Room = { w: number; h: number; rows: RoomTile[][]; door: { x: number; y: number }; chests: { x: number; y: number; k: number }[] };
const SOLID = new Set<RoomTile>(["#", "B", "T", "F", "S", "P", "R", "C", "K", "I", "G"]);
export const CASTLE_W = 19, CASTLE_H = 12;

/** The inside of a house: walls around, furniture by its kind, chests to loot, the door at the bottom middle. */
export function houseRoom(world: number, index: number): Room {
  const h = worldHouses(world)[index];
  const kind = h?.kind ?? "house";
  const RW = kind === "castle" ? CASTLE_W : ROOM_W, RH = kind === "castle" ? CASTLE_H : ROOM_H;
  const rows: RoomTile[][] = Array.from({ length: RH }, (_, y) => Array.from({ length: RW }, (_, x) => (x === 0 || y === 0 || x === RW - 1 || y === RH - 1 ? "#" : ".")));
  const r = (k: number) => hash(world * 97 + index * 13 + k, index, world);
  const put = (x: number, y: number, t: RoomTile) => { rows[y]![x] = t; };
  const door = { x: Math.floor(RW / 2), y: RH - 1 };
  put(door.x, door.y, "D");
  if (kind === "castle") {
    for (let y = 2; y < RH - 1; y++) put(9, y, "~");
    put(9, 1, "K");
    for (const x of [4, 14]) for (const y of [3, 6, 9]) put(x, y, "I");
    for (const [x, y] of [[7, 3], [11, 3], [7, 7], [11, 7]] as const) put(x, y, "G");
    const chests = ([[2, 2], [16, 2], [16, 9]] as const).map(([x, y], k) => { put(x, y, "C"); return { x, y, k }; });
    return { w: RW, h: RH, rows, door, chests };
  }
  if (kind === "crypt") {
    // Two rows of pillars, a rug to the back wall, rubble in the corners and three chests.
    for (const x of [3, 7]) for (const y of [2, 4]) put(x, y, "I");
    for (let y = 1; y < ROOM_H - 1; y++) put(5, y, "~");
    for (const [x, y] of [[1, 5], [9, 5], [9, 1]] as const) put(x, y, "R");
  } else if (kind === "ruin" || kind === "cave") {
    // Rubble never blocks the middle walkway (row 3) or the door column, so every chest stays reachable.
    for (let k = 0; k < 7; k++) { const x = 1 + Math.floor(r(k) * 9), y = 1 + Math.floor(r(k + 20) * 5); if (Math.abs(x - 5) > 1 && y !== 3) put(x, y, "R"); }
    for (const [x, y] of [[2, 2], [8, 2], [5, 1]] as const) put(x, y, ".");
  } else if (kind === "shrine") {
    for (const [x, y] of [[2, 2], [8, 2], [2, 5], [8, 5]] as const) put(x, y, "I");
    for (let y = 2; y < ROOM_H - 1; y++) put(5, y, "~");
  } else if (kind === "tower") {
    put(1, 1, "S"); put(ROOM_W - 2, 1, "S"); put(5, 2, "T"); put(1, ROOM_H - 2, "P"); put(ROOM_W - 2, ROOM_H - 2, "P");
  } else {
    put(1, 1, "B"); put(2, 1, "B");
    put(ROOM_W - 2, 1, kind === "cabin" || kind === "hut" ? "F" : "S");
    put(5, 3, "T"); put(6, 3, "T");
    for (let x = 3; x <= 7; x++) put(x, 5, "~");
    put(1, ROOM_H - 2, "P"); put(ROOM_W - 2, ROOM_H - 2, "P");
  }
  const spots: [number, number][] = kind === "crypt" ? [[1, 1], [5, 1], [9, 3]] : kind === "shrine" ? [[5, 1], [9, 6]] : kind === "tower" ? [[2, 4], [8, 4]] : kind === "ruin" || kind === "cave" ? [[2, 2], [8, 2], [5, 1]] : kind === "cabin" || kind === "hut" ? [[8, 2], [2, 4]] : [[r(5) < 0.5 ? 8 : 2, 3]];
  const chests = spots.map(([x, y], k) => { put(x, y, "C"); return { x, y, k }; });
  return { w: RW, h: RH, rows, door, chests };
}
export const roomWalkable = (room: Room, x: number, y: number) => {
  const t = room.rows[y]?.[x];
  return t !== undefined && !SOLID.has(t);
};
export const chestKey = (world: number, index: number, k: number) => `${world}:${index}:${k}`;

/** Opens a chest once: rubies, or a few bombs once you own bombs. Ruins and cabins pay more than village homes. */
export function openHouseChest(s: StorySave, world: number, index: number, k: number): Buy & { reward?: string } {
  const key = chestKey(world, index, k);
  const h = worldHouses(world)[index];
  if (!h || !houseRoom(world, index).chests.some((c) => c.k === k)) return { ok: false, error: "Hier ist keine Truhe." };
  if (s.houseLoot.includes(key)) return { ok: false, error: "Die Truhe ist leer." };
  const loot = [...s.houseLoot, key];
  const piece = pieceChest(world);
  if (piece.house === index && piece.k === k) {
    const got = takePiece({ ...s, houseLoot: loot }, world, PIECE_CHEST);
    return { ok: true, save: got, reward: "+1 Herzteil 💗" };
  }
  if (h.kind !== "house" && k === 1 && s.bombs < MAX_BOMBS) {
    const bombs = Math.min(MAX_BOMBS, s.bombs + 3);
    return { ok: true, save: { ...s, houseLoot: loot, bombs, tool: s.tool ?? "bombs" }, reward: `+${bombs - s.bombs} 💣` };
  }
  const rubies = (h.kind === "house" ? 8 : h.kind === "castle" ? 60 : h.kind === "crypt" ? 40 : 30) * (world + 1);
  return { ok: true, save: { ...s, houseLoot: loot, rubies: s.rubies + rubies }, reward: `+${rubies} 💎` };
}

// ---------- Heart pieces ----------
/** Which piece of a world comes from where: hidden outside, in a cabin/ruin chest, behind the floor-plate puzzle. */
export const PIECE_FIELD = 0, PIECE_CHEST = 1, PIECE_PUZZLE = 2;
export const pieceKey = (world: number, piece: number) => `${world}:${piece}`;
export const hasPiece = (s: Pick<StorySave, "hearts">, world: number, piece: number) => s.hearts.includes(pieceKey(world, piece));
/** Adds one heart piece (once). Life refills when the piece completes the world's heart. */
export function takePiece(s: StorySave, world: number, piece: number): StorySave {
  if (piece < 0 || piece >= HEART_PIECES_PER_WORLD || hasPiece(s, world, piece)) return s;
  return { ...s, hearts: [...s.hearts, pieceKey(world, piece)] };
}
export { piecesFound };

/** The chest that holds the heart piece: the first cabin or ruin of the world (a village home only if there is none). */
export function pieceChest(world: number): { house: number; k: number } {
  const list = worldHouses(world);
  const h = list.find((x) => x.kind === "cabin" || x.kind === "ruin") ?? list.find((x) => x.kind !== "house" && x.kind !== "castle") ?? list[0];
  return { house: h?.index ?? 0, k: 0 };
}

const reachCache = new Map<number, Uint8Array>();
function reachable(world: number) {
  const hit = reachCache.get(world);
  if (hit) return hit;
  const W = WORLD_W, H = WORLD_H, start = worldSpawn(world);
  const seen = new Uint8Array(W * H), queue = [start.y * W + start.x];
  seen[queue[0]!] = 1;
  while (queue.length) {
    const i = queue.pop()!, x = i % W, y = (i - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy, k = yy * W + xx;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && !seen[k] && canWalkWorld(world, xx, yy)) { seen[k] = 1; queue.push(k); }
    }
  }
  reachCache.set(world, seen);
  return seen;
}
const meadow = (world: number, x: number, y: number) => { const t = worldCell(world, x, y); return t === T.GRASS || t === T.FLOWERS || t === T.SAND; };
const freeMeadow = (world: number, x: number, y: number) =>
  x > 1 && y > 1 && x < WORLD_W - 2 && y < WORLD_H - 2 && !!reachable(world)[y * WORLD_W + x] && meadow(world, x, y) && !inSafeZone(world, x, y) && bushIdAt(world, x, y) < 0;

const spotCache = new Map<number, { x: number; y: number }>();
/** The hidden heart piece: a reachable meadow cell tucked between trees, rocks, mountains or water, far from the start. */
export function pieceSpot(world: number): { x: number; y: number } {
  const hit = spotCache.get(world);
  if (hit) return hit;
  const start = worldSpawn(world);
  const blocked = (x: number, y: number) => { const t = worldCell(world, x, y); return t === T.TREE || t === T.ROCK || t === T.MOUNTAIN || t === T.CLIFF || t === T.WATER; };
  let best: { x: number; y: number; r: number } | null = null;
  for (let y = 2; y < WORLD_H - 2; y++) for (let x = 2; x < WORLD_W - 2; x++) {
    if (!freeMeadow(world, x, y) || Math.abs(x - start.x) + Math.abs(y - start.y) < 30) continue;
    let walls = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && blocked(x + dx, y + dy)) walls++;
    const r = walls + hash(world * 31 + 500, x, y);
    if (!best || r > best.r) best = { x, y, r };
  }
  const spot = best ? { x: best.x, y: best.y } : { x: start.x + 2, y: start.y };
  spotCache.set(world, spot);
  return spot;
}
/** True when the hidden heart piece lies on this cell and is still there. */
export const pieceAt = (s: Pick<StorySave, "hearts">, world: number, x: number, y: number) => {
  const p = pieceSpot(world);
  return p.x === x && p.y === y && !hasPiece(s, world, PIECE_FIELD);
};

// ---------- Floor-plate puzzle ----------
export const PLATES = 4;
export const PLATES_SOLVED = (1 << PLATES) - 1;
const plateCache = new Map<number, { x: number; y: number }>();
/** Where the four floor plates lie (left plate); the row, and the cells above and below it, are open meadow. */
export function platePuzzle(world: number): { x: number; y: number } {
  const hit = plateCache.get(world);
  if (hit) return hit;
  const start = worldSpawn(world), hidden = pieceSpot(world);
  let best: { x: number; y: number; r: number } | null = null;
  for (let y = 3; y < WORLD_H - 3; y++) for (let x = 3; x < WORLD_W - 7; x++) {
    if (Math.abs(x - start.x) + Math.abs(y - start.y) < 20 || Math.abs(x - hidden.x) + Math.abs(y - hidden.y) < 10) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= PLATES && ok; dx++) if (!freeMeadow(world, x + dx, y + dy)) ok = false;
    if (!ok) continue;
    const r = hash(world * 41 + 900, x, y);
    if (!best || r > best.r) best = { x, y, r };
  }
  const spot = best ? { x: best.x, y: best.y } : { x: start.x - 2, y: start.y + 3 };
  plateCache.set(world, spot);
  return spot;
}
/** Index of the plate on this cell, or -1. */
export const plateAt = (world: number, x: number, y: number) => {
  const p = platePuzzle(world);
  return y === p.y && x >= p.x && x < p.x + PLATES ? x - p.x : -1;
};
/** Stepping on a plate flips it and its neighbours (a lights-out riddle; every state can still be solved). */
export const stepPlate = (lit: number, i: number) => {
  let next = lit;
  for (const k of [i - 1, i, i + 1]) if (k >= 0 && k < PLATES) next ^= 1 << k;
  return next;
};
