// Detailed "storybook" painters for the open world (grass, flowers, paths, lakes, bridges, trees, rocks,
// mountains, cottages and the Lost Woods gate). They draw at HD = 32 canvas pixels per tile, twice the
// resolution of the classic 16px art, so houses look like Floria's hand-painted cottage.
// Everything is deterministic from the tile/structure position; nothing random, nothing stored.
import { T, hash, isHighGround, type Structure } from "./story-terrain";
import { mix } from "./pixel-elf";
import type { Pal } from "./story-tiles";

export const HD = 32;
type Ctx = CanvasRenderingContext2D;
type Cell = (x: number, y: number) => number;
type C3 = readonly [string, string, string];

const px = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
function disc(c: Ctx, cx: number, cy: number, r: number, color: string) {
  c.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
}
function oval(c: Ctx, cx: number, cy: number, rx: number, ry: number, color: string) {
  c.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); c.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
}
const H = hash;

/** Colours derived once per palette (mixing is cheap, but there are thousands of tiles). */
type Tones = { tuft: string; tuftDeep: string; tuftHi: string; earth: string; foam: string; shallow: string; deepWater: string; ripple: string; trunkHi: string; trunkLo: string; leafTex: string };
const toneCache = new WeakMap<Pal, Tones>();
function tones(p: Pal): Tones {
  const hit = toneCache.get(p);
  if (hit) return hit;
  const [deep, mid, light] = p.water;
  const t: Tones = {
    tuft: p.ground[1], tuftDeep: mix(p.ground[1], p.leaf[0], 0.35), tuftHi: mix(p.ground[2], "#ffffff", 0.2),
    earth: mix(p.ground[1], "#4a2e18", 0.5), foam: mix(light, "#ffffff", 0.45), shallow: mix(mid, light, 0.32), deepWater: mix(mid, deep, 0.6), ripple: mix(light, "#ffffff", 0.2),
    trunkHi: mix(p.trunk, "#ffe8c0", 0.22), trunkLo: mix(p.trunk, "#100808", 0.35), leafTex: mix(p.leaf[1], p.leaf[0], 0.4),
  };
  toneCache.set(p, t);
  return t;
}

// ---------- Ground ----------
function tuft(c: Ctx, x: number, y: number, t: Tones, base: C3) {
  px(c, x, y + 2, 1, 3, t.tuft); px(c, x + 1, y, 1, 5, t.tuft); px(c, x + 2, y + 1, 1, 4, t.tuft); px(c, x + 3, y + 3, 1, 2, t.tuft);
  px(c, x - 1, y + 5, 6, 1, t.tuftDeep); px(c, x + 1, y, 1, 1, t.tuftHi); px(c, x + 2, y + 1, 1, 1, base[2]);
}
export function hdGrass(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, base: C3 = p.ground) {
  const t = tones(p);
  px(c, X, Y, HD, HD, base[0]);
  for (let k = 0; k < 12; k++) px(c, X + Math.floor(H(k + 301, tx, ty) * 31), Y + Math.floor(H(k + 321, tx, ty) * 31), k % 3 ? 2 : 1, 1, k % 2 ? base[1] : base[2]);
  const tufts = 3 + Math.floor(H(341, tx, ty) * 3);
  for (let k = 0; k < tufts; k++) tuft(c, X + 2 + Math.floor(H(k + 351, tx, ty) * 24), Y + 2 + Math.floor(H(k + 361, tx, ty) * 22), t, base);
  const r = H(371, tx, ty);
  if (r < 0.06) { const a = X + 6 + Math.floor(H(372, tx, ty) * 18), b = Y + 6 + Math.floor(H(373, tx, ty) * 18), col = r < 0.03 ? "#ffffff" : p.flower[0]; px(c, a, b - 1, 1, 1, col); px(c, a - 1, b, 3, 1, col); px(c, a, b + 1, 1, 1, col); px(c, a, b, 1, 1, "#ffe680"); }
  else if (r < 0.1) { const a = X + 5 + Math.floor(H(374, tx, ty) * 20), b = Y + 5 + Math.floor(H(375, tx, ty) * 20); px(c, a, b + 2, 4, 1, t.tuftDeep); px(c, a, b, 4, 2, p.rock[2]); px(c, a, b, 2, 1, p.rock[3]); }
  else if (r < 0.15) { const a = X + 5 + Math.floor(H(376, tx, ty) * 20), b = Y + 5 + Math.floor(H(377, tx, ty) * 20); for (const [dx, dy] of [[0, 0], [2, 0], [1, 2]] as const) { px(c, a + dx, b + dy, 2, 2, base[2]); px(c, a + dx, b + dy + 1, 2, 1, base[1]); } }
}
export function hdFlowers(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number) {
  hdGrass(c, X, Y, p, tx, ty);
  for (let k = 0; k < 4; k++) {
    const a = X + 4 + Math.floor(H(k + 381, tx, ty) * 22), b = Y + 3 + Math.floor(H(k + 391, tx, ty) * 20);
    const col = k === 3 ? "#ffffff" : p.flower[(k + tx + ty) % 2]!, hi = mix(col, "#ffffff", 0.5), lo = mix(col, "#401020", 0.3);
    px(c, a + 1, b + 4, 1, 4, p.leaf[1]); px(c, a + 2, b + 6, 2, 1, p.leaf[2]); px(c, a - 1, b + 5, 2, 1, p.leaf[2]);
    px(c, a, b - 2, 2, 2, col); px(c, a - 2, b, 2, 2, col); px(c, a + 2, b, 2, 2, col); px(c, a, b + 2, 2, 2, lo);
    px(c, a, b - 2, 1, 1, hi); px(c, a - 2, b, 1, 1, hi); px(c, a, b, 2, 2, "#ffe070"); px(c, a + 1, b + 1, 1, 1, "#d09020");
  }
}
const pathLike = (t: number) => t === T.PATH || t === T.BRIDGE || t === T.PLAZA;
export function hdPath(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  hdGrass(c, X, Y, p, tx, ty);
  const t = tones(p), open = (dx: number, dy: number) => pathLike(cell(tx + dx, ty + dy));
  const l = open(-1, 0) ? 0 : 4, r = open(1, 0) ? 0 : 4, u = open(0, -1) ? 0 : 4, d = open(0, 1) ? 0 : 4;
  px(c, X + l, Y + u, HD - l - r, HD - u - d, p.path[0]);
  // ragged edges: dirt bites into the grass and grass tufts lean over the dirt
  for (let k = 1; k < HD - 2; k += 3) {
    const n = H(401 + k, tx, ty);
    if (l && n < 0.5) px(c, X + l - 1, Y + k, 1, 2, p.path[0]);
    if (r && n > 0.5) px(c, X + HD - r, Y + k, 1, 2, p.path[0]);
    if (u && n < 0.45) px(c, X + k, Y + u - 1, 2, 1, p.path[0]);
    if (d && n > 0.55) px(c, X + k, Y + HD - d, 2, 1, p.path[0]);
  }
  if (l) px(c, X + l, Y + u, 1, HD - u - d, p.path[1]);
  if (r) px(c, X + HD - r - 1, Y + u, 1, HD - u - d, p.path[1]);
  if (u) px(c, X + l, Y + u, HD - l - r, 1, p.path[1]);
  if (d) px(c, X + l, Y + HD - d - 1, HD - l - r, 1, p.path[1]);
  for (let k = 0; k < 10; k++) px(c, X + 5 + Math.floor(H(k + 421, tx, ty) * 22), Y + 5 + Math.floor(H(k + 431, tx, ty) * 22), k % 3 ? 1 : 2, 1, k % 2 ? p.path[1] : p.path[2]);
  for (let k = 0; k < 2; k++) {
    const a = X + 6 + Math.floor(H(k + 441, tx, ty) * 18), b = Y + 6 + Math.floor(H(k + 451, tx, ty) * 18);
    px(c, a, b + 2, 4, 1, p.path[1]); px(c, a, b, 4, 2, p.rock[2]); px(c, a, b, 2, 1, p.rock[3]); px(c, a + 3, b + 1, 1, 1, p.rock[1]);
  }
  if (l && H(461, tx, ty) < 0.5) tuft(c, X + l - 2, Y + 8 + Math.floor(H(462, tx, ty) * 14), t, p.ground);
  if (r && H(463, tx, ty) < 0.5) tuft(c, X + HD - r - 2, Y + 6 + Math.floor(H(464, tx, ty) * 14), t, p.ground);
}
export function hdPlaza(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number) {
  px(c, X, Y, HD, HD, p.plaza[1]);
  const shift = ty % 2 ? 8 : 0;
  for (const [sx, sy, w] of [[shift - 16, 0, 16], [shift, 0, 16], [shift + 16, 0, 16], [shift - 8, 16, 16], [shift + 8, 16, 16], [shift + 24, 16, 16]] as const) {
    const x0 = Math.max(X, X + sx + 1), x1 = Math.min(X + HD, X + sx + w);
    if (x1 <= x0) continue;
    px(c, x0, Y + sy + 1, x1 - x0, 14, p.plaza[0]); px(c, x0, Y + sy + 1, x1 - x0, 1, p.plaza[2]); px(c, x0, Y + sy + 14, x1 - x0, 1, mix(p.plaza[1], p.plaza[0], 0.4));
  }
  if (H(471, tx, ty) < 0.3) { px(c, X + 9, Y + 6, 3, 1, p.plaza[1]); px(c, X + 11, Y + 7, 2, 1, p.plaza[1]); }
  if (H(472, tx, ty) < 0.15) tuft(c, X + 20, Y + 10, tones(p), p.ground);
}
export function hdSand(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number) {
  px(c, X, Y, HD, HD, p.sand[0]);
  for (let k = 0; k < 14; k++) px(c, X + Math.floor(H(k + 481, tx, ty) * 31), Y + Math.floor(H(k + 491, tx, ty) * 31), 1, 1, k % 2 ? p.sand[1] : p.sand[2]);
  const b = Y + 8 + Math.floor(H(499, tx, ty) * 14);
  for (let x = 0; x < HD; x += 2) px(c, X + x, b + (Math.floor(x / 6) % 2), 2, 1, p.sand[1]);
  if (H(498, tx, ty) < 0.08) { const a = X + 8 + Math.floor(H(497, tx, ty) * 14); px(c, a, b - 6, 4, 3, "#f8e0d8"); px(c, a + 1, b - 6, 1, 3, "#e0a8a0"); px(c, a + 3, b - 5, 1, 2, "#e0a8a0"); }
}
export function hdStoneGround(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number) {
  px(c, X, Y, HD, HD, p.rock[1]);
  for (let k = 0; k < 10; k++) px(c, X + Math.floor(H(k + 501, tx, ty) * 30), Y + Math.floor(H(k + 511, tx, ty) * 30), 2, 1, k % 2 ? p.rock[0] : p.rock[2]);
}

