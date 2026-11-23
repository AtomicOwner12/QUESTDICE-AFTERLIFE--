// Village life: every villager on the map follows its own daily loop – home, work, the village square, a visit
// to a neighbour – and walks between those places step by step. Pure: the state at a time t is computed from the
// villager id and t, so there is nothing to store or sync, and every routine is testable.
import { hash } from "./story-terrain";
import { worldGroundOpen, worldPoints } from "./story-world";
import { worldNpcs, villageSpots, npcWorkEmoji, VILLAGE_RADIUS, type PlacedNpc } from "./story-npcs";
import { worldMap } from "./story-terrain";

/** Time a villager needs for one step (they stroll; the hero is faster). */
export const NPC_STEP_MS = 520;
type XY = [number, number];
type Seg = { walk: XY[] } | { at: XY; ms: number; mood: string; hidden: boolean };
type Life = { segs: Seg[]; total: number; offset: number };
export type NpcNow = { x: number; y: number; dir: 0 | 1 | 2 | 3; walking: boolean; mood: string | null; hidden: boolean };

const lifeCache = new Map<number, Map<number, Life>>();

function bfs(world: number, from: XY, to: XY, box: number | null): XY[] | null {
  const m = worldMap(world), blocked = new Set(worldPoints(world).map((p) => p.y * m.w + p.x));
  const ok = (x: number, y: number) => worldGroundOpen(world, x, y) && !blocked.has(y * m.w + x)
    && (box === null || Math.max(Math.abs(x - from[0]), Math.abs(y - from[1]), Math.abs(x - to[0]), Math.abs(y - to[1])) <= box);
  const start = from[1] * m.w + from[0], goal = to[1] * m.w + to[0];
  const prev = new Map<number, number>([[start, -1]]), queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    if (i === goal) break;
    const x = i % m.w, y = (i - x) / m.w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy, k = yy * m.w + xx;
      if (!prev.has(k) && ok(xx, yy)) { prev.set(k, i); queue.push(k); }
    }
  }
  if (!prev.has(goal)) return null;
  const path: XY[] = [];
  for (let i = goal; i !== -1; i = prev.get(i)!) path.push([i % m.w, Math.floor(i / m.w)]);
  return path.reverse();
}

function buildLife(world: number, n: PlacedNpc, village: number): Life {
  const spots = villageSpots(world, village), doors = spots.filter(([x, y]) => worldMap(world).structures.some((s) => s.x + Math.floor(s.w / 2) === x && s.y + s.h === y));
  const home: XY = [n.x, n.y], livesInside = doors.some(([x, y]) => x === n.x && y === n.y);
  const pick = (k: number, list: XY[]) => list[Math.floor(hash(n.id * 13 + k, world, village) * list.length)] ?? home;
  const ground = spots.filter((p) => !doors.includes(p));
  const work = pick(1, ground), square = pick(2, ground), visit = pick(3, doors.filter(([x, y]) => x !== n.x || y !== n.y));
  const r = (k: number, lo: number, hi: number) => Math.round(lo + hash(n.id * 7 + k, world, 5) * (hi - lo));
  const stops: { at: XY; ms: number; mood: string; hidden: boolean }[] = [
    { at: home, ms: r(1, 7000, 15000), mood: livesInside ? "💤" : "☕", hidden: livesInside },
    { at: work, ms: r(2, 8000, 14000), mood: npcWorkEmoji(n.id), hidden: false },
    { at: square, ms: r(3, 4000, 9000), mood: "💬", hidden: false },
    { at: visit, ms: r(4, 3000, 6000), mood: "👋", hidden: false },
  ];
  const segs: Seg[] = [];
  stops.forEach((st, i) => {
    segs.push(st);
    const next = stops[(i + 1) % stops.length]!.at;
    const path = bfs(world, st.at, next, VILLAGE_RADIUS + 4) ?? bfs(world, st.at, next, null);
    if (path && path.length > 1) segs.push({ walk: path });
  });
  const total = segs.reduce((t, sg) => t + ("walk" in sg ? (sg.walk.length - 1) * NPC_STEP_MS : sg.ms), 0);
  return { segs, total, offset: Math.floor(hash(n.id, world, 77) * total) };
}

function lifeOf(world: number, id: number): Life | null {
  let w = lifeCache.get(world);
  if (!w) { w = new Map(); lifeCache.set(world, w); }
  const hit = w.get(id);
  if (hit) return hit;
  const open = worldNpcs(world).open, j = open.findIndex((n) => n.id === id);
  if (j < 0) return null;
  const life = buildLife(world, open[j]!, j % worldMap(world).sites.cities.length);
  w.set(id, life);
  return life;
}

const dirOf = (a: XY, b: XY): 0 | 1 | 2 | 3 => (b[1] > a[1] ? 0 : b[0] < a[0] ? 1 : b[0] > a[0] ? 2 : 3);

/** Where a villager is and what they do at time t (ms; any clock works, the loop just repeats). */
export function npcNow(world: number, id: number, t: number): NpcNow | null {
  const life = lifeOf(world, id);
  if (!life) return null;
  let local = (((t + life.offset) % life.total) + life.total) % life.total;
  let last: XY = [0, 0], lastDir: 0 | 1 | 2 | 3 = 0;
  for (const sg of life.segs) {
    if ("walk" in sg) {
      const ms = (sg.walk.length - 1) * NPC_STEP_MS;
      if (local < ms) {
        const k = Math.floor(local / NPC_STEP_MS), a = sg.walk[k]!, b = sg.walk[k + 1]!;
        return { x: b[0], y: b[1], dir: dirOf(a, b), walking: true, mood: null, hidden: false };
      }
      local -= ms;
      const n = sg.walk.length;
      last = sg.walk[n - 1]!; lastDir = dirOf(sg.walk[n - 2]!, last);
    } else {
      if (local < sg.ms) return { x: sg.at[0], y: sg.at[1], dir: sg.hidden ? 3 : lastDir === 3 ? 0 : lastDir, walking: false, mood: sg.mood, hidden: sg.hidden };
      local -= sg.ms;
      last = sg.at;
    }
  }
  return { x: last[0], y: last[1], dir: lastDir, walking: false, mood: null, hidden: false };
}

/** The visible villager closest to the hero within one step (diagonals count), at time t. */
export function nearbyVillager(world: number, x: number, y: number, t: number): PlacedNpc | null {
  let best: PlacedNpc | null = null, bestD = Infinity;
  for (const n of worldNpcs(world).open) {
    const now = npcNow(world, n.id, t);
    if (!now || now.hidden || Math.max(Math.abs(now.x - x), Math.abs(now.y - y)) > 1) continue;
    const d = Math.abs(now.x - x) + Math.abs(now.y - y);
    if (d < bestD) { best = { id: n.id, x: now.x, y: now.y }; bestD = d; }
  }
  return best;
}
/** Total length of a villager's daily loop in ms (for tests and timing). */
export const npcLoopMs = (world: number, id: number) => lifeOf(world, id)?.total ?? 0;
