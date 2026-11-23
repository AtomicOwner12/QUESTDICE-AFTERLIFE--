// Pixel-art painter for the generated Story-Modus maps (Minish-Cap-style 16×16 tiles).
// Everything is drawn with plain rectangles from per-world palettes; no image files are needed.
// Browser-only at call time (it draws on a canvas you pass in), but importing it is safe on the server.
import { T, hash, isHighGround, type Structure, type TileMap } from "./story-terrain";
import { HD, hdGrass, hdFlowers, hdPath, hdPlaza, hdSand, hdStoneGround, hdWater, hdBridge, hdRoundTree, hdPineTree, hdRock, hdMountain, hdCottage, hdWoodsGate, hdHighland, hdCliff, hdLadder, hdCastle, hdTower, hdShrine, hdCave, hdCrypt, hdCamp, hdWell, hdStatue, hdStones, hdHedge, hdSmithy, hdStall, hdFalls, hdTownWall } from "./story-tiles-hd";

export const ART = 16;
/** Map chunks are painted at this many canvas pixels per art pixel (32 per tile), so the detailed world art stays sharp. */
export const RES = HD / ART;
type C3 = readonly [string, string, string];
type C4 = readonly [string, string, string, string];
type TreeKind = "round" | "pine" | "cactus" | "dead" | "pipe" | "cloud" | "palm" | "willow";
type WaterKind = "water" | "lava" | "sky" | "void";
export type Pal = {
  ground: C3; path: C3; plaza: C3; sand: C3; leaf: C4; trunk: string; water: C3; rock: C4; flower: readonly [string, string];
  bridge: C3; tree: TreeKind; waterKind: WaterKind; roofs: readonly string[]; wall: readonly [string, string];
  floor: C3; dwall: C3; accent: string;
};
const WOOD: C3 = ["#8a5a30", "#5e3a1c", "#b07c48"];
export const PALETTES: readonly Pal[] = [
  { ground: ["#6cc04a", "#4f9a38", "#8fd866"], path: ["#e0c080", "#b8945a", "#f0d8a0"], plaza: ["#c8b898", "#9a8a70", "#e0d4b8"], sand: ["#e8d090", "#c8aa68", "#f8e8b0"], leaf: ["#1f3d1a", "#2f6a28", "#46913a", "#72c04e"], trunk: "#6b4423", water: ["#2860b8", "#3c84d8", "#a8e0ff"], rock: ["#3a3a44", "#6a6a78", "#8e8e9c", "#c0c0cc"], flower: ["#ffe066", "#ff7aa8"], bridge: WOOD, tree: "round", waterKind: "water", roofs: ["#d0483c", "#3c78c8", "#e0a030", "#8a4ab0"], wall: ["#f0e0c0", "#b89870"], floor: ["#5a6a58", "#465444", "#728470"], dwall: ["#2a3428", "#3c4a38", "#58684e"], accent: "#9fe070" },
  { ground: ["#e8c878", "#cfa95a", "#f6dc9a"], path: ["#c89860", "#a07440", "#ddb27a"], plaza: ["#d8b088", "#b08860", "#ecc8a0"], sand: ["#f0d488", "#d4b468", "#fae6a8"], leaf: ["#1e4a28", "#2e7a3a", "#46a050", "#7ad07a"], trunk: "#7a5030", water: ["#1f8ab0", "#36aed0", "#b8f0ff"], rock: ["#6a4020", "#b07040", "#cc8e58", "#e8b880"], flower: ["#ff8c40", "#ffd040"], bridge: WOOD, tree: "cactus", waterKind: "water", roofs: ["#e8d8b8", "#d09050", "#40a0b0", "#c86040"], wall: ["#ecd2a0", "#c09860"], floor: ["#a08050", "#806038", "#b89868"], dwall: ["#5a3c20", "#7a5430", "#a07848"], accent: "#ffd060" },
  { ground: ["#6e9048", "#557238", "#8aac5a"], path: ["#9a8058", "#76603e", "#b49a70"], plaza: ["#8a8a70", "#6a6a54", "#a4a48a"], sand: ["#a8a874", "#88885a", "#c0c08c"], leaf: ["#16301a", "#284a26", "#3c6a34", "#5e8e48"], trunk: "#4a3a24", water: ["#2e5a50", "#3e7868", "#88c0a8"], rock: ["#2a3428", "#4a5a44", "#64765a", "#8ea080"], flower: ["#c0a0ff", "#f0f080"], bridge: WOOD, tree: "willow", waterKind: "water", roofs: ["#6a8a40", "#8a6a40", "#507a70", "#a05a40"], wall: ["#c8b890", "#8a7a58"], floor: ["#4a5a48", "#3a4838", "#5e705a"], dwall: ["#1e2a20", "#2e3e30", "#465a44"], accent: "#9ad06a" },
  { ground: ["#e4eef8", "#c4d4e8", "#ffffff"], path: ["#a8bcd8", "#8aa0c0", "#c8d8ee"], plaza: ["#b8c8dc", "#94a6c0", "#d4e0f0"], sand: ["#d8e4f0", "#b8c8dc", "#f4f8ff"], leaf: ["#14303a", "#1e4a50", "#2e6a6a", "#e8f4ff"], trunk: "#5a4030", water: ["#5a9ad8", "#7ab8ec", "#d8f4ff"], rock: ["#3a4458", "#6a7a94", "#8a9ab4", "#c8d4e8"], flower: ["#a0d8ff", "#ffffff"], bridge: WOOD, tree: "pine", waterKind: "water", roofs: ["#3c6ab0", "#b04848", "#4a8a8a", "#6a5aa0"], wall: ["#f0e8d8", "#a89880"], floor: ["#7a98b8", "#5e7c9c", "#98b4d0"], dwall: ["#2a3a54", "#3e5274", "#5a7298"], accent: "#a8e8ff" },
  { ground: ["#6e6e84", "#56566a", "#88889e"], path: ["#b89858", "#8a7040", "#d4b878"], plaza: ["#7a7a90", "#5c5c70", "#9494a8"], sand: ["#80809a", "#64647c", "#9a9ab2"], leaf: ["#22222e", "#3a3a4c", "#55556c", "#8a8aa8"], trunk: "#3a3a4c", water: ["#4a2e80", "#6a44a8", "#b090e8"], rock: ["#202028", "#44444e", "#5e5e6a", "#9090a0"], flower: ["#ff60c0", "#60e0ff"], bridge: ["#8a8a9a", "#5a5a6a", "#b0b0c0"], tree: "pipe", waterKind: "water", roofs: ["#6a4ab0", "#b04a6a", "#4a8ab0", "#8a8a40"], wall: ["#c0c0d0", "#707084"], floor: ["#5a5a70", "#46465a", "#727288"], dwall: ["#1e1e2a", "#30303e", "#4a4a5c"], accent: "#c080ff" },
  { ground: ["#5e4c48", "#4a3a38", "#766260"], path: ["#8a6a52", "#684e3a", "#a4846a"], plaza: ["#6a5a58", "#504240", "#847270"], sand: ["#6e5a54", "#56443e", "#86706a"], leaf: ["#1a1214", "#2e2224", "#4a3a38", "#6a5654"], trunk: "#2e2224", water: ["#b82e10", "#f06018", "#ffd050"], rock: ["#141016", "#2e282e", "#463e46", "#6a5e68"], flower: ["#ff8030", "#ffd040"], bridge: ["#5a4a48", "#3a2e2e", "#7a6866"], tree: "dead", waterKind: "lava", roofs: ["#8a3020", "#504040", "#a06030", "#603030"], wall: ["#9a8a80", "#5e5048"], floor: ["#5a3a30", "#462a22", "#724a3c"], dwall: ["#1e1010", "#341c18", "#4e2a22"], accent: "#ff9040" },
  { ground: ["#f2f4ff", "#d4dcf4", "#ffffff"], path: ["#ecd48a", "#c8aa60", "#fae8b0"], plaza: ["#dcd8f0", "#b8b4d8", "#f0eeff"], sand: ["#e8eafc", "#ccd2f0", "#ffffff"], leaf: ["#8a82b8", "#b4acdc", "#dcd6fa", "#ffffff"], trunk: "#b8a0d8", water: ["#68aef0", "#86c4f8", "#e0f4ff"], rock: ["#6a5aa0", "#9a88d8", "#b8a8f0", "#e8e0ff"], flower: ["#ffb0e0", "#b0e8ff"], bridge: ["#f0c870", "#c89a48", "#ffe6a0"], tree: "cloud", waterKind: "sky", roofs: ["#f0a0c0", "#a0c0f0", "#f0d080", "#b0a0f0"], wall: ["#ffffff", "#b8b8d8"], floor: ["#b8c4e8", "#98a4cc", "#d4dcf8"], dwall: ["#5a6494", "#7680b4", "#98a2d4"], accent: "#fff0a0" },
  { ground: ["#7ccc5a", "#5aa840", "#9ee07a"], path: ["#eed8a0", "#ccb47a", "#fae8c0"], plaza: ["#e0d0b0", "#b8a888", "#f0e4cc"], sand: ["#f4e0a8", "#d8c084", "#fff0c8"], leaf: ["#1a4a20", "#2a7a30", "#40a040", "#80d060"], trunk: "#9a6a38", water: ["#1a6ab8", "#2e90d8", "#b0ecff"], rock: ["#4a4a50", "#7a7a84", "#9a9aa4", "#cacad4"], flower: ["#ff80a0", "#ffe070"], bridge: WOOD, tree: "palm", waterKind: "water", roofs: ["#2e8ac8", "#e8e8e8", "#d05040", "#40b0a0"], wall: ["#ffffff", "#b0b8c0"], floor: ["#3a7a8a", "#2a5e6c", "#4e94a4"], dwall: ["#123844", "#1e4e5c", "#2e6a7a"], accent: "#80f0ff" },
  { ground: ["#3c3254", "#2e2642", "#4e426a"], path: ["#6c5c84", "#524466", "#86769e"], plaza: ["#5a5070", "#443c56", "#72688a"], sand: ["#463c5e", "#362e4a", "#584c74"], leaf: ["#120c1c", "#24183a", "#3a2a58", "#5c4688"], trunk: "#24183a", water: ["#140c22", "#24163a", "#8a5ad0"], rock: ["#100c18", "#2a2238", "#3e344e", "#5e5274"], flower: ["#c070ff", "#70f0d0"], bridge: ["#4a3a5a", "#2e2240", "#64527a"], tree: "dead", waterKind: "void", roofs: ["#5a3a80", "#3a3a5a", "#803a5a", "#3a5a70"], wall: ["#8a80a0", "#4e4664"], floor: ["#3a2e4e", "#2a2038", "#4a3c62"], dwall: ["#0e0a16", "#1c1428", "#2e2240"], accent: "#b070ff" },
];

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
function disc(c: Ctx, cx: number, cy: number, r: number, color: string) {
  c.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
}
function blob(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
}
const H = (k: number, x: number, y: number) => hash(k, x, y);