// ---------- Water ----------
export function hdWater(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const t = tones(p), [deep, mid, light] = p.water, kind = p.waterKind;
  const land = (dx: number, dy: number) => { const v = cell(tx + dx, ty + dy); return v !== T.WATER && v !== T.BRIDGE; };
  const L = land(-1, 0), R = land(1, 0), U = land(0, -1), D = land(0, 1);
  const D8: readonly (readonly [number, number])[] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  const openAt = (ax: number, ay: number) => { for (const [dx, dy] of D8) { const v = cell(ax + dx, ay + dy); if (v !== T.WATER && v !== T.BRIDGE) return false; } return true; };
  // Only a lake interior (water all around, and water all around that) turns dark: one lone open tile in a small pond would read as a square.
  const deepAt = (ax: number, ay: number) => openAt(ax, ay) && openAt(ax - 1, ay) && openAt(ax + 1, ay) && openAt(ax, ay - 1) && openAt(ax, ay + 1);
  const open = openAt(tx, ty), isDeep = deepAt(tx, ty);
  px(c, X, Y, HD, HD, isDeep ? t.deepWater : mid);
  if (isDeep) for (let k = 0; k < 8; k++) px(c, X + Math.floor(H(k + 521, tx, ty) * 30), Y + Math.floor(H(k + 531, tx, ty) * 30), 2, 1, mid);
  // Deep and shallow water must not meet in a hard square: scatter the neighbour's tone along the shared edge.
  const depthOf = (ax: number, ay: number) => { const v = cell(ax, ay); return (v === T.WATER || v === T.BRIDGE) ? (deepAt(ax, ay) ? 1 : 0) : -1; };
  const mine = isDeep ? 1 : 0, other = mine ? mid : t.deepWater;
  const dither = (d: number, draw: () => void) => { if (d === 1 - mine) draw(); };
  dither(depthOf(tx, ty - 1), () => { for (let x = 0; x < HD; x += 2) if (H(701 + x, tx, ty) < 0.62) px(c, X + x, Y, 1, 3, other); });
  dither(depthOf(tx, ty + 1), () => { for (let x = 0; x < HD; x += 2) if (H(711 + x, tx, ty) < 0.62) px(c, X + x, Y + HD - 3, 1, 3, other); });
  dither(depthOf(tx - 1, ty), () => { for (let y = 0; y < HD; y += 2) if (H(721 + y, tx, ty) < 0.62) px(c, X, Y + y, 3, 1, other); });
  dither(depthOf(tx + 1, ty), () => { for (let y = 0; y < HD; y += 2) if (H(731 + y, tx, ty) < 0.62) px(c, X + HD - 3, Y + y, 3, 1, other); });
  // shallow bands where the lake meets land
  if (U) px(c, X, Y, HD, 9, t.shallow);
  if (D) px(c, X, Y + HD - 8, HD, 8, t.shallow);
  if (L) px(c, X, Y, 8, HD, t.shallow);
  if (R) px(c, X + HD - 8, Y, 8, HD, t.shallow);
  if (kind === "lava") {
    for (let k = 0; k < 3; k++) { const a = X + 4 + Math.floor(H(k + 541, tx, ty) * 22), b = Y + 4 + Math.floor(H(k + 551, tx, ty) * 22); px(c, a, b, 6, 2, deep); px(c, a + 2, b - 1, 4, 1, deep); }
    const a = X + 6 + Math.floor(H(561, tx, ty) * 18), b = Y + 6 + Math.floor(H(562, tx, ty) * 18);
    disc(c, a, b, 2, light); px(c, a - 1, b - 1, 1, 1, "#ffffff");
  } else if (kind === "void") {
    px(c, X, Y, HD, HD, "rgba(0,0,0,0.28)");
    for (let k = 0; k < 4; k++) px(c, X + Math.floor(H(k + 563, tx, ty) * 30), Y + Math.floor(H(k + 567, tx, ty) * 30), 1, 1, k ? light : "#ffffff");
  } else {
    for (let k = 0; k < 2; k++) {
      const a = X + 3 + Math.floor(H(k + 571, tx, ty) * 20), b = Y + 5 + Math.floor(H(k + 581, tx, ty) * 22);
      px(c, a, b, 3, 1, t.ripple); px(c, a + 3, b - 1, 3, 1, t.ripple); px(c, a + 6, b, 3, 1, t.ripple); px(c, a + 1, b + 1, 7, 1, mix(mid, deep, 0.35));
    }
    if (H(591, tx, ty) < 0.18) { const a = X + 6 + Math.floor(H(592, tx, ty) * 20), b = Y + 6 + Math.floor(H(593, tx, ty) * 20); px(c, a, b, 1, 1, "#ffffff"); px(c, a - 1, b + 1, 3, 1, light); }
    if (kind === "sky") { oval(c, X + 16, Y + 18, 7, 3, "#f4faff"); oval(c, X + 12, Y + 16, 4, 3, "#ffffff"); }
    else if (open && H(595, tx, ty) < 0.12) {
      const a = X + 9 + Math.floor(H(596, tx, ty) * 12), b = Y + 9 + Math.floor(H(597, tx, ty) * 12);
      oval(c, a, b, 6, 4, p.leaf[0]); oval(c, a, b, 5, 3, p.leaf[2]); px(c, a, b - 3, 5, 3, t.deepWater); px(c, a - 3, b - 2, 3, 1, p.leaf[3]);
      if (H(598, tx, ty) < 0.5) { px(c, a - 1, b - 1, 3, 2, p.flower[1]); px(c, a, b - 1, 1, 1, "#ffffff"); }
    }
  }
  // Banks: an earthen lip of waving width with foam along it, so the shore is not one straight grid line.
  const rim = kind === "lava" ? p.rock[0] : kind === "void" ? p.rock[1] : t.earth;
  const foam = kind === "lava" ? "#ffe080" : kind === "void" ? light : t.foam;
  const wavy = (k: number, seed: number) => 3 + Math.floor(H(seed + k, tx, ty) * 4);
  if (U) { for (let k = 0; k < HD; k += 2) { const n = wavy(k, 601); px(c, X + k, Y, 2, n, rim); px(c, X + k, Y + n, 2, 1, foam); } px(c, X, Y, HD, 1, p.ground[1]); }
  if (D) { for (let k = 0; k < HD; k += 2) { const n = wavy(k, 611); px(c, X + k, Y + HD - n, 2, n, rim); px(c, X + k, Y + HD - n - 1, 2, 1, foam); } }
  if (L) { for (let k = 0; k < HD; k += 2) { const n = wavy(k, 621); px(c, X, Y + k, n, 2, rim); px(c, X + n, Y + k, 1, 2, foam); } }
  if (R) { for (let k = 0; k < HD; k += 2) { const n = wavy(k, 631); px(c, X + HD - n, Y + k, n, 2, rim); px(c, X + HD - n - 1, Y + k, 1, 2, foam); } }
  const corner = (cx: number, cy: number, dx: number, dy: number) => { if (land(dx, dy) && !land(dx, 0) && !land(0, dy)) { px(c, cx, cy, 4, 4, rim); px(c, cx + (dx < 0 ? 4 : -1), cy + (dy < 0 ? 4 : -1), 1, 1, foam); } };
  corner(X, Y, -1, -1); corner(X + HD - 4, Y, 1, -1); corner(X, Y + HD - 4, -1, 1); corner(X + HD - 4, Y + HD - 4, 1, 1);
}
export function hdBridge(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  hdWater(c, X, Y, p, tx, ty, cell);
  const [base, dark, light] = p.bridge;
  const wet = (dx: number, dy: number) => cell(tx + dx, ty + dy) === T.WATER;
  // A wide bridge is crossed the same way everywhere: water two cells to the side still means the deck runs north-south.
  const ns = wet(-1, 0) || wet(1, 0) || wet(-2, 0) || wet(2, 0);
  // The deck reaches the tile edge wherever no rail stands there, so neighbouring bridge tiles merge into one deck.
  const ml = ns && wet(-1, 0) ? 3 : 0, mr = ns && wet(1, 0) ? 3 : 0, mt = !ns && wet(0, -1) ? 3 : 0, mb = !ns && wet(0, 1) ? 3 : 0;
  // the deck: planks across the direction of travel, with grain and nails (seams are painted, never open water)
  for (let k = 0; k < HD; k += 6) {
    const tone = H(611 + k, tx, ty), col = tone < 0.33 ? mix(base, dark, 0.25) : tone > 0.75 ? mix(base, light, 0.25) : base;
    if (ns) {
      px(c, X + ml, Y + k, HD - ml - mr, 6, col); px(c, X + ml, Y + k, HD - ml - mr, 1, light); px(c, X + ml, Y + k + 5, HD - ml - mr, 1, "rgba(0,0,0,0.45)");
      px(c, X + ml + 4 + Math.floor(tone * 12), Y + k + 2, 5, 1, dark); px(c, X + ml + 2, Y + k + 2, 1, 1, "#2a1a12"); px(c, X + HD - mr - 3, Y + k + 2, 1, 1, "#2a1a12");
    } else {
      px(c, X + k, Y + mt, 6, HD - mt - mb, col); px(c, X + k, Y + mt, 1, HD - mt - mb, light); px(c, X + k + 5, Y + mt, 1, HD - mt - mb, "rgba(0,0,0,0.45)");
      px(c, X + k + 2, Y + mt + 4 + Math.floor(tone * 12), 1, 5, dark); px(c, X + k + 2, Y + mt + 2, 1, 1, "#2a1a12"); px(c, X + k + 2, Y + HD - mb - 3, 1, 1, "#2a1a12");
    }
  }
  const rail = (x: number, y: number, w: number, h: number) => { px(c, x, y, w, h, "#2a1a12"); px(c, x + (w > h ? 0 : 1), y + (w > h ? 1 : 0), w > h ? w : 1, w > h ? 1 : h, light); };
  const post = (x: number, y: number) => { px(c, x, y, 5, 5, "#2a1a12"); px(c, x + 1, y + 1, 3, 3, dark); px(c, x + 1, y + 1, 2, 1, light); };
  if (ns) {
    if (wet(-1, 0)) { rail(X, Y, 3, HD); post(X - 1, Y + 1); post(X - 1, Y + 17); }
    if (wet(1, 0)) { rail(X + HD - 3, Y, 3, HD); post(X + HD - 4, Y + 1); post(X + HD - 4, Y + 17); }
  } else {
    if (wet(0, -1)) { rail(X, Y, HD, 3); post(X + 1, Y - 1); post(X + 17, Y - 1); }
    if (wet(0, 1)) { rail(X, Y + HD - 3, HD, 3); post(X + 1, Y + HD - 4); post(X + 17, Y + HD - 4); }
  }
}

