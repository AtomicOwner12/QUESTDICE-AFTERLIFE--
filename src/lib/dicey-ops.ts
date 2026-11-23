import {
  BRUSHES, BRUSH_INFO, MAX_PLATFORMS, MAX_TILES, MIN_TILES, cleanPlatform, customIndex, customTile, effectLabel, generateTiles,
  type Brush, type CustomPlatform, type MapTile,
} from "./custom-maps";

/** The part of a map Dicey can change. */
export type MapState = { title: string; description: string; dice: number; tiles: MapTile[]; platforms: CustomPlatform[] };

export const OP_TYPES = ["info", "resize", "fill", "paint", "add_platform", "edit_platform", "remove_platform"] as const;
export type OpType = (typeof OP_TYPES)[number];
export type PlatformSpec = { name: string; emoji: string; effect: CustomPlatform["effect"]; value: number; text: string };

/** One building step from Dicey. Field numbers (from/to) are 1-based like the player sees them. */
export type DiceyOp = {
  type: OpType; note: string;
  title: string | null; description: string | null; dice: number | null; length: number | null;
  from: number | null; to: number | null; every: number | null;
  tile: string | null; platformIndex: number | null;
  mix: Record<Brush, number> | null; customWeights: number[] | null;
  platform: PlatformSpec | null;
};

export const MAX_OPS = 30;
export type ChatMessage = { role: "user" | "assistant"; text: string };

const clampInt = (n: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(Number(n)) ? Number(n) : lo)));

function currentMix(tiles: MapTile[], platformCount: number) {
  const mix: Partial<Record<Brush, number>> = {};
  const custom = Array.from({ length: platformCount }, () => 0);
  for (const t of tiles) {
    const c = customIndex(t);
    if (c !== null) { if (c < platformCount) custom[c]!++; }
    else mix[t as Brush] = (mix[t as Brush] ?? 0) + 1;
  }
  return { mix, custom };
}

function range(op: DiceyOp, length: number) {
  const from = op.from == null ? 1 : clampInt(op.from, 1, length);
  const to = op.to == null ? length : clampInt(op.to, from, length);
  return [from - 1, to - 1] as const;
}

/** Applies Dicey's steps one after another; invalid steps are skipped, never thrown. */
export function applyDiceyOps(start: MapState, ops: DiceyOp[], seed = 1): { state: MapState; done: string[] } {
  let s: MapState = { ...start, tiles: [...start.tiles], platforms: [...start.platforms] };
  const done: string[] = [];
  ops.slice(0, MAX_OPS).forEach((op, k) => {
    const note = String(op.note ?? "").slice(0, 120);
    const ok = () => done.push(note || op.type);
    switch (op.type) {
      case "info": {
        if (op.title?.trim()) s.title = op.title.trim().slice(0, 60);
        if (op.description != null) s.description = op.description.slice(0, 500);
        if (op.dice != null) s.dice = clampInt(op.dice, 1, 3);
        ok(); break;
      }
      case "resize": {
        if (op.length == null) return;
        const n = clampInt(op.length, MIN_TILES, MAX_TILES);
        if (n <= s.tiles.length) s.tiles = s.tiles.slice(0, n);
        else {
          const { mix, custom } = currentMix(s.tiles, s.platforms.length);
          s.tiles = [...s.tiles, ...generateTiles({ length: n - s.tiles.length, mix, platformWeights: custom }, seed + k)].slice(0, n);
        }
        ok(); break;
      }
      case "fill": {
        const [a, b] = range(op, s.tiles.length);
        const mix = op.mix ?? {};
        const weights = (op.customWeights ?? []).slice(0, s.platforms.length);
        const filled = generateTiles({ length: Math.max(MIN_TILES, b - a + 1), mix, platformWeights: weights }, seed + k * 7919).slice(0, b - a + 1);
        s.tiles = [...s.tiles.slice(0, a), ...filled, ...s.tiles.slice(b + 1)];
        ok(); break;
      }
      case "paint": {
        let tile: MapTile | null = null;
        if (op.platformIndex != null && Number.isInteger(op.platformIndex) && op.platformIndex >= 0 && op.platformIndex < s.platforms.length) tile = customTile(op.platformIndex);
        else if (op.tile && (BRUSHES as readonly string[]).includes(op.tile)) tile = op.tile as Brush;
        if (!tile) return;
        const [a, b] = range(op, s.tiles.length);
        const every = op.every == null ? 1 : clampInt(op.every, 1, MAX_TILES);
        const tiles = [...s.tiles];
        for (let i = a; i <= b; i += every) tiles[i] = tile;
        s.tiles = tiles; ok(); break;
      }
      case "add_platform": {
        if (!op.platform || s.platforms.length >= MAX_PLATFORMS) return;
        s.platforms = [...s.platforms, cleanPlatform(op.platform)];
        ok(); break;
      }
      case "edit_platform": {
        const i = op.platformIndex;
        if (i == null || !op.platform || !s.platforms[i]) return;
        s.platforms = s.platforms.map((p, j) => (j === i ? cleanPlatform({ ...p, ...op.platform }) : p));
        ok(); break;
      }
      case "remove_platform": {
        const i = op.platformIndex;
        if (i == null || !s.platforms[i]) return;
        s.platforms = s.platforms.filter((_, j) => j !== i);
        s.tiles = s.tiles.map((t) => { const c = customIndex(t); return c === null ? t : c === i ? "empty" : c > i ? customTile(c - 1) : t; });
        ok(); break;
      }
    }
  });
  return { state: s, done };
}

const tileName = (t: MapTile, platforms: CustomPlatform[]) => {
  const c = customIndex(t);
  return c !== null ? `#${c}:${platforms[c]?.name ?? "?"}` : t;
};

/** Short text picture of the map so Dicey knows what is already built. */
export function describeMap(s: MapState): string {
  const n = s.tiles.length;
  const { mix, custom } = currentMix(s.tiles, s.platforms.length);
  const counts = [...BRUSHES.filter((b) => mix[b]).map((b) => `${b}=${mix[b]}`), ...custom.map((c, i) => (c ? `#${i}=${c}` : "")).filter(Boolean)].join(", ");
  const segs = Math.min(12, Math.ceil(n / 10));
  const size = Math.ceil(n / segs);
  const sections = Array.from({ length: segs }, (_, i) => {
    const part = s.tiles.slice(i * size, (i + 1) * size);
    if (!part.length) return "";
    const c = new Map<string, number>();
    for (const t of part) c.set(tileName(t, s.platforms), (c.get(tileName(t, s.platforms)) ?? 0) + 1);
    const top = [...c.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k}×${v}`).join(" ");
    return `Felder ${i * size + 1}-${i * size + part.length}: ${top}`;
  }).filter(Boolean);
  const first = s.tiles.slice(0, 40).map((t) => tileName(t, s.platforms)).join(",");
  return [
    `Titel: ${s.title}`, `Beschreibung: ${s.description || "-"}`, `Würfel: ${s.dice}`, `Felder: ${n}`,
    `Eigene Plattformen: ${s.platforms.map((p, i) => `#${i} ${p.emoji} ${p.name} (${effectLabel(p)}${p.text ? `: ${p.text}` : ""})`).join("; ") || "keine"}`,
    `Anzahl pro Typ: ${counts}`, `Abschnitte: ${sections.join(" | ")}`, `Erste 40 Felder: ${first}`,
  ].join("\n").slice(0, 3500);
}

export const BRUSH_LIST_FOR_AI = BRUSHES.map((b) => `${b} (${BRUSH_INFO[b].name})`).join(", ");