type Cell = (x: number, y: number) => number;
function treeSprite(c: Ctx, ox: number, oy: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const [out, dark, mid, light] = p.leaf;
  const foot = cell(tx, ty + 1) !== T.TREE;
  const cx = ox + 8;
  if (foot) px(c, ox + 2, oy + 13, 12, 3, "rgba(0,0,0,0.22)");
  switch (p.tree) {
    case "pine": {
      if (foot) { px(c, cx - 1, oy + 12, 3, 4, p.trunk); }
      const layers: [number, number, number][] = [[oy - 5, 7, 4], [oy - 1, 8, 6], [oy + 3, 9, 8]];
      for (const [y0, h, hw] of layers) for (let r = 0; r < h; r++) {
        const w = Math.max(1, Math.round((hw * (r + 1)) / h));
        px(c, cx - w - 1, y0 + r, w * 2 + 3, 1, out); px(c, cx - w, y0 + r, w * 2 + 1, 1, r < 2 ? light : r % 3 ? mid : dark);
        px(c, cx + 1, y0 + r, w, 1, dark);
      }
      break;
    }
    case "cactus": {
      px(c, cx - 3, oy + 1, 6, 14, out); px(c, cx - 2, oy + 1, 4, 14, mid); px(c, cx - 2, oy + 1, 1, 14, light); px(c, cx + 1, oy + 1, 1, 14, dark);
      px(c, cx - 7, oy + 6, 5, 3, out); px(c, cx - 6, oy + 7, 4, 1, mid); px(c, cx - 7, oy + 2, 3, 5, out); px(c, cx - 6, oy + 3, 1, 4, mid);
      px(c, cx + 2, oy + 8, 5, 3, out); px(c, cx + 2, oy + 9, 4, 1, mid); px(c, cx + 4, oy + 4, 3, 5, out); px(c, cx + 5, oy + 5, 1, 4, mid);
      px(c, cx - 1, oy, 2, 1, p.flower[1]);
      break;
    }
    case "dead": {
      px(c, cx - 2, oy + 1, 4, 15, out); px(c, cx - 1, oy + 1, 2, 15, mid);
      for (const [x, y, w] of [[-6, 3, 5], [2, 5, 5], [-5, 8, 4], [2, 1, 4]] as const) { px(c, cx + x, oy + y, w, 2, out); px(c, cx + x + (x < 0 ? 1 : 0), oy + y, w - 1, 1, mid); }
      px(c, cx - 1, oy + 1, 1, 6, light);
      break;
    }
    case "pipe": {
      px(c, ox + 3, oy - 3, 10, 19, out); px(c, ox + 4, oy - 2, 8, 17, mid); px(c, ox + 4, oy - 2, 2, 17, light); px(c, ox + 10, oy - 2, 2, 17, dark);
      px(c, ox + 2, oy - 4, 12, 3, out); px(c, ox + 3, oy - 3, 10, 1, light);
      for (const y of [2, 8]) { px(c, ox + 4, oy + y, 8, 1, dark); px(c, ox + 6, oy + y + 1, 1, 1, p.flower[1]); }
      break;
    }
    case "cloud": {
      if (foot) px(c, cx - 1, oy + 11, 3, 5, p.trunk);
      for (const [x, y, r] of [[0, 4, 7], [-4, 7, 5], [4, 7, 5]] as const) disc(c, cx + x, oy + y, r + 1, out);
      for (const [x, y, r] of [[0, 4, 7], [-4, 7, 5], [4, 7, 5]] as const) disc(c, cx + x, oy + y, r, mid);
      disc(c, cx - 2, oy + 2, 3, light); disc(c, cx + 3, oy + 9, 2, dark);
      break;
    }
    case "palm": {
      for (let i = 0; i < 7; i++) { const x = cx - 2 + Math.round(i / 3), y = oy + 15 - i * 2; px(c, x - 1, y - 1, 4, 3, out); px(c, x, y - 1, 2, 2, i % 2 ? p.trunk : "#c08a50"); }
      const top = oy + 1, tcx = cx + 1;
      for (const [dx, dy] of [[-7, 2], [7, 2], [-5, -3], [5, -3], [0, -5]] as const) {
        for (let k = 0; k <= 6; k++) { const x = tcx + Math.round((dx * k) / 6), y = top + Math.round((dy * k) / 6) + (k > 3 ? 1 : 0); px(c, x - 1, y - 1, 3, 3, out); px(c, x, y, 2, 1, k < 3 ? light : mid); }
      }
      disc(c, tcx, top, 2, dark);
      break;
    }
    case "willow":
    case "round":
    default: {
      if (foot) { px(c, cx - 2, oy + 10, 4, 6, out); px(c, cx - 1, oy + 10, 2, 6, p.trunk); }
      disc(c, cx, oy + 5, 8, out); disc(c, cx, oy + 5, 7, dark); disc(c, cx - 1, oy + 4, 5, mid); disc(c, cx - 3, oy + 2, 2, light);
      for (let k = 0; k < 3; k++) px(c, cx - 4 + Math.floor(H(k + 121, tx, ty) * 9), oy + 2 + Math.floor(H(k + 131, tx, ty) * 7), 2, 1, dark);
      if (p.tree === "willow" && foot) for (let k = -5; k <= 5; k += 2) px(c, cx + k, oy + 11, 1, 3 + ((k + 7) % 3), mid);
    }
  }
}
export function bushSprite(c: Ctx, ox: number, oy: number, p: Pal) {
  const [out, dark, mid, light] = p.leaf;
  px(c, ox + 2, oy + 12, 12, 3, "rgba(0,0,0,0.25)");
  disc(c, ox + 8, oy + 8, 7, out); disc(c, ox + 8, oy + 8, 6, dark); disc(c, ox + 7, oy + 7, 4, mid);
  px(c, ox + 4, oy + 5, 2, 1, light); px(c, ox + 9, oy + 4, 2, 1, light); px(c, ox + 6, oy + 9, 1, 1, light); px(c, ox + 10, oy + 9, 2, 1, dark);
}

