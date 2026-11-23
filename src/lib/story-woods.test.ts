import { describe, expect, it } from "vitest";
import { T } from "./story-terrain";
import { LOST_WOODS_PATH, type WoodsDir } from "./story-world";
import { WOODS_N, SWORD_STONE, woodsArrival, woodsCell, woodsMove, woodsWalkable } from "./story-woods";

const GLADE = LOST_WOODS_PATH.length;
const STEP: Record<WoodsDir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/** Walks from a spot to the edge of a clearing heading `dir` and steps out; returns what happened. */
function leave(stage: number, from: { x: number; y: number }, dir: WoodsDir) {
  // breadth-first search to the lane cell on that side, then step out
  const target = woodsArrival(({ N: "S", S: "N", E: "W", W: "E" } as const)[dir]);
  const seen = new Set([`${from.x},${from.y}`]), queue = [from];
  while (queue.length) {
    const p = queue.shift()!;
    if (p.x === target.x && p.y === target.y) return woodsMove(stage, p.x, p.y, dir);
    for (const [dx, dy] of Object.values(STEP)) {
      const x = p.x + dx, y = p.y + dy, k = `${x},${y}`;
      if (!seen.has(k) && woodsWalkable(stage, x, y)) { seen.add(k); queue.push({ x, y }); }
    }
  }
  return null;
}

describe("walkable Lost Woods", () => {
  it("following the right turns walks you clearing by clearing into the sword glade", () => {
    let stage = 0, at = woodsArrival("N");
    for (const dir of LOST_WOODS_PATH) {
      const r = leave(stage, at, dir);
      expect(r).toMatchObject({ kind: "clearing", stage: stage + 1, lost: false });
      if (r?.kind !== "clearing") return;
      stage = r.stage; at = { x: r.x, y: r.y };
    }
    expect(stage).toBe(GLADE);
  });
  it("any wrong way out quietly brings you back to the first clearing", () => {
    for (let stage = 1; stage < GLADE; stage++) {
      const start = woodsArrival(LOST_WOODS_PATH[stage - 1]!);
      for (const dir of ["N", "E", "S", "W"] as WoodsDir[]) {
        if (dir === LOST_WOODS_PATH[stage]) continue;
        expect(leave(stage, start, dir)).toMatchObject({ kind: "clearing", stage: 0, lost: true });
      }
    }
  });
  it("south out of the first clearing leads back into the world", () => {
    expect(leave(0, woodsArrival("N"), "S")).toEqual({ kind: "leave" });
  });
  it("the glade only opens south, and you can walk up to the sword stone", () => {
    const at = woodsArrival("N");
    for (const dir of ["N", "E", "W"] as WoodsDir[]) expect(leave(GLADE, at, dir)).toBeNull();
    expect(leave(GLADE, at, "S")).toEqual({ kind: "leave" });
    const below = { x: SWORD_STONE[0].x, y: SWORD_STONE[0].y + 1 };
    expect(woodsWalkable(GLADE, below.x, below.y)).toBe(true);
    expect(woodsMove(GLADE, below.x, below.y, "N")).toEqual({ kind: "sword" });
  });
  it("the only clue is flowers beside the path that leads deeper", () => {
    for (let stage = 0; stage < GLADE; stage++) {
      const flowersBy = (dir: WoodsDir) => {
        let n = 0;
        for (let y = 0; y < WOODS_N; y++) for (let x = 0; x < WOODS_N; x++) {
          if (woodsCell(stage, x, y) !== T.FLOWERS) continue;
          const side: WoodsDir = Math.abs(x - 5.5) > Math.abs(y - 5.5) ? (x > 5.5 ? "E" : "W") : y > 5.5 ? "S" : "N";
          if (side === dir) n++;
        }
        return n;
      };
      const right = LOST_WOODS_PATH[stage]!;
      expect(flowersBy(right)).toBeGreaterThan(0);
      for (const d of ["N", "E", "S", "W"] as WoodsDir[]) if (d !== right) expect(flowersBy(d)).toBe(0);
    }
  });
});