// ---------- Trees, rocks, mountains ----------
const CLUMPS: readonly (readonly [number, number, number])[] = [[0, 4, 11], [-8, 6, 8], [8, 6, 8], [-4, 11, 8], [5, 12, 8], [0, -2, 10], [-6, 0, 7], [6, 0, 7]];
/** Leafy round tree (and the weeping willow): overlapping leaf clumps with outline, 4-tone light and leaf texture. */
export function hdRoundTree(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const t = tones(p), [out, dark, mid, light] = p.leaf, cx = X + 16, cy = Y + 6;
  const foot = cell(tx, ty + 1) !== T.TREE;
  if (foot) {
    oval(c, cx, Y + 29, 13, 3, "rgba(0,0,0,0.25)");
    px(c, cx - 5, Y + 16, 10, 14, out); px(c, cx - 4, Y + 16, 8, 13, p.trunk); px(c, cx - 4, Y + 16, 2, 13, t.trunkHi); px(c, cx + 2, Y + 16, 2, 13, t.trunkLo);
    px(c, cx - 1, Y + 20, 1, 4, t.trunkLo); px(c, cx + 1, Y + 24, 1, 3, t.trunkLo);
    px(c, cx - 8, Y + 27, 4, 3, out); px(c, cx - 7, Y + 27, 3, 2, p.trunk); px(c, cx + 4, Y + 27, 4, 3, out); px(c, cx + 4, Y + 27, 3, 2, t.trunkLo);
  }
  for (const [dx, dy, r] of CLUMPS) disc(c, cx + dx, cy + dy, r + 1, out);
  for (const [dx, dy, r] of CLUMPS) disc(c, cx + dx, cy + dy, r, dark);
  for (const [dx, dy, r] of CLUMPS) disc(c, cx + dx - 1, cy + dy - 2, r - 2, mid);
  for (const [dx, dy, r] of CLUMPS) if (dy <= 6) disc(c, cx + dx - 3, cy + dy - 4, Math.max(2, r - 6), light);
  for (let k = 0; k < 14; k++) {
    const a = cx - 11 + Math.floor(H(k + 621, tx, ty) * 22), b = cy - 8 + Math.floor(H(k + 631, tx, ty) * 22);
    const col = b < cy ? mid : t.leafTex;
    px(c, a, b, 3, 1, col); px(c, a - 1, b - 1, 1, 1, col); px(c, a + 3, b - 1, 1, 1, col);
  }
  for (let k = 0; k < 5; k++) px(c, cx - 9 + Math.floor(H(k + 641, tx, ty) * 14), cy - 8 + Math.floor(H(k + 651, tx, ty) * 10), 1, 1, mix(light, "#ffffff", 0.4));
  if (p.tree === "willow") for (let k = -12; k <= 12; k += 3) { const len = 5 + ((k + 15) % 4) * 2; px(c, cx + k, cy + 14, 1, len, out); px(c, cx + k + 1, cy + 14, 1, len - 1, mid); }
  else if (H(661, tx, ty) < 0.14) for (let k = 0; k < 3; k++) { const a = cx - 8 + Math.floor(H(k + 662, tx, ty) * 16), b = cy + Math.floor(H(k + 665, tx, ty) * 10); disc(c, a, b, 1, "#e03040"); px(c, a - 1, b - 1, 1, 1, "#ffb0b0"); }
}
export function hdPineTree(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const t = tones(p), [out, dark, mid, light] = p.leaf, cx = X + 16;
  const foot = cell(tx, ty + 1) !== T.TREE;
  if (foot) { oval(c, cx, Y + 29, 11, 3, "rgba(0,0,0,0.25)"); px(c, cx - 3, Y + 22, 6, 8, out); px(c, cx - 2, Y + 22, 4, 7, p.trunk); px(c, cx - 2, Y + 22, 1, 7, t.trunkHi); }
  const tiers: [number, number, number][] = [[Y - 10, 9, 5], [Y - 3, 10, 8], [Y + 4, 11, 11], [Y + 12, 11, 14]];
  for (const [y0, h, hw] of tiers) {
    for (let r = 0; r < h; r++) {
      const w = Math.max(1, Math.round((hw * (r + 1)) / h)), y = y0 + r;
      px(c, cx - w - 1, y, w * 2 + 3, 1, out);
      px(c, cx - w, y, w + 1, 1, r < 2 ? light : mid);
      px(c, cx + 1, y, w, 1, r < 2 ? mid : dark);
      if (r === h - 1) for (let x = -w; x <= w; x += 3) px(c, cx + x, y + 1, 2, 1, out);
    }
    px(c, cx - Math.round(hw * 0.6), y0 + h - 2, Math.round(hw * 0.5), 1, light);
  }
}
export function hdRock(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number) {
  const [out, dark, mid, light] = p.rock;
  oval(c, X + 16, Y + 28, 13, 3, "rgba(0,0,0,0.25)");
  oval(c, X + 16, Y + 18, 13, 10, out); oval(c, X + 16, Y + 18, 12, 9, mid);
  oval(c, X + 18, Y + 22, 10, 5, dark);
  oval(c, X + 11, Y + 14, 6, 4, light); px(c, X + 8, Y + 12, 4, 1, mix(light, "#ffffff", 0.4));
  px(c, X + 18, Y + 12, 1, 4, dark); px(c, X + 19, Y + 15, 1, 3, dark); px(c, X + 20, Y + 17, 2, 1, dark);
  if (p.waterKind === "water" && H(671, tx, ty) < 0.6) { oval(c, X + 16, Y + 10, 6, 2, p.leaf[2]); px(c, X + 13, Y + 9, 4, 1, p.leaf[3]); px(c, X + 20, Y + 11, 2, 2, p.leaf[1]); }
}
/** One rocky peak per mountain tile: lit left face, shaded right face, a zigzag ridge, ledges and a jagged snow cap. */
export function hdMountain(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const [out, dark, mid, light] = p.rock;
  const top = cell(tx, ty - 1) !== T.MOUNTAIN, lift = top ? 14 + Math.floor(H(681, tx, ty) * 10) : 8;
  const total = HD + lift, peak = X + 16 + Math.round((H(682, tx, ty) - 0.5) * 6), seed = Math.floor(H(683, tx, ty) * 7);
  const lo = mix(dark, out, 0.35);
  for (let y = 0; y < total; y++) {
    const half = Math.round(((y + 1) / total) * 20), yy = Y - lift + y, ridge = peak + Math.round(Math.sin((y + seed) * 0.55) * 1.6);
    const L = peak - half, R = peak + half;
    px(c, L - 1, yy, 1, 1, out); px(c, R, yy, 1, 1, out);
    const strata = (y + seed) % 7 === 0;
    px(c, L, yy, Math.max(0, ridge - L), 1, strata ? mid : y < total * 0.45 ? light : mix(light, mid, 0.5));
    px(c, ridge, yy, Math.max(0, R - ridge), 1, strata ? lo : y > total * 0.7 ? lo : dark);
  }
  for (let k = 0; k < 3; k++) { const a = peak - 12 + Math.floor(H(k + 684, tx, ty) * 10), b = Y + Math.floor(H(k + 687, tx, ty) * 20); px(c, a, b, 1, 3, dark); px(c, a + 1, b + 3, 1, 2, dark); }
  if (p.waterKind === "water") for (const ly of [Y + 10, Y + 22]) { const a = peak - 10 + Math.floor(H(ly, tx, ty) * 6); px(c, a, ly, 7, 1, out); px(c, a + 1, ly - 2, 1, 2, p.ground[1]); px(c, a + 3, ly - 3, 1, 3, p.ground[2]); px(c, a + 5, ly - 2, 1, 2, p.ground[1]); }
  if (top) {
    const cap = p.waterKind === "lava" ? "#ff8a30" : p.waterKind === "void" ? "#b070ff" : "#ffffff";
    const capLo = p.waterKind === "lava" ? "#c84818" : p.waterKind === "void" ? "#6a3aa0" : "#c8d6ec";
    const capRows = 8 + Math.floor(H(689, tx, ty) * 5);
    for (let y = 0; y < capRows; y++) {
      const half = Math.round(((y + 1) / total) * 20), yy = Y - lift + y, ridge = peak + Math.round(Math.sin((y + seed) * 0.55) * 1.6);
      px(c, peak - half, yy, ridge - (peak - half), 1, cap); px(c, ridge, yy, peak + half - ridge, 1, capLo);
    }
    const half = Math.round((capRows / total) * 20);
    for (let x = -half; x < half; x += 2) { const drip = 1 + Math.floor(H(690 + x, tx, ty) * 4); px(c, peak + x, Y - lift + capRows, 2, drip, x < 0 ? cap : capLo); }
    if (p.waterKind === "lava") { disc(c, peak, Y - lift + 2, 3, "rgba(255,160,40,0.5)"); }
  }
  for (const [dx, r] of [[-12, 3], [10, 4], [2, 2]] as const) { disc(c, peak + dx, Y + 29, r + 1, out); disc(c, peak + dx, Y + 29, r, mid); px(c, peak + dx - 1, Y + 28 - r + 1, 2, 1, light); }
}

// ---------- Cottages ----------
type RoofStyle = "moss" | "snow" | "clay" | "slate" | "cloud";
const ROOF_STYLE: readonly RoofStyle[] = ["moss", "clay", "moss", "snow", "slate", "clay", "cloud", "moss", "slate"];
const DOORS = ["#7a4a24", "#3c6a9a", "#9a3a3a", "#4a7a3a", "#6a4a8a"];

function vine(c: Ctx, x: number, y0: number, len: number, p: Pal, k: number) {
  let x0 = x;
  for (let i = 0; i < len; i += 2) {
    x0 += H(k, i, 7) < 0.33 ? -1 : H(k, i, 7) > 0.66 ? 1 : 0;
    px(c, x0, y0 - i, 1, 2, p.leaf[1]);
    if (i % 4 === 0) { px(c, x0 + (i % 8 ? 1 : -2), y0 - i, 2, 2, p.leaf[2]); px(c, x0 + (i % 8 ? 1 : -2), y0 - i, 1, 1, p.leaf[3]); }
    if (i % 6 === 4) { px(c, x0 - 1, y0 - i - 1, 3, 3, p.flower[1]); px(c, x0, y0 - i, 1, 1, "#ffffff"); }
  }
}
function flowerBox(c: Ctx, x: number, y: number, w: number, p: Pal, k: number) {
  px(c, x, y, w, 5, "#3a2010"); px(c, x + 1, y + 1, w - 2, 3, "#9a5a28"); px(c, x + 1, y + 1, w - 2, 1, "#c07a40");
  for (let i = 1; i < w - 1; i += 3) {
    px(c, x + i, y - 2, 2, 2, p.leaf[2]);
    const col = (i + k) % 3 === 0 ? "#ffffff" : p.flower[(i + k) % 2]!;
    px(c, x + i + (i % 2), y - 4, 2, 2, col);
  }
}
function arched(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  const r = Math.floor(w / 2);
  px(c, x, y + r, w, h - r, color);
  c.fillStyle = color;
  for (let dy = 0; dy <= r; dy++) { const half = Math.round(Math.sqrt(r * r - (r - dy) * (r - dy)) + (w % 2 ? 0.5 : 0)); c.fillRect(x + r - half + (w % 2 ? 0 : 0), y + dy, half * 2, 1); }
}
function windowPane(c: Ctx, wx: number, wy: number, p: Pal, k: number) {
  arched(c, wx - 2, wy - 2, 22, 24, "#2a1a12");
  arched(c, wx - 1, wy - 1, 20, 22, "#6b4423");
  arched(c, wx + 1, wy + 1, 16, 18, "#4a8ab8");
  arched(c, wx + 1, wy + 1, 16, 10, "#7cc4ec");
  px(c, wx + 3, wy + 4, 1, 4, "#d8f4ff"); px(c, wx + 4, wy + 3, 1, 2, "#d8f4ff"); px(c, wx + 12, wy + 11, 1, 3, "#a8dcf8");
  px(c, wx + 8, wy, 2, 20, "#6b4423"); px(c, wx, wy + 9, 18, 2, "#6b4423");
  px(c, wx - 3, wy + 19, 24, 3, "#2a1a12"); px(c, wx - 2, wy + 19, 22, 2, "#b07c48");
  flowerBox(c, wx - 2, wy + 23, 22, p, k);
}

const HEDGE = 17;

/** Trimmed hedge wall of the labyrinth: lighter leafy top, darker front face where a corridor runs below. */
export function hdHedge(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const [out, dark, mid, light] = p.leaf;
  const l = cell(tx - 1, ty) !== HEDGE, r = cell(tx + 1, ty) !== HEDGE;
  const front = cell(tx, ty + 1) !== HEDGE, top = cell(tx, ty - 1) !== HEDGE;
  const a = X + (l ? 2 : 0), b = X + HD - (r ? 2 : 0), y = Y - 9;
  if (front) oval(c, X + 16, Y + 30, 17, 3, "rgba(0,0,0,0.25)");
  px(c, a, y + 3, b - a, front ? 36 : 41, out);
  px(c, a + (l ? 1 : 0), y + 2, b - a - (l ? 1 : 0) - (r ? 1 : 0), 24, mid);
  px(c, a + (l ? 3 : 0), y, b - a - (l ? 3 : 0) - (r ? 3 : 0), 4, light);
  if (!top) px(c, a, y, b - a, 4, mid);
  if (front) {
    px(c, a + 1, Y + 15, b - a - 2, 13, dark);
    px(c, a + 2, Y + 15, b - a - 4, 2, mid);
    px(c, a + 3, Y + 28, b - a - 6, 2, out);
  }
  for (let k = 0; k < 22; k++) {
    const x = a + 3 + Math.floor(H(921 + k, tx, ty) * Math.max(1, b - a - 7));
    const yy = y + 5 + Math.floor(H(951 + k, tx, ty) * (front ? 29 : 32));
    px(c, x, yy, 3, 1, yy > Y + 15 ? mid : k % 3 ? light : dark);
    if (k % 3 === 0) px(c, x + 1, yy - 1, 1, 1, mid);
  }
}

function themedWall(c: Ctx, X: number, Y: number, W: number, h: number, p: Pal, theme: number) {
  const base = theme === 2 ? p.bridge[0] : theme === 3 ? "#b8e4f4" :
    theme === 4 || theme === 5 || theme === 8 ? p.rock[1] : p.wall[0];
  px(c, X, Y, W, h, base);
  px(c, X, Y, 3, h, mix(base, "#ffffff", 0.3));
  px(c, X + W - 4, Y, 4, h, mix(base, "#000000", 0.3));
  if (theme === 1 || theme === 7) {
    for (let k = 0; k < 12; k++) px(c, X + 5 + Math.floor(H(k + 981, X, Y) * (W - 10)), Y + 3 + Math.floor(H(k + 997, X, Y) * (h - 6)), 2, 1, p.wall[1]);
    return;
  }
  const step = theme === 2 ? 6 : theme === 6 ? 16 : 10;
  for (let y = 0; y < h; y += step) {
    px(c, X, Y + y, W, 1, mix(base, "#182030", 0.3));
    if (theme === 2) continue;
    for (let x = (y / step) % 2 ? 9 : 0; x < W; x += 20) {
      px(c, X + x, Y + y, 1, Math.min(step, h - y), p.rock[0]);
      if (theme === 4) px(c, X + Math.min(W - 2, x + 3), Y + y + 3, 2, 2, p.rock[3]);
    }
  }
}