/** Crumbled stone walls with an open archway: an old ruin to explore. */
function drawRuin(c: Ctx, s: Structure, ox: number, oy: number, p: Pal) {
  const W = s.w * ART, Hh = s.h * ART, [out, dark, mid, light] = p.rock;
  px(c, ox + 2, oy + Hh - 2, W - 2, 3, "rgba(0,0,0,0.25)");
  px(c, ox, oy + 10, W, Hh - 10, out); px(c, ox + 1, oy + 11, W - 2, Hh - 12, mid);
  for (let y = 14; y < Hh - 2; y += 5) for (let x = (y / 5) % 2 ? 1 : 6; x < W - 2; x += 10) { px(c, ox + x, oy + y, 9, 1, dark); px(c, ox + x, oy + y - 4, 1, 4, dark); }
  for (let x = 0; x < W; x += 8) { const h = 2 + Math.floor(H(181, s.x + x, s.y) * 8); px(c, ox + x, oy + 10 - h, 7, h, out); px(c, ox + x + 1, oy + 11 - h, 5, h - 1, light); }
  for (let k = 0; k < 4; k++) px(c, ox + 4 + k * 14, oy + 18 + (k % 2) * 8, 5, 2, p.leaf[2]);
  const dx = ox + W / 2 - 7;
  px(c, dx - 1, oy + Hh - 20, 16, 20, out); disc(c, dx + 7, oy + Hh - 20, 8, out); px(c, dx, oy + Hh - 19, 14, 19, "#100c10"); disc(c, dx + 7, oy + Hh - 20, 7, "#100c10");
  px(c, dx + 2, oy + Hh - 3, 10, 3, p.accent);
}
function drawTemple(c: Ctx, s: Structure, ox: number, oy: number, p: Pal) {
  const W = s.w * ART, Hh = s.h * ART, [dark, mid, light] = p.dwall;
  px(c, ox, oy + 20, W, Hh - 20, "#0c0a10");
  px(c, ox + 1, oy + 21, W - 2, Hh - 22, mid);
  for (let y = 24; y < Hh - 2; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < W - 2; x += 12) { px(c, ox + 1 + x, oy + y, 11, 1, dark); px(c, ox + 1 + x, oy + y - 5, 1, 5, dark); }
  for (let k = 0; k < 9; k++) { const y = oy + 20 - k * 2, inset = k * 7; px(c, ox + inset, y, W - inset * 2, 2, "#0c0a10"); px(c, ox + inset + 1, y, W - inset * 2 - 2, 1, k % 2 ? light : mid); }
  disc(c, ox + W / 2, oy + 12, 6, "#0c0a10"); disc(c, ox + W / 2, oy + 12, 5, p.accent); px(c, ox + W / 2 - 1, oy + 11, 2, 2, "#0c0a10");
  for (const x of [ox + 14, ox + W - 26, ox + 40, ox + W - 52]) { px(c, x, oy + 26, 12, Hh - 34, "#0c0a10"); px(c, x + 1, oy + 27, 10, Hh - 36, light); px(c, x + 8, oy + 27, 3, Hh - 36, mid); px(c, x - 1, oy + 24, 14, 4, "#0c0a10"); px(c, x, oy + 25, 12, 2, light); }
  const dw = 28, dx = ox + W / 2 - dw / 2;
  px(c, dx - 2, oy + Hh - 44, dw + 4, 44, "#0c0a10");
  disc(c, ox + W / 2, oy + Hh - 40, dw / 2, "#0c0a10");
  px(c, dx, oy + Hh - 40, dw, 40, "#120e18"); disc(c, ox + W / 2, oy + Hh - 40, dw / 2 - 2, "#120e18");
  px(c, dx + 2, oy + Hh - 36, dw - 4, 2, p.accent); px(c, dx + 4, oy + Hh - 30, dw - 8, 30, "#04030a");
  for (const x of [dx - 10, dx + dw + 4]) { px(c, x, oy + Hh - 34, 6, 6, "#3a2a20"); px(c, x + 1, oy + Hh - 40, 4, 5, "#ffb030"); px(c, x + 2, oy + Hh - 42, 2, 3, "#fff0a0"); }
  for (let k = 0; k < 3; k++) px(c, ox + W / 2 - dw / 2 - 6 - k * 3, oy + Hh - 4 + k * 0, dw + 12 + k * 6, 2, k % 2 ? light : mid);
}

