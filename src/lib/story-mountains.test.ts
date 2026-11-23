import { describe, expect, it } from "vitest";
import { worldMap, T, terrainOpen, WORLD_W, WORLD_H } from "./story-terrain";
import { worldHouses, houseRoom, roomWalkable } from "./story-houses";
import { guardsNow } from "./story-guards";

const reachFrom = (w: number, skip?: (c: number) => boolean) => {
  const m = worldMap(w), seen = new Uint8Array(WORLD_W * WORLD_H), [sx, sy] = m.sites.spawn, q = [sy * WORLD_W + sx];
  seen[q[0]!] = 1;
  while (q.length) {
    const i = q.pop()!, x = i % WORLD_W, y = (i - x) / WORLD_W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx!, yy = y + dy!, k = yy * WORLD_W + xx;
      if (xx < 0 || yy < 0 || xx >= WORLD_W || yy >= WORLD_H || seen[k]) continue;
      const c = m.cells[k]!;
      if (terrainOpen(c) && !(skip && skip(c))) { seen[k] = 1; q.push(k); }
    }
  }
  return seen;
};

describe("bigger worlds", () => {
  it("villages are far apart (at least 110 steps)", () => {
    for (let w = 0; w < 9; w++) {
      const c = worldMap(w).sites.cities;
      expect(c).toHaveLength(5);
      for (let a = 0; a < c.length; a++) for (let b = a + 1; b < c.length; b++) expect(Math.abs(c[a]![0] - c[b]![0]) + Math.abs(c[a]![1] - c[b]![1])).toBeGreaterThanOrEqual(110);
    }
  });
  it("every world has big mountains you climb only by ladder", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w);
      expect(m.peaks.length, `world ${w}`).toBeGreaterThanOrEqual(3);
      const all = reachFrom(w), noLadder = reachFrom(w, (c) => c === T.LADDER);
      let top = 0, cut = 0;
      m.cells.forEach((c, i) => { if ((c === T.HIGH || c === T.UPPER || c === T.SUMMIT) && all[i]) { top++; if (!noLadder[i]) cut++; } });
      expect(top).toBeGreaterThan(50);
      expect(cut).toBe(top);
    }
  });
  it("big mountains rise in stacked terraces (like Mount Crenel), each level reachable by ladder", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), all = reachFrom(w);
      const terraced = m.peaks.filter((p) => p.tiers >= 2).length;
      expect(terraced / m.peaks.length, `world ${w}`).toBeGreaterThanOrEqual(0.6);
      let upper = 0;
      m.cells.forEach((c, i) => { if (c === T.UPPER && all[i]) upper++; });
      expect(upper, `world ${w}`).toBeGreaterThan(100);
      // An upper terrace can only be reached from the first plateau: without the ladders it is cut off.
      const noLadder = reachFrom(w, (c) => c === T.LADDER);
      m.cells.forEach((c, i) => { if (c === T.UPPER) expect(noLadder[i]).toBe(0); });
    }
  });
  it("a walled castle town with three open gates and homes you can walk to", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), all = reachFrom(w), castle = m.structures.find((s) => s.kind === "castle")!;
      let wall = 0;
      for (let y = castle.y - 12; y <= castle.y + castle.h + 19; y++) for (let x = castle.x - 15; x <= castle.x + castle.w + 14; x++) if (m.cells[y * WORLD_W + x] === T.WALL) wall++;
      expect(wall, `world ${w}`).toBeGreaterThan(150);
      const homes = worldHouses(w).filter((h) => Math.abs(h.door.x - (castle.x + castle.w / 2)) < 30 && h.door.y > castle.y - 12 && h.door.y < castle.y + castle.h + 19 && h.kind === "house");
      expect(homes.length, `world ${w}`).toBeGreaterThanOrEqual(18);
      for (const h of homes) expect(all[(h.door.y + 1) * WORLD_W + h.door.x]).toBe(1);
    }
  });
  it("mountains differ from world to world", () => {
    const sig = Array.from({ length: 9 }, (_, w) => worldMap(w).peaks.map((p) => `${p.x},${p.y},${p.rx},${p.ry}`).join("|"));
    expect(new Set(sig).size).toBe(9);
  });
  it("a castle in the middle of every world, with guards and an enterable throne hall", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), [cx, cy] = m.sites.castle;
      expect(Math.abs(cx - WORLD_W / 2)).toBeLessThan(10);
      const seen = reachFrom(w);
      expect(seen[(cy + 1) * WORLD_W + cx]).toBe(1);
      const g = guardsNow(w, 12345);
      expect(g.length).toBe(6);
      for (const x of g) expect(terrainOpen(m.cells[x.y * WORLD_W + x.x])).toBe(true);
      const castle = worldHouses(w).find((h) => h.kind === "castle")!;
      const room = houseRoom(w, castle.index);
      expect(room.rows.flat().filter((t) => t === "G").length).toBe(4);
      expect(roomWalkable(room, room.door.x, room.door.y - 1)).toBe(true);
    }
  });
  it("many places to enter in every world, all reachable", () => {
    for (let w = 0; w < 9; w++) {
      const seen = reachFrom(w), wild = worldHouses(w).filter((h) => h.kind !== "house");
      expect(wild.length, `world ${w}`).toBeGreaterThanOrEqual(5);
      expect(wild.some((h) => h.kind === "tower" || h.kind === "shrine")).toBe(true);
      for (const h of worldHouses(w)) expect(seen[(h.door.y + 1) * WORLD_W + h.door.x], `${w} ${h.kind} ${h.index}`).toBe(1);
    }
  });
});