/** Village homes outside the Würfelwald: each world has its own wall material and roof shape. */
function themedCottage(c: Ctx, s: Structure, X: number, Y: number, p: Pal, theme: number) {
  const W = s.w * HD, hh = s.h * HD, gy = Y + hh;
  const cx = X + Math.floor(s.w / 2) * HD + HD / 2;
  const eave = Y + Math.round(hh * 0.43), bot = gy - 8;
  const roofTop = Y - 14, span = eave - roofTop, middle = X + W / 2;
  const tint = theme === 3 ? "#eafaff" : theme === 4 ? p.rock[1] :
    theme === 6 ? "#f4efff" : theme === 7 ? "#287cb8" :
    theme === 8 ? "#603990" : p.roofs[s.v % p.roofs.length]!;
  const edge = mix(tint, "#100c20", 0.65), hi = mix(tint, "#ffffff", 0.3);
  oval(c, middle, gy - 1, W / 2, 4, "rgba(0,0,0,0.24)");
  themedWall(c, X + 12, eave, W - 24, bot - eave, p, theme);
  if (theme === 2) {
    for (const x of [X + 16, X + W - 20]) {
      px(c, x, bot - 5, 5, 13, p.bridge[1]);
      px(c, x, bot - 5, 1, 13, p.bridge[2]);
    }
  } else px(c, X + 10, bot, W - 20, 7, p.rock[1]);
  const dw = Math.round(W * 0.18), dh = Math.min(42, Math.round(hh * 0.28));
  const dx = Math.round(cx - dw / 2), dy = gy - dh - 3;
  for (const wx of [Math.round(X + W * 0.22) - 9, Math.round(X + W * 0.78) - 9]) windowPane(c, wx, eave + 12, p, s.v);
  arched(c, dx - 3, dy - 3, dw + 6, dh + 4, p.rock[0]);
  arched(c, dx, dy, dw, dh, p.bridge[0]);
  for (let x = 4; x < dw; x += 5) px(c, dx + x, dy + 6, 1, dh - 6, p.bridge[1]);
  px(c, dx + dw - 5, dy + 20, 2, 2, p.accent);
  px(c, dx - 3, gy - 3, dw + 6, 3, p.rock[3]);
  for (let y = roofTop; y <= eave + 3; y++) {
    const t = Math.max(0, Math.min(1, (y - roofTop) / span));
    const flat = theme === 1;
    const half = flat ? W / 2 :
      theme === 6 ? Math.round(W / 2 * Math.sqrt(Math.max(0, 1 - (1 - t) ** 2))) :
      theme === 2 ? Math.round(W / 2 * Math.min(1, t * 1.7)) :
      Math.round((W / 2 + 2) * t);
    if (flat && y < eave - 12) continue;
    const skew = theme === 8 ? Math.round((1 - t) * 13) : 0;
    const l = Math.round(middle - half + skew), width = half * 2;
    px(c, l - 1, y, width + 2, 1, edge);
    px(c, l, y, width, 1, (y - roofTop) % 7 === 6 ? edge : tint);
    px(c, l, y, Math.round(width * 0.36), 1, hi);
    if (theme === 5 && y % 13 === 0) px(c, Math.round(middle + t * 12), y, 5, 2, p.accent);
    if (theme === 2 && y % 4 === 0) for (let x = l + 3; x < l + width - 2; x += 6) px(c, x, y, 1, 3, edge);
    if (theme === 7 && y % 7 === 6) for (let x = l + 4; x < l + width - 2; x += 9) px(c, x, y - 4, 1, 4, hi);
  }
  if (theme === 1) {
    oval(c, Math.round(middle), eave - 14, 18, 15, p.wall[1]);
    oval(c, Math.round(middle - 2), eave - 16, 15, 13, p.wall[0]);
    px(c, X + 5, eave - 14, W - 10, 4, hi);
  }
  if (theme === 6) for (let k = 0; k < 7; k++) oval(c, X + 10 + Math.round(k * (W - 20) / 6), eave, 13, 6, "#ffffff");
  if (theme === 7) for (const x of [X + 13, X + W - 16]) { oval(c, x, eave + 6, 4, 3, "#ffe8d8"); px(c, x, eave + 3, 1, 5, "#dbaeb4"); }
  if (s.kind === "shop") {
    for (let x = -6; x < dw + 6; x += 4) px(c, dx + x, dy - 9, 4, 7, x % 8 ? "#fff4dc" : p.accent);
    px(c, dx - 21, dy + 2, 15, 12, p.bridge[1]);
    disc(c, dx - 14, dy + 8, 3, "#ffd060");
  }
}

/** The village blacksmith: a cottage with a big stone chimney, a glowing forge, an anvil and a hammer sign. */
export function hdSmithy(c: Ctx, s: Structure, X: number, Y: number, p: Pal, theme: number) {
  hdCottage(c, s, X, Y, p, theme);
  const W = s.w * HD, gy = Y + s.h * HD, ch = X + W - 42;
  px(c, ch, Y - 30, 25, 62, p.rock[0]);
  for (let y = -27; y < 30; y += 7) {
    px(c, ch + 2, Y + y, 21, 6, p.rock[2]);
    px(c, ch + 2, Y + y, 21, 1, p.rock[3]);
    px(c, ch + (y % 2 ? 9 : 15), Y + y, 1, 6, p.rock[0]);
  }
  px(c, ch - 3, Y - 34, 31, 6, p.rock[1]);
  for (let k = 0; k < 3; k++) oval(c, ch + 12 + k * 4, Y - 40 - k * 10, 6 + k * 2, 4 + k, "rgba(210,210,220,0.42)");
  const fx = X + 21, fy = gy - 38;
  arched(c, fx - 4, fy - 4, 35, 35, p.rock[0]);
  arched(c, fx, fy, 27, 29, "#29151c");
  px(c, fx + 3, fy + 20, 21, 7, "#df471c");
  for (let k = 0; k < 5; k++) px(c, fx + 4 + k * 4, fy + 13 + (k % 2) * 4, 3, 12 - (k % 2) * 4, "#ffcf58");
  const ax = X + W - 48, ay = gy - 14;
  px(c, ax + 6, ay + 6, 17, 7, p.bridge[1]);
  px(c, ax + 8, ay - 1, 12, 9, p.rock[0]);
  px(c, ax, ay - 5, 29, 5, p.rock[2]);
  px(c, ax + 3, ay - 5, 23, 1, p.rock[3]);
  px(c, ax + 19, ay - 14, 2, 10, p.bridge[0]);
  px(c, ax + 15, ay - 15, 10, 4, p.rock[3]);
  px(c, fx + 2, fy - 19, 2, 12, p.bridge[1]);
  px(c, fx + 2, fy - 20, 26, 2, p.bridge[1]);
  px(c, fx + 12, fy - 17, 2, 5, p.rock[0]);
  px(c, fx + 7, fy - 12, 19, 14, p.bridge[1]);
  px(c, fx + 16, fy - 9, 2, 9, p.accent);
  px(c, fx + 12, fy - 10, 10, 4, p.rock[3]);
}

/** Market stall on the village square: striped canopy and crates of goods. */
export function hdStall(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, gy = Y + s.h * HD;
  oval(c, X + W / 2, gy - 2, W / 2, 4, "rgba(0,0,0,0.2)");
  for (const x of [X + 6, X + W - 9]) { px(c, x, Y + 9, 3, gy - Y - 12, p.bridge[1]); px(c, x, Y + 9, 1, gy - Y - 12, p.bridge[2]); }
  for (let x = 0; x < W; x += 8) {
    const col = x % 16 ? "#fff2d4" : p.accent;
    px(c, X + x, Y + 5, Math.min(8, W - x), 21, col);
    px(c, X + x, Y + 25, Math.min(8, W - x), 5, mix(col, "#302030", 0.25));
  }
  px(c, X, Y + 4, W, 2, p.bridge[1]);
  px(c, X + 7, gy - 23, W - 14, 19, p.bridge[1]);
  px(c, X + 7, gy - 23, W - 14, 3, p.bridge[2]);
  for (let k = 0; k < 3; k++) {
    const x = X + 10 + k * Math.floor((W - 20) / 3);
    px(c, x, gy - 25, 21, 12, p.bridge[0]);
    px(c, x + 1, gy - 24, 19, 7, p.bridge[1]);
    for (let j = 0; j < 5; j++) {
      const col = k === 0 ? p.flower[0] : k === 1 ? "#f4ce62" : p.leaf[3];
      disc(c, x + 4 + (j % 3) * 6, gy - 25 - Math.floor(j / 3) * 4, 2, col);
      px(c, x + 3 + (j % 3) * 6, gy - 26 - Math.floor(j / 3) * 4, 1, 1, "#fff0c8");
    }
    px(c, x, gy - 17, 21, 2, p.bridge[2]);
  }
}

/** A waterfall (lavafall, mist-fall, void-fall) over the cliff, with foam on its pool. A CSS layer adds the motion. */
export function hdFalls(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, hh = s.h * HD, gy = Y + hh;
  const lava = p.waterKind === "lava", sky = p.waterKind === "sky", dark = p.waterKind === "void";
  const base = lava ? "#d94816" : dark ? "#633b9b" : sky ? "#d5eaff" : "#66b8e8";
  const light = lava ? "#ffda64" : dark ? "#d0a4ff" : "#f4fdff";
  const shade = lava ? "#9c2818" : dark ? "#34204e" : "#368ac2";
  px(c, X + 3, Y, W - 6, hh, shade);
  px(c, X + 7, Y, W - 14, hh, base);
  for (let k = 0; k < 13; k++) {
    const x = X + 9 + Math.floor(k * (W - 20) / 13);
    const start = Math.floor(H(1031 + k, s.x, s.y) * 15);
    px(c, x, Y + start, k % 3 ? 2 : 4, hh - start - 3, k % 3 ? light : shade);
    px(c, x + 2, Y + 8 + Math.floor(H(1051 + k, s.x, s.y) * 25), 1, 12, base);
  }
  oval(c, X + W / 2, Y + 2, W / 2 - 6, 3, light);
  for (let k = 0; k < 15; k++) {
    const x = X - HD + 5 + Math.round(k * (W + HD * 2 - 10) / 14);
    const yy = gy + 3 + Math.floor(H(1071 + k, s.x, s.y) * 9);
    oval(c, x, yy, 5 + k % 4, 2, base);
    px(c, x - 3, yy - 1, 6, 1, light);
    if (k % 2 === 0) {
      px(c, x, gy - 5 - k % 5, 2, 3, light);
      oval(c, x, gy - 1, 8, 4, lava ? "rgba(255,180,70,0.22)" : dark ? "rgba(180,130,240,0.22)" : "rgba(240,250,255,0.35)");
    }
  }
}