function dungeonFloor(c: Ctx, ox: number, oy: number, p: Pal, tx: number, ty: number, cell: Cell, carpet: boolean) {
  const [base, dark, light] = p.floor;
  px(c, ox, oy, ART, ART, base);
  px(c, ox, oy, ART, 1, dark); px(c, ox, oy + 8, ART, 1, dark); px(c, ox, oy, 1, ART, dark); px(c, ox + 8, oy, 1, ART, dark);
  for (const [x, y] of [[1, 1], [9, 1], [1, 9], [9, 9]] as const) px(c, ox + x, oy + y, 2, 1, light);
  if (H(141, tx, ty) < 0.15) px(c, ox + 4, oy + 4, 2, 1, dark);
  if (carpet) {
    px(c, ox, oy, ART, ART, "#9a2436");
    const side = (dx: number) => cell(tx + dx, ty) !== T.CARPET;
    if (side(-1)) px(c, ox, oy, 3, ART, "#e8b040");
    if (side(1)) px(c, ox + ART - 3, oy, 3, ART, "#e8b040");
    px(c, ox + 7, oy + 6, 2, 4, "#d04858"); px(c, ox + 6, oy + 7, 4, 2, "#d04858");
  }
  if (cell(tx, ty - 1) === T.WALL) px(c, ox, oy, ART, 4, "rgba(0,0,0,0.35)");
}
function dungeonWall(c: Ctx, ox: number, oy: number, p: Pal, tx: number, ty: number, cell: Cell) {
  const [dark, mid, light] = p.dwall;
  const front = cell(tx, ty + 1) !== T.WALL && ty + 1 < 1000;
  if (!front) {
    px(c, ox, oy, ART, ART, dark);
    if (H(151, tx, ty) < 0.3) px(c, ox + 5, oy + 6, 3, 1, mid);
    if (cell(tx, ty + 1) === T.WALL && cell(tx, ty + 2) !== T.WALL) px(c, ox, oy + ART - 2, ART, 2, light);
    return;
  }
  px(c, ox, oy, ART, ART, mid);
  for (let y = 0; y < ART; y += 4) { px(c, ox, oy + y, ART, 1, dark); const off = (y / 4 + tx) % 2 ? 4 : 10; px(c, ox + off, oy + y, 1, 4, dark); }
  px(c, ox, oy + 1, ART, 1, light);
  if (H(161, tx, ty) < 0.18) { px(c, ox + 6, oy + 7, 4, 5, "#3a2a20"); px(c, ox + 6, oy + 2, 4, 5, "#ff9a20"); px(c, ox + 7, oy + 1, 2, 4, "#ffe070"); px(c, ox + 4, oy + 1, 8, 8, "rgba(255,200,80,0.15)"); }
}

