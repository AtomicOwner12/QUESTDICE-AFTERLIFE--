// Castle guards: two stand at the gate, four patrol around the moat. Pure in world + time, like the villagers.
import { worldMap } from "./story-terrain";
import { GUARD_LINES } from "./story-content";
import type { HeroLook } from "./story";

export const GUARD_STEP_MS = 650;
export const PATROLS = 4;
export const GUARD_LOOK: HeroLook = { skin: 1, hair: 8, outfit: 1, style: 0, body: 0, eyes: 1, head: 3, ears: 0 };
export type GuardNow = { i: number; x: number; y: number; dir: 0 | 1 | 2 | 3; walking: boolean };

export function guardsNow(world: number, t: number): GuardNow[] {
  const m = worldMap(world), loop = m.patrol, L = loop.length;
  const out: GuardNow[] = m.guardPosts.map(([x, y], i) => ({ i, x, y, dir: 0, walking: false }));
  if (!L) return out;
  const step = Math.floor(t / GUARD_STEP_MS);
  for (let k = 0; k < PATROLS; k++) {
    const idx = (step + Math.floor((k * L) / PATROLS)) % L;
    const [x, y] = loop[idx]!, [nx, ny] = loop[(idx + 1) % L]!;
    const dir = nx > x ? 2 : nx < x ? 1 : ny < y ? 3 : 0;
    out.push({ i: m.guardPosts.length + k, x, y, dir, walking: true });
  }
  return out;
}
export const nearbyGuard = (world: number, x: number, y: number, t: number) =>
  guardsNow(world, t).find((g) => Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= 1) ?? null;
export const guardLine = (world: number, i: number) => GUARD_LINES[(world * 3 + i) % GUARD_LINES.length]!;