/** Storybook cottage like Floria's: round thatched roof with moss and flowers, arched door, flower boxes, vines and a chimney. */
export function hdCottage(c: Ctx, s: Structure, X: number, Y: number, p: Pal, theme: number) {
  if (theme > 0 && s.kind !== "cabin" && s.kind !== "hut") { themedCottage(c, s, X, Y, p, theme); return; }
  const W = s.w * HD, Hh = s.h * HD, gy = Y + Hh, cxm = X + W / 2;
  const style = ROOF_STYLE[theme] ?? "moss";
  const tint = p.roofs[s.v % p.roofs.length]!;
  const roofBase = style === "moss" ? mix("#c8a850", p.leaf[2], 0.35) : style === "snow" ? mix("#b89a60", tint, 0.3) : style === "cloud" ? mix("#ffffff", tint, 0.45) : tint;
  const roofHi = mix(roofBase, "#fff4d0", 0.3), roofLo = mix(roofBase, "#1a1008", 0.32), roofOut = mix(roofBase, "#140808", 0.65);
  const wallOut = mix(p.wall[1], "#1a1010", 0.55);
  const wl = X + 12, wr = X + W - 12, wallTop = Y + Math.round(Hh * 0.4), wallBot = gy - 8;
  const eave = wallTop + 10, roofTop = Y - 14;

  oval(c, cxm, gy - 2, W / 2 + 2, 5, "rgba(0,0,0,0.28)");
  // chimney behind the roof
  const chx = X + W - 34;
  px(c, chx - 1, Y - 27, 14, 40, "#2a1a12");
  for (let y = 0; y < 38; y += 5) for (let x = (y / 5) % 2 ? 0 : 3; x < 12; x += 6) { px(c, chx + x, Y - 26 + y, 5, 4, p.rock[2]); px(c, chx + x, Y - 26 + y, 5, 1, p.rock[3]); px(c, chx + x + 4, Y - 26 + y, 1, 4, p.rock[1]); }
  px(c, chx - 3, Y - 30, 18, 4, "#2a1a12"); px(c, chx - 2, Y - 29, 16, 2, p.rock[2]);
  if (style === "moss") { px(c, chx, Y - 18, 3, 8, p.leaf[2]); px(c, chx, Y - 18, 1, 3, p.leaf[3]); }

  // walls
  px(c, wl - 1, wallTop - 1, wr - wl + 2, wallBot - wallTop + 2, wallOut);
  if (s.kind === "cabin" || s.kind === "hut") {
    for (let y = wallTop; y < wallBot; y += 6) {
      px(c, wl, y, wr - wl, 6, "#8a5a30"); px(c, wl, y, wr - wl, 1, "#b07c48"); px(c, wl, y + 5, wr - wl, 1, "#4a2c14");
      for (const ex of [wl - 1, wr - 4]) { disc(c, ex + 2, y + 3, 3, "#3a2010"); disc(c, ex + 2, y + 3, 2, "#c89a60"); px(c, ex + 2, y + 3, 1, 1, "#8a5a30"); }
    }
  } else {
    px(c, wl, wallTop, wr - wl, wallBot - wallTop, p.wall[0]);
    px(c, wl, wallTop, 3, wallBot - wallTop, mix(p.wall[0], "#ffffff", 0.3));
    px(c, wr - 5, wallTop, 5, wallBot - wallTop, p.wall[1]);
    for (let k = 0; k < 14; k++) px(c, wl + 4 + Math.floor(H(k + 701, s.x, s.y) * (wr - wl - 8)), wallTop + 4 + Math.floor(H(k + 721, s.x, s.y) * (wallBot - wallTop - 6)), k % 3 ? 2 : 1, 1, p.wall[1]);
    for (const bx of [wl, wr - 5]) { px(c, bx, wallTop, 5, wallBot - wallTop, "#6b4423"); px(c, bx + 1, wallTop, 1, wallBot - wallTop, "#9a6434"); px(c, bx + 4, wallTop, 1, wallBot - wallTop, "#3a2010"); }
  }
  // stone foundation
  px(c, wl - 3, wallBot - 1, wr - wl + 6, gy - wallBot - 1, p.rock[0]);
  for (let x = wl - 2, i = 0; x < wr + 2; x += 8, i++) { const w = Math.min(7, wr + 2 - x); px(c, x, wallBot + (i % 2), w, 5, p.rock[2]); px(c, x, wallBot + (i % 2), w, 1, p.rock[3]); px(c, x + w - 1, wallBot + (i % 2) + 1, 1, 4, p.rock[1]); }

  // windows either side of the door
  const winY = eave + 4;
  for (const [wx, k] of [[wl + 9, 0], [wr - 9 - 18, 1]] as const) windowPane(c, wx, winY, p, k + s.v);
  // vines climbing the corners
  if (s.kind !== "shop") { vine(c, wl + 2, wallBot - 2, Math.min(30, wallBot - eave), p, s.v * 7 + 1); vine(c, wr - 3, wallBot - 2, Math.min(24, wallBot - eave), p, s.v * 7 + 2); }

  // arched door with stone frame
  const dw = Math.max(22, Math.round(W * 0.18)), dh = Math.round(dw * 1.45), dx = Math.round(X + Math.floor(s.w / 2) * HD + HD / 2 - dw / 2), dTop = gy - 3 - dh;
  arched(c, dx - 5, dTop - 5, dw + 10, dh + 6, p.rock[0]);
  arched(c, dx - 4, dTop - 4, dw + 8, dh + 5, p.rock[2]);
  for (let i = 0; i < 7; i++) { const a = (Math.PI * i) / 6, r = 14; px(c, Math.round(cxm + Math.cos(a) * r) - 1, Math.round(dTop + 11 - Math.sin(a) * r), 1, 2, p.rock[1]); }
  const door = DOORS[s.v % DOORS.length]!, doorHi = mix(door, "#ffffff", 0.22), doorLo = mix(door, "#000000", 0.35);
  arched(c, dx - 1, dTop - 1, dw + 2, dh + 2, "#1a0e08");
  arched(c, dx, dTop, dw, dh, door);
  for (let x = 4; x < dw; x += 5) px(c, dx + x, dTop + (Math.abs(x - dw / 2) > 6 ? 5 : 1), 1, dh - (Math.abs(x - dw / 2) > 6 ? 5 : 1), doorLo);
  px(c, dx + 1, dTop + 6, 2, dh - 7, doorHi);
  for (const by of [dTop + 12, dTop + 25]) { px(c, dx, by, dw, 2, "#2e2a30"); px(c, dx + 2, by, 1, 1, "#9a96a0"); px(c, dx + dw - 3, by, 1, 1, "#9a96a0"); }
  disc(c, Math.round(cxm), dTop + 6, 3, "#2a1a12"); disc(c, Math.round(cxm), dTop + 6, 2, "#7cc4ec"); px(c, Math.round(cxm) - 1, dTop + 5, 1, 1, "#d8f4ff");
  disc(c, dx + dw - 5, dTop + 19, 1, "#ffd860"); px(c, dx + dw - 6, dTop + 18, 1, 1, "#fff4b0");
  px(c, dx - 3, gy - 3, dw + 6, 3, p.rock[2]); px(c, dx - 3, gy - 3, dw + 6, 1, p.rock[3]); px(c, dx - 1, gy, dw + 2, 2, p.rock[1]);
  // lantern and flower pots beside the door
  const lx = dx + dw + 7;
  px(c, lx - 2, dTop + 4, 6, 1, "#2a1a12"); px(c, lx, dTop + 5, 1, 2, "#2a1a12");
  px(c, lx - 2, dTop + 7, 6, 8, "#2a1a12"); px(c, lx - 1, dTop + 8, 4, 6, "#ffd860"); px(c, lx, dTop + 9, 2, 3, "#fff8d0");
  disc(c, lx + 1, dTop + 11, 7, "rgba(255,220,120,0.16)");
  for (const pxL of [dx - 13, dx + dw + 4]) {
    px(c, pxL, gy - 11, 9, 8, "#4a2010"); px(c, pxL + 1, gy - 11, 7, 7, "#b8643a"); px(c, pxL, gy - 12, 9, 2, "#d88a58"); px(c, pxL + 1, gy - 10, 2, 5, "#d07a48");
    disc(c, pxL + 4, gy - 15, 4, p.leaf[1]); disc(c, pxL + 3, gy - 16, 2, p.leaf[2]);
    for (const [fx, fy] of [[1, -18], [5, -19], [7, -15], [2, -14]] as const) { px(c, pxL + fx, gy + fy, 2, 2, p.flower[(fx + s.v) % 2]!); px(c, pxL + fx, gy + fy, 1, 1, "#ffffff"); }
  }

  // the round thatched roof
  const halfMax = W / 2 + 2, span = eave - roofTop;
  for (let y = roofTop; y <= eave + 3; y++) {
    const tt = Math.min(1, (eave - y) / span), half = Math.round(halfMax * Math.cbrt(Math.max(0, 1 - tt * tt * tt)) * (y > eave ? 1 - (y - eave) * 0.02 : 1));
    if (half <= 0) continue;
    const L = Math.round(cxm - half), Rr = Math.round(cxm + half), band = (y - roofTop) % 6;
    px(c, L - 1, y, Rr - L + 2, 1, roofOut);
    const body = band >= 4 || y > eave ? roofLo : roofBase;
    px(c, L, y, Rr - L, 1, body);
    px(c, L, y, Math.round((Rr - L) * 0.32), 1, band >= 4 ? roofBase : roofHi);
    px(c, Math.round(Rr - (Rr - L) * 0.22), y, Math.round((Rr - L) * 0.22), 1, roofLo);
    if (style === "clay" || style === "slate") { if (band === 5) for (let x = L + ((y / 6) % 2 ? 0 : 4); x < Rr; x += 8) px(c, x, y - 4, 1, 5, roofOut); }
    else for (let x = L + 2; x < Rr - 1; x += 3) if (H(741, x, y) < 0.22) px(c, x, y, 1, 2, roofLo);
    if (y === roofTop || y === roofTop + 1) px(c, L, y, Rr - L, 1, roofOut);
  }
  // straw ends hanging off the eave
  for (let x = Math.round(cxm - halfMax) + 1; x < cxm + halfMax - 1; x += 2) px(c, x, eave + 3, 1, 1 + Math.floor(H(751, x, s.y) * 3), style === "clay" || style === "slate" ? roofOut : roofLo);
  // round dormer window peeking out of the roof
  const dmx = Math.round(cxm - W * 0.18), dmy = roofTop + Math.round(span * 0.48);
  disc(c, dmx, dmy - 2, 9, roofOut); disc(c, dmx, dmy - 2, 8, roofHi); disc(c, dmx, dmy, 7, "#2a1a12"); disc(c, dmx, dmy, 6, "#6b4423"); disc(c, dmx, dmy, 5, "#7cc4ec");
  px(c, dmx - 5, dmy, 11, 1, "#6b4423"); px(c, dmx, dmy - 5, 1, 11, "#6b4423"); px(c, dmx - 3, dmy - 3, 2, 1, "#d8f4ff");
  px(c, dmx - 7, dmy + 6, 15, 2, roofLo);
  // moss, flowers or snow on top
  if (style === "moss" || style === "cloud") {
    const moss = style === "cloud" ? ["#ffffff", "#e8ecff", "#c8ccf0"] : [p.leaf[2], p.leaf[3], p.leaf[1]];
    for (let k = 0; k < 6; k++) {
      const mx = Math.round(cxm - halfMax * 0.75 + H(k + 761, s.x, s.y) * halfMax * 1.5), my = roofTop + 4 + Math.floor(H(k + 771, s.x, s.y) * span * 0.75);
      if (Math.abs(mx - dmx) < 10 && Math.abs(my - dmy) < 10) continue;
      const r = 3 + Math.floor(H(k + 781, s.x, s.y) * 4);
      oval(c, mx, my, r + 2, r, moss[2]!); oval(c, mx - 1, my - 1, r + 1, r - 1, moss[0]!); px(c, mx - r, my - r + 1, r, 1, moss[1]!);
      for (let f = 0; f < 3; f++) { const fx = mx - r + Math.floor(H(k * 3 + f + 791, s.x, s.y) * r * 2), fy = my - 1 + (f % 2) * 2; px(c, fx, fy, 2, 2, f === 2 ? "#ffffff" : p.flower[1]); px(c, fx, fy, 1, 1, "#ffe0f0"); }
    }
    for (let k = 0; k < 8; k++) { const x = Math.round(cxm - halfMax + 6 + k * (halfMax * 2 - 12) / 7), len = 3 + Math.floor(H(k + 801, s.x, s.y) * 6); px(c, x, eave + 2, 1, len, p.leaf[1]); px(c, x - 1, eave + 2 + len - 2, 3, 2, p.leaf[2]); if (k % 3 === 1) px(c, x, eave + len + 1, 2, 2, p.flower[1]); }
  } else if (style === "snow") {
    for (let y = roofTop; y < roofTop + span * 0.5; y++) {
      const tt = (eave - y) / span, half = Math.round(halfMax * Math.cbrt(Math.max(0, 1 - tt * tt * tt))) - 1;
      px(c, Math.round(cxm - half), y, half * 2, 1, y % 5 ? "#ffffff" : "#e4ecf8");
      px(c, Math.round(cxm + half * 0.5), y, Math.round(half * 0.5), 1, "#c8d6ec");
    }
    for (let x = Math.round(cxm - halfMax) + 3; x < cxm + halfMax - 3; x += 5) { const len = 2 + Math.floor(H(811, x, s.y) * 5); px(c, x, eave + 3, 2, len, "#d8f0ff"); px(c, x, eave + 3, 1, len - 1, "#ffffff"); }
  }

  // smoke
  for (const [sx, sy, r] of [[5, -35, 3], [8, -42, 4], [4, -50, 5]] as const) disc(c, chx + sx, Y + sy, r, "rgba(240,240,240,0.45)");

  if (s.kind === "shop") {
    // striped awning over the door and a hanging sign with a gold coin
    for (let x = 0; x < 40; x += 4) { px(c, dx - 9 + x, dTop - 9, 4, 6, x % 8 ? "#ffffff" : tint); px(c, dx - 9 + x, dTop - 3, 4, 2, x % 8 ? "#e0e0e0" : mix(tint, "#000000", 0.3)); }
    px(c, dx - 10, dTop - 10, 42, 1, "#2a1a12");
    const sx = dx - 26, sy = eave + 6;
    px(c, sx + 8, sy - 4, 1, 4, "#2a1a12"); px(c, sx + 2, sy - 4, 14, 1, "#2a1a12");
    px(c, sx - 1, sy, 20, 14, "#2a1a12"); px(c, sx, sy + 1, 18, 12, "#c89058"); px(c, sx, sy + 1, 18, 1, "#e0b07a");
    disc(c, sx + 9, sy + 7, 4, "#8a5a10"); disc(c, sx + 9, sy + 7, 3, "#ffd040"); px(c, sx + 8, sy + 5, 2, 1, "#fff4b0");
    for (const [bx, by] of [[wr + 2, gy - 16], [wr + 6, gy - 10]] as const) { px(c, bx, by, 10, 10, "#3a2010"); px(c, bx + 1, by + 1, 8, 8, "#a06c3a"); px(c, bx + 1, by + 4, 8, 1, "#3a2010"); px(c, bx + 4, by + 1, 1, 8, "#3a2010"); }
  }
  if (s.kind === "home") {
    for (let x = X - 10; x < X + W + 10; x += 6) { if (Math.abs(x + 2 - cxm) < 24) continue; px(c, x, gy + 4, 4, 11, "#3a2010"); px(c, x + 1, gy + 3, 2, 11, "#f0e8d8"); px(c, x + 1, gy + 3, 1, 1, "#ffffff"); }
    for (const [a, b] of [[X - 10, cxm - 24], [cxm + 24, X + W + 10]] as const) { px(c, a, gy + 7, b - a, 2, "#3a2010"); px(c, a, gy + 7, b - a, 1, "#d8d0c0"); }
    px(c, cxm + 28, gy - 2, 2, 10, "#3a2010"); px(c, cxm + 25, gy - 8, 8, 6, "#3a2010"); px(c, cxm + 26, gy - 7, 6, 4, "#3c78c8"); px(c, cxm + 32, gy - 10, 1, 4, "#d03050");
  }
  if (s.kind === "hut") {
    // A hermit lives here: stacked firewood, a hanging lantern and drying herbs under the eave.
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) { disc(c, wr + 8 + j * 8 + k * 4, gy - 6 - k * 7, 4, "#3a2010"); disc(c, wr + 8 + j * 8 + k * 4, gy - 6 - k * 7, 3, "#b07c48"); px(c, wr + 7 + j * 8 + k * 4, gy - 7 - k * 7, 2, 2, "#e0b07a"); }
    px(c, wl - 8, eave, 2, 22, "#3a2010"); px(c, wl - 12, eave + 20, 10, 10, "#2a1a12"); px(c, wl - 11, eave + 21, 8, 8, "#ffc850"); px(c, wl - 9, eave + 23, 4, 4, "#fff4b0");
    for (let k = 0; k < 4; k++) { const hx = wl + 8 + k * 10; px(c, hx, eave + 2, 1, 6, "#3a2010"); disc(c, hx, eave + 10, 3, k % 2 ? p.leaf[2] : p.flower[0]); }
  }
  if (s.kind === "cabin") {
    for (let x = X - 8; x < X + W + 8; x += 10) { if (Math.abs(x + 2 - cxm) < 22) continue; px(c, x, gy + 2, 4, 10, "#3a2010"); px(c, x + 1, gy + 2, 2, 9, "#8a5a30"); disc(c, x + 7, gy + 10, 2, p.flower[(x / 10) & 1]!); px(c, x + 7, gy + 10, 1, 1, "#ffffff"); }
    for (const [a, b] of [[X - 8, cxm - 22], [cxm + 22, X + W + 8]] as const) px(c, a, gy + 5, b - a, 2, "#6b4423");
  }
}