/** Draws one square chunk of `size`×`size` tiles (its top-left tile is chunk × size) onto a canvas of size×ART×RES pixels. */
export function drawChunk(c: Ctx, map: TileMap, theme: number, dungeon: boolean, chunkX: number, chunkY: number, size: number) {
  const p = PALETTES[theme] ?? PALETTES[0]!;
  const x0 = chunkX * size, y0 = chunkY * size;
  const cell: Cell = (x, y) => (x >= 0 && y >= 0 && x < map.w && y < map.h ? map.cells[y * map.w + x]! : dungeon ? T.WALL : T.TREE);
  const coarse = () => c.setTransform(RES, 0, 0, RES, 0, 0), fine = () => c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  if (dungeon) {
    coarse();
    for (let ty = y0; ty < y0 + size; ty++) for (let tx = x0; tx < x0 + size; tx++) {
      const ox = (tx - x0) * ART, oy = (ty - y0) * ART, t = cell(tx, ty);
      if (t === T.WALL) dungeonWall(c, ox, oy, p, tx, ty, cell); else dungeonFloor(c, ox, oy, p, tx, ty, cell, t === T.CARPET);
    }
    fine();
    return;
  }
  fine();
  for (let ty = y0; ty < y0 + size; ty++) for (let tx = x0; tx < x0 + size; tx++) {
    const X = (tx - x0) * HD, Y = (ty - y0) * HD, t = cell(tx, ty);
    switch (t) {
      case T.PATH: hdPath(c, X, Y, p, tx, ty, cell); break;
      case T.PLAZA: hdPlaza(c, X, Y, p, tx, ty); break;
      case T.FLOWERS: hdFlowers(c, X, Y, p, tx, ty); break;
      case T.SAND: hdSand(c, X, Y, p, tx, ty); break;
      case T.WATER: hdWater(c, X, Y, p, tx, ty, cell); break;
      case T.BRIDGE: hdBridge(c, X, Y, p, tx, ty, cell); break;
      case T.HIGH: case T.UPPER: case T.SUMMIT: hdHighland(c, X, Y, p, tx, ty, cell); break;
      case T.WALL: hdTownWall(c, X, Y, p, tx, ty, cell); break;
      case T.CLIFF: hdCliff(c, X, Y, p, tx, ty, cell); break;
      case T.LADDER: hdLadder(c, X, Y, p, tx, ty, cell); break;
      case T.MOUNTAIN: case T.ROCK: hdStoneGround(c, X, Y, p, tx, ty); if (t === T.ROCK) hdGrass(c, X, Y, p, tx, ty); break;
      // A house on a mountain plateau must sit on plateau grass, not on valley grass (otherwise a light rectangle shows around it).
      case T.BUILDING: {
        let high = false;
        for (let dy = -2; dy <= 2 && !high; dy++) for (let dx = -2; dx <= 2; dx++) { const v = cell(tx + dx, ty + dy); if (isHighGround(v) || v === T.CLIFF || v === T.LADDER) { high = true; break; } }
        if (high) hdHighland(c, X, Y, p, tx, ty, cell); else hdGrass(c, X, Y, p, tx, ty);
        break;
      }
      default: hdGrass(c, X, Y, p, tx, ty);
    }
  }
  // Trees (twice the hero's height), rocks, peaks and hedges may hang into neighbouring tiles and chunks;
  // draw them row by row (including anchors just outside this chunk) so lower ones overlap upper ones.
  const mountainBlock = (bx: number, by: number) =>
    cell(bx, by) === T.MOUNTAIN && cell(bx + 1, by) === T.MOUNTAIN && cell(bx, by + 1) === T.MOUNTAIN && cell(bx + 1, by + 1) === T.MOUNTAIN;
  for (let ty = y0 - 2; ty <= y0 + size + 3; ty++) for (let tx = x0 - 2; tx <= x0 + size + 2; tx++) {
    const t = cell(tx, ty), X = (tx - x0) * HD, Y = (ty - y0) * HD;
    if (t === T.HEDGE) hdHedge(c, X, Y, p, tx, ty, cell);
    else if (t === T.TREE) {
      c.save();
      c.translate(X + HD / 2, Y + HD);
      c.scale(2, 2);
      if (p.tree === "round" || p.tree === "willow") hdRoundTree(c, -HD / 2, -HD, p, tx, ty, cell);
      else if (p.tree === "pine") hdPineTree(c, -HD / 2, -HD, p, tx, ty, cell);
      else { c.scale(RES, RES); treeSprite(c, -ART / 2, -ART, p, tx, ty, cell); }
      c.restore();
    } else if (t === T.ROCK) hdRock(c, X, Y, p, tx, ty);
    else if (t === T.MOUNTAIN) {
      const bx = tx - (tx & 1), by = ty - (ty & 1);
      if (!mountainBlock(bx, by)) hdMountain(c, X, Y, p, tx, ty, cell);
      else if (tx === bx && ty === by + 1) {
        const blockCell: Cell = (x, y) => (mountainBlock(bx + (x - bx) * 2, by + (y - by) * 2) ? T.MOUNTAIN : T.GRASS);
        c.save();
        c.translate((bx - x0) * HD, (by - y0) * HD);
        c.scale(2, 2);
        hdMountain(c, 0, 0, p, bx, by, blockCell);
        c.restore();
      }
    }
  }
  for (const s of map.structures) {
    if (s.x > x0 + size + 2 || s.y > y0 + size + 3 || s.x + s.w + 2 < x0 || s.y + s.h + 2 < y0) continue;
    const X = (s.x - x0) * HD, Y = (s.y - y0) * HD;
    if (s.kind === "temple") { coarse(); drawTemple(c, s, X / RES, Y / RES, p); fine(); }
    else if (s.kind === "ruin") { coarse(); drawRuin(c, s, X / RES, Y / RES, p); fine(); }
    else if (s.kind === "grove") hdWoodsGate(c, s, X, Y, p);
    else if (s.kind === "castle") hdCastle(c, s, X, Y, p);
    else if (s.kind === "tower") hdTower(c, s, X, Y, p);
    else if (s.kind === "shrine") hdShrine(c, s, X, Y, p);
    else if (s.kind === "cave") hdCave(c, s, X, Y, p, cell);
    else if (s.kind === "crypt") hdCrypt(c, s, X, Y, p);
    else if (s.kind === "camp") hdCamp(c, s, X, Y, p);
    else if (s.kind === "well") hdWell(c, s, X, Y, p);
    else if (s.kind === "statue") hdStatue(c, s, X, Y, p);
    else if (s.kind === "stones") hdStones(c, s, X, Y, p);
    else if (s.kind === "smithy") hdSmithy(c, s, X, Y, p, theme);
    else if (s.kind === "stall") hdStall(c, s, X, Y, p);
    else if (s.kind === "falls") hdFalls(c, s, X, Y, p);
    else hdCottage(c, s, X, Y, p, theme);
  }
}

const spriteCache = new Map<string, string>();
/** Small sprites (bush, chests, gate bars) as image URLs, painted once per world theme. */
export function spriteUrl(kind: "bush" | "chest" | "bigchest" | "gate" | "chestopen" | "piece" | "plate" | "plateon", theme: number): string {
  const key = `${kind}-${theme}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const cv = document.createElement("canvas");
  cv.width = ART; cv.height = ART;
  const c = cv.getContext("2d");
  if (!c) return "";
  const p = PALETTES[theme] ?? PALETTES[0]!;
  if (kind === "bush") bushSprite(c, 0, 0, p);
  else if (kind === "gate") {
    px(c, 0, 0, 16, 16, "rgba(0,0,0,0.35)");
    for (let x = 1; x < 16; x += 4) { px(c, x, 0, 2, 16, "#1a1410"); px(c, x, 0, 1, 16, "#b0a090"); }
    px(c, 0, 3, 16, 2, "#1a1410"); px(c, 0, 11, 16, 2, "#1a1410"); px(c, 6, 6, 4, 4, p.accent);
  } else if (kind === "piece") {
    // A heart cut into thirds: the shining top-left third.
    const heart = ["..XX..XX..", ".XRRXXRRX.", "XRWRRRRRRX", "XRRRRRRRRX", ".XRRRRRRX.", "..XRRRRX..", "...XRRX...", "....XX...."];
    heart.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === ".") return; const piece = x + y < 9; px(c, 3 + x, 4 + y, 1, 1, ch === "X" ? "#3a0810" : !piece ? "rgba(255,255,255,0.12)" : ch === "W" ? "#ffffff" : "#ff3858"); }));
    px(c, 3, 13, 10, 2, "rgba(0,0,0,0.25)");
  } else if (kind === "plate" || kind === "plateon") {
    const on = kind === "plateon";
    px(c, 1, 2, 14, 13, "#1a1410"); px(c, 2, 3, 12, 11, on ? "#ffd860" : p.rock[1]); px(c, 2, 3, 12, 2, on ? "#fff4b0" : p.rock[2]);
    px(c, 5, 6, 6, 5, on ? "#ff9a30" : p.rock[0]); px(c, 6, 7, 4, 3, on ? "#fff4b0" : p.rock[1]);
  } else if (kind === "chestopen") {
    px(c, 1, 12, 14, 3, "rgba(0,0,0,0.3)");
    px(c, 1, 2, 14, 4, "#1a1008"); px(c, 2, 3, 12, 2, "#6e4020");
    px(c, 1, 7, 14, 8, "#1a1008"); px(c, 2, 8, 12, 6, "#9a5a28"); px(c, 3, 8, 10, 2, "#2a1408"); px(c, 2, 10, 12, 1, "#e0b040");
  } else {
    const big = kind === "bigchest", body = big ? "#2e5ab8" : "#9a5a28", trim = big ? "#ffd040" : "#e0b040";
    px(c, 1, 12, 14, 3, "rgba(0,0,0,0.3)");
    px(c, 1, 4, 14, 11, "#1a1008"); px(c, 2, 5, 12, 9, body); px(c, 2, 5, 12, 3, big ? "#4a7ad8" : "#b87438");
    px(c, 2, 8, 12, 1, trim); px(c, 7, 7, 2, 4, trim); px(c, 7, 9, 2, 1, "#1a1008");
    px(c, 2, 5, 1, 9, trim); px(c, 13, 5, 1, 9, trim);
  }
  const url = cv.toDataURL();
  spriteCache.set(key, url);
  return url;
}

// ---------- Field monsters (Minish-Cap-style pixel critters) ----------
export const MONSTER_KINDS = ["chuchu", "octorok", "moblin", "keese", "spiny", "tektite"] as const;
export type MonsterKind = (typeof MONSTER_KINDS)[number];
/** Body colours of each world's monsters: base, shade, highlight. */
const MONSTER_TINT: readonly C3[] = [
  ["#48c048", "#2a8030", "#a0f080"], ["#e0a040", "#a06820", "#ffe090"], ["#80a040", "#506828", "#c0e070"],
  ["#68b8f0", "#3070b0", "#d0f0ff"], ["#a070e0", "#6040a0", "#e0c8ff"], ["#f05030", "#a02818", "#ffb080"],
  ["#f0f0ff", "#a8b0e0", "#ffffff"], ["#40c0c0", "#207878", "#a0ffff"], ["#9050d0", "#502880", "#d8a8ff"],
];
function monster(c: Ctx, kind: MonsterKind, t: C3) {
  const [base, dark, light] = t, out = "#1a1018", eye = "#ffffff";
  px(c, 3, 14, 10, 2, "rgba(0,0,0,0.3)");
  switch (kind) {
    case "chuchu": // wobbly jelly blob
      disc(c, 8, 9, 6, out); px(c, 1, 9, 14, 6, out); disc(c, 8, 9, 5, base); px(c, 2, 9, 12, 5, base); px(c, 2, 12, 12, 2, dark);
      px(c, 4, 5, 3, 2, light); px(c, 5, 9, 2, 3, out); px(c, 9, 9, 2, 3, out); px(c, 5, 9, 1, 1, eye); px(c, 9, 9, 1, 1, eye); break;
    case "octorok": // round body with a snout
      disc(c, 8, 7, 6, out); disc(c, 8, 7, 5, base); px(c, 4, 4, 3, 2, light); px(c, 6, 10, 4, 5, out); px(c, 7, 11, 2, 3, dark);
      for (const x of [2, 5, 10, 13]) px(c, x - 1, 11, 2, 4, out);
      px(c, 4, 6, 3, 3, eye); px(c, 9, 6, 3, 3, eye); px(c, 5, 7, 1, 1, out); px(c, 10, 7, 1, 1, out); break;
    case "moblin": // pig-faced brute with a spear
      px(c, 3, 3, 10, 12, out); px(c, 4, 4, 8, 10, base); px(c, 4, 11, 8, 3, dark); px(c, 3, 1, 3, 3, out); px(c, 10, 1, 3, 3, out);
      px(c, 6, 8, 4, 3, light); px(c, 6, 9, 1, 1, out); px(c, 9, 9, 1, 1, out); px(c, 5, 5, 2, 2, "#ffe040"); px(c, 9, 5, 2, 2, "#ffe040");
      px(c, 14, 0, 1, 15, "#8a5a30"); px(c, 13, 0, 3, 2, "#c0c0c8"); break;
    case "keese": // flapping bat
      disc(c, 8, 8, 3, out); disc(c, 8, 8, 2, dark);
      for (let k = 0; k < 6; k++) { px(c, 1 + k, 5 + (k % 2), 1, 4 - (k % 2), out); px(c, 14 - k, 5 + (k % 2), 1, 4 - (k % 2), out); }
      px(c, 2, 6, 4, 2, base); px(c, 10, 6, 4, 2, base); px(c, 7, 7, 1, 1, "#ff3030"); px(c, 9, 7, 1, 1, "#ff3030"); break;
    case "spiny": // spiked beetle shell
      disc(c, 8, 9, 6, out); disc(c, 8, 9, 5, dark); disc(c, 7, 8, 3, base);
      for (const [x, y] of [[2, 6], [5, 3], [8, 2], [11, 3], [14, 6]] as const) { px(c, x - 1, y, 2, 3, out); px(c, x - 1, y, 1, 2, light); }
      px(c, 5, 12, 2, 1, eye); px(c, 9, 12, 2, 1, eye); break;
    case "tektite": // one-eyed hopping spider
      disc(c, 8, 7, 5, out); disc(c, 8, 7, 4, base); px(c, 5, 4, 3, 2, light);
      disc(c, 8, 7, 2, eye); px(c, 8, 7, 1, 1, out);
      for (const x of [1, 4, 11, 14]) { px(c, x, 10, 1, 5, out); px(c, x < 8 ? x : x - 1, 10, 2, 1, out); }
  }
}
/** Pixel sprite URL of a field monster for a world, painted once. */
export function monsterUrl(kind: MonsterKind, theme: number): string {
  const key = `m-${kind}-${theme}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const cv = document.createElement("canvas");
  cv.width = ART; cv.height = ART;
  const c = cv.getContext("2d");
  if (!c) return "";
  monster(c, kind, MONSTER_TINT[theme] ?? MONSTER_TINT[0]!);
  const url = cv.toDataURL();
  spriteCache.set(key, url);
  return url;
}
/** Which critter a foe looks like: shooters are Octoroks, chargers Moblins/Spinies, chasers Chuchus/Keese/Tektites. */
export function monsterKindFor(behavior: string, index: number): MonsterKind {
  if (behavior === "shoot") return "octorok";
  if (behavior === "charge") return index % 2 ? "spiny" : "moblin";
  return (["chuchu", "keese", "tektite"] as const)[index % 3]!;
}