// ---------- The Lost Woods gate ----------
/** Two ancient trees grown into an archway, moss curtains and mist: the walk-in entrance to the Lost Woods. */
export function hdWoodsGate(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const [out, dark, mid, light] = p.leaf, W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2, gy = Y + Hh;
  const t = tones(p);
  // dark forest beyond the arch
  for (let k = 0; k < 6; k++) px(c, cxm - 22 + k * 2, Y + 8 + k * 6, 44 - k * 4, Hh - 30 - k * 6, `rgba(6,20,14,${0.18 + k * 0.08})`);
  // two giant gnarled trunks
  for (const side of [-1, 1]) {
    const tx = Math.round(cxm + side * 30);
    px(c, tx - 11, Y + 20, 22, Hh - 20, out); px(c, tx - 10, Y + 20, 20, Hh - 21, p.trunk);
    px(c, tx - 10, Y + 20, 5, Hh - 21, t.trunkHi); px(c, tx + 5, Y + 20, 5, Hh - 21, t.trunkLo);
    for (let y = Y + 28; y < gy - 6; y += 9) { px(c, tx - 3, y, 1, 5, t.trunkLo); px(c, tx + 2, y + 4, 1, 4, t.trunkLo); }
    disc(c, tx - side * 2, Y + 48, 3, t.trunkLo); disc(c, tx - side * 2, Y + 48, 2, "#1a0e08");
    for (const r of [-16, -8, 10, 16]) { px(c, tx + r - 3, gy - 6, 7, 6, out); px(c, tx + r - 2, gy - 6, 5, 5, p.trunk); }
    px(c, tx - 10, Y + 34, 4, 12, mid); px(c, tx + 6, Y + 60, 4, 10, mid);
  }
  // the leafy arch joining both crowns
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (k / 10), ax = Math.round(cxm - Math.cos(a) * 36), ay = Math.round(Y + 26 - Math.sin(a) * 18);
    disc(c, ax, ay, 13, out);
  }
  for (let k = 0; k <= 10; k++) { const a = Math.PI * (k / 10), ax = Math.round(cxm - Math.cos(a) * 36), ay = Math.round(Y + 26 - Math.sin(a) * 18); disc(c, ax, ay, 12, dark); disc(c, ax - 1, ay - 2, 9, mid); if (k % 2 === 0) disc(c, ax - 3, ay - 5, 4, light); }
  for (let k = 0; k < 20; k++) { const a = cxm - 44 + Math.floor(H(k + 821, s.x, s.y) * 88), b = Y + Math.floor(H(k + 831, s.x, s.y) * 30); px(c, a, b, 3, 1, t.leafTex); px(c, a - 1, b - 1, 1, 1, t.leafTex); }
  // hanging moss curtains
  for (let x = Math.round(cxm - 20); x <= cxm + 20; x += 4) { const len = 8 + Math.floor(H(841, x, s.y) * 12); px(c, x, Y + 34, 1, len, mid); px(c, x + 1, Y + 34, 1, len - 3, dark); px(c, x, Y + 34 + len, 1, 2, light); }
  // old wooden sign on the left
  const sx = Math.round(cxm - 58), sy = gy - 34;
  px(c, sx + 9, sy + 8, 3, 26, "#3a2010"); px(c, sx + 10, sy + 8, 1, 26, "#8a5a30");
  px(c, sx - 1, sy - 1, 22, 13, "#2a1a12"); px(c, sx, sy, 20, 11, "#9a6434"); px(c, sx, sy, 20, 1, "#c08a50");
  for (const [a, b] of [[4, 3], [8, 2], [12, 3], [16, 4]] as const) px(c, sx + a, sy + b, 2, 6 - b + 2, p.leaf[0]);
  // fireflies and mist rolling out of the woods
  for (let k = 0; k < 7; k++) { const a = cxm - 40 + Math.floor(H(k + 851, s.x, s.y) * 80), b = Y + 30 + Math.floor(H(k + 861, s.x, s.y) * (Hh - 40)); disc(c, a, b, 2, "rgba(255,240,140,0.3)"); px(c, a, b, 1, 1, "#fff6a0"); }
  for (let k = 0; k < 9; k++) { const a = X + 10 + Math.floor(H(k + 871, s.x, s.y) * (W - 20)), b = Y + 20 + Math.floor(H(k + 881, s.x, s.y) * (Hh - 24)); oval(c, a, b, 18 + (k % 3) * 6, 5 + (k % 2) * 3, "rgba(225,236,240,0.2)"); }
}

// ---------- Big mountains: plateaus, cliffs and ladders ----------
const highCache = new WeakMap<Pal, C3>();
const highBase = (p: Pal): C3 => {
  let b = highCache.get(p);
  if (!b) { b = [mix(p.ground[0], p.rock[2], 0.22), mix(p.ground[1], p.rock[1], 0.25), mix(p.ground[2], p.rock[3], 0.2)]; highCache.set(p, b); }
  return b;
};
/** Raised meadow on top of a mountain; a bright lip where the cliff drops away below. */
/** How high the ground stands: valley 0, first plateau 1, the terrace above 2, the summit terrace 3. */
const level = (v: number) => (v === T.HIGH ? 1 : v === T.UPPER ? 2 : v === T.SUMMIT ? 3 : 0);
const tierCache = new WeakMap<Pal, C3[]>();
/** Each terrace up is a little lighter and rockier, so the stacked levels read at a glance. */
const tierBase = (p: Pal, lv: number): C3 => {
  let t = tierCache.get(p);
  if (!t) { const b = highBase(p); t = [b, b.map((x) => mix(x, "#fff4d8", 0.1)) as unknown as C3, b.map((x) => mix(x, "#fff4d8", 0.2)) as unknown as C3]; tierCache.set(p, t); }
  return t[Math.max(0, Math.min(2, lv - 1))]!;
};
export function hdHighland(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const own = cell(tx, ty);
  hdGrass(c, X, Y, p, tx, ty, isHighGround(own) ? tierBase(p, level(own)) : highBase(p));
  const edge = (v: number) => v === T.CLIFF || v === T.LADDER;
  if (edge(cell(tx, ty + 1))) { px(c, X, Y + HD - 4, HD, 2, mix(p.ground[2], "#ffffff", 0.25)); px(c, X, Y + HD - 2, HD, 2, p.rock[0]); }
  if (edge(cell(tx - 1, ty))) px(c, X, Y, 2, HD, "rgba(0,0,0,0.18)");
  if (edge(cell(tx + 1, ty))) px(c, X + HD - 2, Y, 2, HD, "rgba(0,0,0,0.18)");
  if (edge(cell(tx, ty - 1))) px(c, X, Y, HD, 3, "rgba(0,0,0,0.2)");
}
/** Cliff face of a big mountain: rock strata, cracks, a grassy rim on top and rubble at the foot. */
export function hdCliff(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const [out, dark, mid, light] = p.rock;
  // The ground right above and below this cliff (past the other cliff rows): a cliff whose lower side is the higher
  // ground is the top lip of a terrace seen from the north; otherwise it is the rock face dropping to the south.
  const ground = (dir: 1 | -1) => { for (let k = 1; k <= 2; k++) { const v = cell(tx, ty + dir * k); if (v !== T.CLIFF && v !== T.LADDER) return level(v); } return -1; };
  const below = ground(1), above = ground(-1);
  const rim = below > 0 && below > above;
  if (rim) {
    hdGrass(c, X, Y, p, tx, ty, tierBase(p, below));
    px(c, X, Y, HD, 12, mid); px(c, X, Y + 12, HD, 2, dark);
    for (let x = 0; x < HD; x += 8) px(c, X + x, Y + 2 + ((x / 8) % 2) * 3, 8, 2, light);
    if (cell(tx, ty - 1) !== T.CLIFF) px(c, X, Y, HD, 2, out);
    return;
  }
  px(c, X, Y, HD, HD, mid);
  for (let y = 3; y < HD; y += 7) { px(c, X, Y + y, HD, 1, dark); px(c, X, Y + y + 1, HD, 1, mix(mid, light, 0.5)); }
  for (let k = 0; k < 3; k++) { const a = X + Math.floor(H(k + 901, tx, ty) * 28), b = Y + Math.floor(H(k + 911, tx, ty) * 22); px(c, a, b, 1, 6, out); px(c, a + 1, b + 5, 1, 4, dark); }
  const lvL = level(cell(tx - 1, ty)), lvR = level(cell(tx + 1, ty));
  const side = lvL > lvR ? 1 : lvR > lvL ? -1 : 0;
  if (side) px(c, side > 0 ? X : X + HD - 6, Y, 6, HD, side > 0 ? light : dark);
  const up = cell(tx, ty - 1);
  if (isHighGround(up)) { px(c, X, Y, HD, 4, tierBase(p, level(up))[2]); for (let x = 0; x < HD; x += 3 + Math.floor(H(661 + x, tx, ty) * 4)) px(c, X + x, Y + 4, 2 + Math.floor(H(671 + x, tx, ty) * 2), 2 + (x % 8 ? 1 : 0), p.leaf[2]); }
  const down = cell(tx, ty + 1);
  if (down !== T.CLIFF && down !== T.LADDER && down !== T.BUILDING) { px(c, X, Y + HD - 4, HD, 4, out); for (const a of [4, 15, 25]) { disc(c, X + a, Y + HD - 3, 2, dark); px(c, X + a - 1, Y + HD - 5, 2, 1, light); } }
}
/** The castle town's stone wall (two tiles thick): a walkway with battlements on top, a brick face in front,
 *  round turrets at the corners and torch-lit pillars beside every gate. */
export function hdTownWall(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const stone: C3 = [p.rock[1], mix(p.rock[2], p.wall[0], 0.35), mix(p.rock[3], "#ffffff", 0.15)];
  const wall = (x: number, y: number) => cell(x, y) === T.WALL;
  const up = wall(tx, ty - 1), down = wall(tx, ty + 1), left = wall(tx - 1, ty), right = wall(tx + 1, ty);
  hdGrass(c, X, Y, p, tx, ty);
  if (!down) {
    // Front face: big stone blocks, a dark foot and a cast shadow.
    px(c, X, Y, HD, HD - 2, stone[1]);
    for (let y = 0; y < HD - 4; y += 8) for (let x = (y / 8) % 2 ? -6 : 0; x < HD; x += 12) {
      px(c, X + Math.max(0, x), Y + y, 1, 8, stone[0]);
      if (H(31 + x, tx, ty + y) < 0.35) px(c, X + Math.max(0, x) + 2, Y + y + 2, 6, 2, stone[2]);
    }
    for (let y = 0; y < HD - 4; y += 8) px(c, X, Y + y, HD, 1, stone[0]);
    px(c, X, Y + HD - 4, HD, 2, "#1a1418"); px(c, X, Y + HD - 2, HD, 2, "rgba(0,0,0,0.28)");
    if (!up) px(c, X, Y, HD, 3, stone[2]);
    if (!left) { px(c, X, Y, 3, HD - 2, "#1a1418"); px(c, X + 3, Y, 3, HD - 4, stone[2]); }
    if (!right) { px(c, X + HD - 3, Y, 3, HD - 2, "#1a1418"); px(c, X + HD - 6, Y, 3, HD - 4, stone[0]); }
    // A torch on the pillar beside a gate.
    if (!left || !right) {
      const tx0 = !left ? X + 9 : X + HD - 13;
      px(c, tx0, Y + 10, 4, 8, "#3a2010"); disc(c, tx0 + 2, Y + 8, 3, "#ffb030"); px(c, tx0 + 1, Y + 6, 2, 2, "#fff0a0");
    }
    return;
  }
  // Walkway on top: flagstones, battlements along every outer edge.
  px(c, X, Y, HD, HD, stone[2]);
  for (let y = 0; y < HD; y += 10) { px(c, X, Y + y, HD, 1, mix(stone[1], stone[2], 0.5)); for (let x = (y / 10) % 2 ? 5 : 0; x < HD; x += 11) px(c, X + x, Y + y, 1, 10, mix(stone[1], stone[2], 0.5)); }
  const merlons = (x: number, y: number, w: number, h: number) => { px(c, x, y, w, h, "#1a1418"); px(c, x + 1, y + 1, w - 2, h - 2, stone[1]); px(c, x + 1, y + 1, w - 2, 2, mix(stone[2], "#ffffff", 0.25)); };
  if (!up) for (let x = 0; x < HD; x += 11) merlons(X + x, Y, 8, 8);
  if (!left) for (let y = 0; y < HD; y += 11) merlons(X, Y + y, 8, 8);
  if (!right) for (let y = 0; y < HD; y += 11) merlons(X + HD - 8, Y + y, 8, 8);
  // Corner turret: a round stone top with a red cone roof.
  if (!up && (!left || !right)) {
    const cx = !left ? X + 12 : X + HD - 12;
    disc(c, cx, Y + 14, 14, "#1a1418"); disc(c, cx, Y + 14, 12, stone[1]); disc(c, cx, Y + 14, 9, p.roofs[0] ?? "#c03030");
    disc(c, cx - 2, Y + 11, 4, mix(p.roofs[0] ?? "#c03030", "#ffffff", 0.3)); px(c, cx - 1, Y - 4, 2, 10, "#3a2010"); px(c, cx + 1, Y - 4, 7, 4, p.roofs[1] ?? "#ffd040");
  }
}
/** Wooden ladder fixed to the cliff. */
export function hdLadder(c: Ctx, X: number, Y: number, p: Pal, tx: number, ty: number, cell: Cell) {
  hdCliff(c, X, Y, p, tx, ty, cell);
  px(c, X + 7, Y, 4, HD, "#3a2010"); px(c, X + 21, Y, 4, HD, "#3a2010");
  px(c, X + 8, Y, 2, HD, "#b07c48"); px(c, X + 22, Y, 2, HD, "#b07c48");
  for (let y = 3; y < HD; y += 8) { px(c, X + 9, y + Y, 14, 3, "#3a2010"); px(c, X + 9, y + Y, 14, 1, "#d09a5a"); }
}

// ---------- Castle, towers, shrines and caves ----------
function battlements(c: Ctx, x: number, y: number, w: number, stone: C3) {
  for (let k = 0; k < w; k += 10) { const mw = Math.min(7, w - k), sw = Math.min(5, mw - 2); if (sw < 2) continue; px(c, x + k, y - 6, mw, 8, "#1a1418"); px(c, x + k + 1, y - 5, sw, 6, stone[2]); }
  px(c, x, y, w, 4, "#1a1418"); px(c, x + 1, y + 1, w - 2, 2, stone[1]);
}
function stoneWall(c: Ctx, x: number, y: number, w: number, h: number, stone: C3, k: number) {
  px(c, x - 1, y - 1, w + 2, h + 2, "#1a1418"); px(c, x, y, w, h, stone[1]);
  for (let yy = 0; yy < h; yy += 8) for (let xx = (yy / 8) % 2 ? 0 : 7; xx < w; xx += 14) {
    const bw = Math.min(13, w - xx); if (bw < 3) continue;
    px(c, x + xx, y + yy, bw, 1, stone[0]); px(c, x + xx, y + yy, 1, 8, stone[0]);
    if (H(k, xx, yy) < 0.3) px(c, x + xx + 2, y + yy + 2, Math.min(6, bw - 4), 2, stone[2]);
  }
}
function roofCone(c: Ctx, cx: number, base: number, half: number, h: number, col: string) {
  for (let y = 0; y < h; y++) { const w = Math.round((half * (y + 1)) / h); px(c, cx - w - 1, base - h + y, w * 2 + 3, 1, "#1a1418"); px(c, cx - w, base - h + y, w, 1, mix(col, "#ffffff", 0.2)); px(c, cx, base - h + y, w + 1, 1, mix(col, "#000000", 0.25)); }
}
function flag(c: Ctx, x: number, y: number, col: string) { px(c, x, y, 2, 16, "#3a2010"); px(c, x + 2, y, 12, 7, col); px(c, x + 2, y + 6, 8, 2, mix(col, "#000000", 0.3)); }
function tower(c: Ctx, x: number, y: number, w: number, h: number, stone: C3, roof: string, k: number) {
  stoneWall(c, x, y, w, h, stone, k);
  px(c, x, y, 4, h, mix(stone[2], "#ffffff", 0.2)); px(c, x + w - 6, y, 6, h, stone[0]);
  battlements(c, x - 3, y, w + 6, stone);
  roofCone(c, x + w / 2, y - 6, w / 2 + 3, 36, roof); flag(c, x + w / 2, y - 56, roof);
  for (const wy of [y + 20, y + 60]) if (wy < y + h - 20) { px(c, x + w / 2 - 4, wy, 8, 14, "#1a1418"); px(c, x + w / 2 - 3, wy + 1, 6, 6, "#ffd870"); }
}
/** The massive castle in the middle of every world: corner towers, a tall keep, banners and a great gate. */
export function hdCastle(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2;
  const stone: C3 = [p.rock[1], mix(p.rock[2], p.wall[0], 0.35), mix(p.rock[3], "#ffffff", 0.15)];
  const roof = p.roofs[0]!, roof2 = p.roofs[1] ?? roof;
  oval(c, cxm, Y + Hh - 2, W / 2, 8, "rgba(0,0,0,0.3)");
  stoneWall(c, X + 40, Y + 70, W - 80, 220, stone, 1); battlements(c, X + 40, Y + 70, W - 80, stone);
  // keep
  stoneWall(c, cxm - 110, Y + 30, 220, 250, stone, 2);
  for (let y = 0; y < 70; y++) { const w = Math.round(120 * (y + 1) / 70); px(c, cxm - w - 1, Y - 40 + y, w * 2 + 3, 1, "#1a1418"); px(c, cxm - w, Y - 40 + y, w, 1, mix(roof, "#ffffff", 0.2)); px(c, cxm, Y - 40 + y, w, 1, mix(roof, "#000", 0.2)); }
  flag(c, cxm, Y - 58, roof2);
  disc(c, cxm, Y + 80, 20, "#1a1418"); disc(c, cxm, Y + 80, 17, "#3c78c8"); disc(c, cxm, Y + 80, 9, "#ffd870"); px(c, cxm - 1, Y + 63, 2, 34, "#1a1418"); px(c, cxm - 17, Y + 79, 34, 2, "#1a1418");
  for (const wx of [cxm - 80, cxm - 50, cxm + 38, cxm + 68]) for (const wy of [Y + 120, Y + 180]) { px(c, wx, wy, 12, 22, "#1a1418"); px(c, wx + 2, wy + 2, 8, 9, "#ffd870"); }
  tower(c, X + 16, Y + 40, 70, 230, stone, roof2, 3); tower(c, X + W - 86, Y + 40, 70, 230, stone, roof2, 4);
  // front wall, front towers, gatehouse
  stoneWall(c, X + 60, Y + 250, W - 120, Hh - 250, stone, 5); battlements(c, X + 60, Y + 250, W - 120, stone);
  tower(c, X, Y + 170, 84, Hh - 170, stone, roof, 6); tower(c, X + W - 84, Y + 170, 84, Hh - 170, stone, roof, 7);
  stoneWall(c, cxm - 70, Y + 210, 140, Hh - 210, stone, 8); battlements(c, cxm - 70, Y + 210, 140, stone);
  arched(c, cxm - 34, Y + Hh - 104, 68, 104, "#1a1418"); arched(c, cxm - 30, Y + Hh - 100, 60, 100, "#0c0a10");
  for (let x = cxm - 26; x < cxm + 28; x += 9) px(c, x, Y + Hh - 96, 2, 30, "#8a8a94");
  px(c, cxm - 28, Y + Hh - 70, 56, 2, "#8a8a94");
  for (const bx of [cxm - 60, cxm + 44]) { px(c, bx, Y + Hh - 150, 16, 60, roof); px(c, bx, Y + Hh - 150, 16, 3, "#ffd040"); disc(c, bx + 8, Y + Hh - 120, 4, "#ffd040"); }
  for (const tx of [cxm - 46, cxm + 42]) { px(c, tx, Y + Hh - 40, 4, 10, "#3a2010"); disc(c, tx + 2, Y + Hh - 44, 3, "#ffb030"); }
  if (p.waterKind === "water") for (let k = 0; k < 8; k++) {
    const a = X + 70 + Math.floor(H(k + 951, s.x, s.y) * (W - 140)), len = 30 + (k % 3) * 10;
    px(c, a, Y + 260, 3, len, p.leaf[2]);
    for (let j = 6; j < len - 2; j += 9) { disc(c, a + 1, Y + 260 + j, 3, p.leaf[1]); disc(c, a + 2, Y + 260 + j - 2, 2, p.leaf[3]); }
  }
}
/** Lookout tower on a mountain top. */
export function hdTower(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD;
  const stone: C3 = [p.rock[1], p.rock[2], p.rock[3]];
  oval(c, X + W / 2, Y + Hh - 2, W / 2 - 8, 5, "rgba(0,0,0,0.3)");
  tower(c, X + 18, Y - 4, W - 36, Hh + 4, stone, p.roofs[2] ?? p.roofs[0]!, s.x);
  arched(c, X + W / 2 - 10, Y + Hh - 28, 20, 28, "#0c0a10");
}
/** Small mountain shrine: steps, two pillars, a stone roof and a glowing orb. */
export function hdShrine(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2;
  const [, , mid, light] = p.rock;
  for (let k = 0; k < 3; k++) { px(c, X + 4 + k * 4, Y + Hh - 8 - k * 6, W - 8 - k * 8, 6, "#1a1418"); px(c, X + 5 + k * 4, Y + Hh - 7 - k * 6, W - 10 - k * 8, 4, k % 2 ? mid : light); }
  for (const x of [X + 14, X + W - 26]) { px(c, x, Y + 20, 12, Hh - 40, "#1a1418"); px(c, x + 1, Y + 21, 10, Hh - 42, light); px(c, x + 7, Y + 21, 4, Hh - 42, mid); }
  for (let y = 0; y < 24; y++) { const w = Math.round(((W / 2 + 4) * (y + 1)) / 24); px(c, cxm - w, Y - 6 + y, w * 2, 1, y % 5 ? mid : "#1a1418"); }
  px(c, cxm - 14, Y + 30, 28, Hh - 52, "#0c0a10");
  disc(c, cxm, Y + 46, 7, mix(p.accent, "#ffffff", 0.3)); disc(c, cxm, Y + 46, 4, "#ffffff");
}
/** Cave mouth in the mountain cliff with wooden beams and a lantern. */
export function hdCave(c: Ctx, s: Structure, X: number, Y: number, p: Pal, cell: Cell) {
  for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) hdCliff(c, X + tx * HD, Y + ty * HD, p, s.x + tx, s.y + ty, (x, y) => (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h ? T.CLIFF : cell(x, y)));
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2;
  arched(c, cxm - 22, Y + Hh - 46, 44, 46, "#1a1418"); arched(c, cxm - 19, Y + Hh - 43, 38, 43, "#050407");
  px(c, cxm - 24, Y + Hh - 46, 5, 46, "#6b4423"); px(c, cxm + 19, Y + Hh - 46, 5, 46, "#6b4423"); px(c, cxm - 26, Y + Hh - 48, 52, 5, "#8a5a30");
  px(c, cxm + 28, Y + Hh - 30, 2, 10, "#3a2010"); disc(c, cxm + 29, Y + Hh - 33, 3, "#ffb030");
}