// ---------- House interiors ----------
/** Paints a room from `houseRoom` (one character per 16px tile); chests are left to the page so they can open. */
export function drawRoom(c: Ctx, rows: readonly (readonly string[])[], theme: number, kind0: string) {
  const kind = kind0 === "cave" ? "ruin" : kind0 === "hut" ? "cabin" : kind0;
  const stoneHall = kind === "castle" || kind === "tower" || kind === "shrine" || kind === "crypt";
  const p = PALETTES[theme] ?? PALETTES[0]!;
  c.imageSmoothingEnabled = false;
  const plank = kind === "ruin" || stoneHall ? null : kind === "cabin" ? WOOD : (["#c89058", "#a06c3a", "#e0b07a"] as C3);
  rows.forEach((row, y) => row.forEach((t, x) => {
    const ox = x * ART, oy = y * ART;
    if (t === "#") {
      const top = y === 0;
      px(c, ox, oy, ART, ART, (kind === "ruin" || stoneHall) ? p.rock[1] : top ? p.wall[1] : "#2a1a12");
      if ((kind === "ruin" || stoneHall)) { px(c, ox, oy + 7, ART, 1, p.rock[0]); px(c, ox + (y % 2 ? 4 : 10), oy, 1, 7, p.rock[0]); px(c, ox + 1, oy + 1, 5, 2, p.rock[2]); }
      else if (top) { px(c, ox, oy, ART, 11, p.wall[0]); for (let k = 2; k < ART; k += 6) px(c, ox + k, oy, 1, 11, p.wall[1]); px(c, ox, oy + 11, ART, 5, "#5e3a1c"); px(c, ox, oy + 11, ART, 1, "#b07c48"); }
      else { px(c, ox + 1, oy + 1, ART - 2, ART - 2, "#5e3a1c"); px(c, ox + 2, oy + 2, ART - 4, 2, "#8a5a30"); }
      return;
    }
    if (plank) { px(c, ox, oy, ART, ART, plank[0]); for (let k = 3; k < ART; k += 5) px(c, ox, oy + k, ART, 1, plank[1]); px(c, ox + ((x * 7 + y * 3) % 12), oy + 1, 1, 3, plank[1]); px(c, ox + 2, oy + 1, 4, 1, plank[2]); }
    else if (stoneHall) { px(c, ox, oy, ART, ART, (x + y) % 2 ? p.plaza[0] : p.plaza[2]); px(c, ox, oy, ART, 1, p.plaza[1]); px(c, ox, oy, 1, ART, p.plaza[1]); }
    else { px(c, ox, oy, ART, ART, p.floor[0]); px(c, ox, oy, ART, 1, p.floor[1]); px(c, ox, oy, 1, ART, p.floor[1]); if ((x + y) % 3 === 0) px(c, ox + 6, oy + 7, 3, 2, p.floor[2]); if ((x * 5 + y) % 4 === 0) { px(c, ox + 9, oy + 3, 4, 1, p.ground[1]); px(c, ox + 10, oy + 2, 1, 2, p.ground[2]); } }
    switch (t) {
      case "~": px(c, ox, oy + 2, ART, 12, "#8a2838"); px(c, ox, oy + 4, ART, 1, "#e0b040"); px(c, ox, oy + 11, ART, 1, "#e0b040"); px(c, ox + 6, oy + 6, 4, 4, "#c04858"); break;
      case "D": px(c, ox + 2, oy, 12, ART, "#1a0e08"); px(c, ox + 4, oy + 2, 8, 14, "#f8e8b0"); px(c, ox + 5, oy + 10, 6, 6, p.ground[0]); break;
      case "B": px(c, ox + 1, oy + 1, 14, 14, "#3a2010"); px(c, ox + 2, oy + 2, 12, 12, "#e8e0d0"); px(c, ox + 2, oy + 2, 12, 4, "#ffffff"); px(c, ox + 2, oy + 7, 12, 7, p.roofs[0] ?? "#c04040"); px(c, ox + 2, oy + 7, 12, 1, "#ffffff"); break;
      case "T": px(c, ox + 1, oy + 3, 14, 9, "#3a2010"); px(c, ox + 2, oy + 4, 12, 6, "#a06c3a"); px(c, ox + 2, oy + 4, 12, 1, "#e0b07a"); px(c, ox + 3, oy + 12, 2, 3, "#3a2010"); px(c, ox + 11, oy + 12, 2, 3, "#3a2010"); px(c, ox + 6, oy + 5, 3, 2, "#ffffff"); break;
      case "F": px(c, ox + 1, oy + 1, 14, 14, "#2a2a30"); px(c, ox + 2, oy + 2, 12, 12, p.rock[2]); px(c, ox + 4, oy + 6, 8, 8, "#1a1010"); px(c, ox + 5, oy + 9, 6, 5, "#f06018"); px(c, ox + 6, oy + 7, 3, 4, "#ffd050"); break;
      case "S": px(c, ox + 1, oy, 14, 15, "#3a2010"); px(c, ox + 2, oy + 1, 12, 13, "#8a5a30"); for (const sy of [4, 9]) { px(c, ox + 2, oy + sy, 12, 1, "#3a2010"); px(c, ox + 3, oy + sy - 3, 2, 3, "#3c78c8"); px(c, ox + 6, oy + sy - 3, 2, 3, "#d0483c"); px(c, ox + 9, oy + sy - 2, 3, 2, "#e0a030"); } break;
      case "P": disc(c, ox + 8, oy + 9, 5, "#2a1408"); disc(c, ox + 8, oy + 9, 4, "#b86a38"); px(c, ox + 5, oy + 3, 6, 3, "#2a1408"); px(c, ox + 6, oy + 4, 4, 2, "#d08a50"); px(c, ox + 5, oy + 7, 2, 2, "#e0a070"); break;
      case "K": px(c, ox + 2, oy, 12, 15, "#3a2010"); px(c, ox + 3, oy + 1, 10, 9, "#e0b040"); px(c, ox + 4, oy + 3, 8, 6, "#a02436"); px(c, ox + 2, oy + 10, 12, 4, "#e0b040"); break;
      case "I": px(c, ox + 4, oy, 8, 16, "#1a1418"); px(c, ox + 5, oy, 6, 16, p.rock[2]); px(c, ox + 9, oy, 2, 16, p.rock[1]); px(c, ox + 3, oy, 10, 3, p.rock[3]); break;
      case "G": px(c, ox + 5, oy + 1, 6, 5, "#9aa0b0"); px(c, ox + 6, oy + 3, 4, 2, "#f0c8a0"); px(c, ox + 4, oy + 6, 8, 7, "#3c5ab0"); px(c, ox + 5, oy + 13, 2, 3, "#3a2010"); px(c, ox + 9, oy + 13, 2, 3, "#3a2010"); px(c, ox + 13, oy, 1, 15, "#8a5a30"); px(c, ox + 12, oy, 3, 2, "#d0d0d8"); break;
      case "R": px(c, ox + 2, oy + 5, 12, 9, p.rock[0]); px(c, ox + 3, oy + 6, 10, 6, p.rock[1]); px(c, ox + 4, oy + 6, 4, 2, p.rock[2]); px(c, ox + 1, oy + 12, 5, 3, p.rock[1]); break;
    }
  }));
}

// ---------- Lost Woods clearings ----------
/** Paints one Lost Woods clearing (square tile grid from `woodsCells`) with the world-1 forest art. */
export function drawWoodsClearing(c: Ctx, cells: Uint8Array, n: number) {
  drawChunk(c, { w: n, h: n, cells, structures: [] }, 0, false, 0, 0, n);
}