// ---------- Landmarks of the open countryside ----------
/** Old crypt: stone steps, two columns, a pediment with a dice emblem and a dark arched door. */
export function hdCrypt(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2, gy = Y + Hh;
  const stone: C3 = [p.rock[1], p.rock[2], p.rock[3]];
  oval(c, cxm, gy - 2, W / 2 + 2, 6, "rgba(0,0,0,0.3)");
  stoneWall(c, X + 8, Y + 26, W - 16, Hh - 34, stone, s.x + s.y);
  // pediment roof
  for (let y = 0; y < 30; y++) { const w = Math.round(((W / 2 + 2) * (y + 1)) / 30); px(c, cxm - w - 1, Y - 4 + y, w * 2 + 2, 1, "#1a1418"); px(c, cxm - w + 1, Y - 4 + y, w * 2 - 2, 1, y % 6 === 5 ? stone[0] : y < 4 ? stone[2] : stone[1]); }
  px(c, X + 2, Y + 24, W - 4, 6, "#1a1418"); px(c, X + 3, Y + 25, W - 6, 4, stone[2]);
  // the dice emblem in the gable
  px(c, cxm - 7, Y + 6, 14, 14, "#1a1418"); px(c, cxm - 6, Y + 7, 12, 12, mix(stone[2], "#ffffff", 0.25));
  for (const [dx, dy] of [[-3, -3], [3, 3], [0, 0]] as const) px(c, cxm - 1 + dx, Y + 12 + dy, 2, 2, "#1a1418");
  // columns
  for (const x of [X + 12, X + W - 24]) { px(c, x - 1, Y + 30, 14, Hh - 44, "#1a1418"); px(c, x, Y + 30, 12, Hh - 44, stone[2]); px(c, x + 8, Y + 30, 4, Hh - 44, stone[1]); px(c, x - 2, Y + 30, 16, 4, stone[2]); px(c, x - 2, gy - 18, 16, 4, stone[0]); }
  // door
  arched(c, cxm - 17, gy - 52, 34, 46, "#1a1418"); arched(c, cxm - 14, gy - 49, 28, 43, "#050407");
  px(c, cxm - 1, gy - 40, 2, 2, p.accent);
  // steps
  for (let k = 0; k < 2; k++) { px(c, X + 14 - k * 4, gy - 8 + k * 4, W - 28 + k * 8, 4, "#1a1418"); px(c, X + 15 - k * 4, gy - 8 + k * 4, W - 30 + k * 8, 3, k ? stone[1] : stone[2]); }
  // moss and cracks
  for (let k = 0; k < 6; k++) { const mx = X + 10 + Math.floor(H(k + 1201, s.x, s.y) * (W - 24)), my = Y + 30 + Math.floor(H(k + 1211, s.x, s.y) * (Hh - 50)); px(c, mx, my, 5, 2, p.leaf[2]); px(c, mx + 1, my - 1, 2, 1, p.leaf[3]); }
  vine(c, X + 10, gy - 12, 34, p, s.v * 5 + 3);
}
/** A traveller's camp: a canvas tent, a crackling campfire with a stone ring and a log to sit on. */
export function hdCamp(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, gy = Y + Hh;
  const cloth = p.roofs[s.v % p.roofs.length]!, hi = mix(cloth, "#ffffff", 0.25), lo = mix(cloth, "#000000", 0.3);
  oval(c, X + 34, gy - 4, 32, 5, "rgba(0,0,0,0.28)");
  const ax = X + 34, top = Y - 10, base = gy - 6, half = 30;
  for (let y = top; y <= base; y++) {
    const w = Math.round((half * (y - top)) / (base - top));
    px(c, ax - w - 1, y, w * 2 + 3, 1, "#1a1418"); px(c, ax - w, y, w, 1, hi); px(c, ax, y, w + 1, 1, lo);
  }
  for (let y = top + 20; y <= base; y++) { const w = Math.round((10 * (y - top - 20)) / (base - top - 20)); px(c, ax - w, y, w * 2 + 1, 1, "#1a0e08"); }
  px(c, ax - 1, top - 8, 2, 10, "#3a2010"); px(c, ax + 1, top - 8, 8, 5, p.accent);
  for (const [sx, ex] of [[ax - half - 6, ax - half], [ax + half, ax + half + 6]] as const) { px(c, sx, base - 2, ex - sx, 1, "#d8c8a0"); px(c, sx, base - 2, 2, 4, "#3a2010"); }
  // campfire
  const fx = X + W - 24, fy = gy - 18;
  disc(c, fx, fy + 4, 14, "rgba(255,180,60,0.16)");
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; disc(c, fx + Math.round(Math.cos(a) * 10), fy + 4 + Math.round(Math.sin(a) * 5), 3, k % 2 ? p.rock[1] : p.rock[2]); }
  px(c, fx - 8, fy + 2, 16, 4, "#3a2010"); px(c, fx - 4, fy - 1, 8, 8, "#5e3a1c");
  disc(c, fx, fy - 2, 6, "#f06018"); disc(c, fx, fy - 4, 4, "#ffb030"); disc(c, fx, fy - 6, 2, "#fff4b0"); px(c, fx - 1, fy - 13, 2, 5, "#ffb030");
  // a log to sit on
  px(c, X + 66, gy - 4, 26, 8, "#2a1a12"); px(c, X + 67, gy - 3, 24, 6, "#8a5a30"); px(c, X + 67, gy - 3, 24, 1, "#b07c48"); disc(c, X + 91, gy, 3, "#e0b07a");
}
/** Old stone well with a little wooden roof, a crank and a bucket. */
export function hdWell(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2, gy = Y + Hh;
  const stone: C3 = [p.rock[1], p.rock[2], p.rock[3]];
  oval(c, cxm, gy - 4, 28, 6, "rgba(0,0,0,0.3)");
  stoneWall(c, cxm - 24, Y + 30, 48, gy - Y - 36, stone, s.x * 3 + s.y);
  oval(c, cxm, Y + 30, 25, 9, "#1a1418"); oval(c, cxm, Y + 30, 23, 7, stone[2]); oval(c, cxm, Y + 31, 17, 5, p.water[0]); px(c, cxm - 6, Y + 30, 6, 1, p.water[2]);
  for (const x of [cxm - 24, cxm + 20]) { px(c, x, Y - 6, 5, 38, "#2a1a12"); px(c, x + 1, Y - 6, 3, 38, "#8a5a30"); }
  for (let y = 0; y < 16; y++) { const w = Math.round((32 * (y + 1)) / 16); px(c, cxm - w - 1, Y - 22 + y, w * 2 + 2, 1, "#2a1a12"); px(c, cxm - w, Y - 22 + y, w * 2, 1, y % 4 === 3 ? mix(p.roofs[0]!, "#000000", 0.3) : p.roofs[0]!); }
  px(c, cxm - 22, Y + 2, 44, 3, "#3a2010"); px(c, cxm - 1, Y + 5, 1, 14, "#d8c8a0");
  px(c, cxm - 5, Y + 18, 10, 8, "#2a1a12"); px(c, cxm - 4, Y + 19, 8, 6, "#a06c3a"); px(c, cxm - 4, Y + 21, 8, 1, "#5e3a1c");
  px(c, cxm + 24, Y + 2, 6, 2, "#3a2010"); px(c, cxm + 28, Y + 2, 2, 7, "#3a2010");
}
/** Moss-covered statue of an old hero raising a sword, on a carved plinth. */
export function hdStatue(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, cxm = X + W / 2, gy = Y + Hh;
  const [o, d, m, l] = [p.rock[0], p.rock[1], p.rock[2], p.rock[3]];
  oval(c, cxm, gy - 4, 28, 6, "rgba(0,0,0,0.3)");
  // plinth
  px(c, cxm - 26, gy - 26, 52, 22, "#1a1418"); px(c, cxm - 25, gy - 25, 50, 20, m); px(c, cxm - 25, gy - 25, 50, 3, l); px(c, cxm - 25, gy - 8, 50, 3, d);
  px(c, cxm - 14, gy - 19, 28, 8, d); px(c, cxm - 12, gy - 17, 24, 4, mix(p.accent, m, 0.5));
  // figure: legs, tunic, arms, head with pointy cap, raised sword
  const fy = gy - 26;
  px(c, cxm - 9, fy - 14, 7, 14, o); px(c, cxm + 2, fy - 14, 7, 14, o); px(c, cxm - 8, fy - 14, 5, 13, m); px(c, cxm + 3, fy - 14, 5, 13, d);
  px(c, cxm - 12, fy - 36, 24, 24, o); px(c, cxm - 11, fy - 35, 22, 22, m); px(c, cxm + 3, fy - 35, 8, 22, d); px(c, cxm - 11, fy - 35, 4, 22, l);
  px(c, cxm - 18, fy - 34, 7, 14, o); px(c, cxm - 17, fy - 33, 5, 12, m);
  px(c, cxm + 11, fy - 46, 7, 16, o); px(c, cxm + 12, fy - 45, 5, 14, d);
  px(c, cxm - 8, fy - 52, 16, 16, o); px(c, cxm - 7, fy - 51, 14, 14, l); px(c, cxm + 1, fy - 51, 6, 14, m);
  for (let y = 0; y < 12; y++) { const w = Math.max(1, 8 - Math.floor(y * 0.6)); px(c, cxm - 7 + y, fy - 60 + y - 2, w, 1, d); }
  px(c, cxm + 13, fy - 82, 4, 36, o); px(c, cxm + 14, fy - 81, 2, 34, l); px(c, cxm + 8, fy - 48, 14, 4, o);
  // moss
  for (let k = 0; k < 7; k++) { const mx = cxm - 24 + Math.floor(H(k + 1301, s.x, s.y) * 46), my = gy - 26 + Math.floor(H(k + 1311, s.x, s.y) * 18); px(c, mx, my, 4, 2, p.leaf[2]); }
  px(c, cxm - 11, fy - 36, 8, 3, p.leaf[2]); px(c, cxm - 7, fy - 52, 6, 2, p.leaf[3]);
}
/** Standing stones: three old menhirs with glowing runes. */
export function hdStones(c: Ctx, s: Structure, X: number, Y: number, p: Pal) {
  const W = s.w * HD, Hh = s.h * HD, gy = Y + Hh;
  oval(c, X + W / 2, gy - 6, W / 2, 6, "rgba(0,0,0,0.25)");
  const glow = mix(p.accent, "#ffffff", 0.35);
  ([[X + 6, 46, 20], [X + 36, 70, 24], [X + 70, 52, 20]] as const).forEach(([x, h, w], k) => {
    const top = gy - 6 - h;
    px(c, x - 1, top + 4, w + 2, h - 2, "#1a1418"); px(c, x + 2, top, w - 4, 6, "#1a1418");
    px(c, x, top + 4, w, h - 4, p.rock[2]); px(c, x + 3, top + 1, w - 6, 4, p.rock[2]);
    px(c, x + w - 6, top + 4, 6, h - 4, p.rock[1]); px(c, x + 1, top + 5, 3, h - 10, p.rock[3]);
    for (let r = 0; r < 3; r++) { const ry = top + 12 + r * 12; if (ry > gy - 16) break; px(c, x + w / 2 - 3, ry, 6, 2, glow); px(c, x + w / 2 - 1, ry - 2, 2, 6, glow); }
    px(c, x - 2, gy - 8, w + 4, 3, p.leaf[2]); px(c, x + 2 + (k * 5) % (w - 4), gy - 10, 3, 3, p.leaf[3]);
  });
}
