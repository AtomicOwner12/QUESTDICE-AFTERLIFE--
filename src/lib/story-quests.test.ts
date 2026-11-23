import { describe, expect, it } from "vitest";
import { worldMap, LANDMARKS, T, WORLD_W, WORLD_H } from "./story-terrain";
import { canWalkWorld, savePoints, canWalkSave } from "./story-world";
import { worldHouses, houseRoom } from "./story-houses";
import { sideQuests, sideStep, acceptSide, pickSideItem, finishSide, openTreasure, treasureOpened } from "./story-quests";
import { newSave, cleanSave, worldSpawn, type StorySave } from "./story";

const WORLDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
function reach(world: number) {
  const W = WORLD_W, seen = new Uint8Array(W * WORLD_H), s = worldSpawn(world), q = [s.y * W + s.x];
  seen[q[0]!] = 1;
  while (q.length) {
    const i = q.pop()!, x = i % W, y = (i - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy, k = yy * W + xx;
      if (xx >= 0 && yy >= 0 && xx < W && yy < WORLD_H && !seen[k] && canWalkWorld(world, xx, yy)) { seen[k] = 1; q.push(k); }
    }
  }
  return (x: number, y: number) => seen[y * W + x] === 1;
}
const nextTo = (ok: (x: number, y: number) => boolean, x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok(x + dx!, y + dy!));
const at = (s: StorySave, world: number, x: number, y: number): StorySave => ({ ...s, world, worldPos: { x, y } });

describe("fuller open worlds", () => {
  it("every world has at least 25 extra countryside places: huts, crypts and landmarks", () => {
    for (const w of WORLDS) {
      const kinds = worldMap(w).structures.map((s) => s.kind);
      const wild = kinds.filter((k) => k === "hut" || k === "crypt" || LANDMARKS.includes(k));
      expect(wild.length).toBeGreaterThanOrEqual(25);
      expect(kinds.filter((k) => k === "hut").length).toBeGreaterThanOrEqual(3);
      expect(kinds.filter((k) => k === "crypt").length).toBeGreaterThanOrEqual(3);
    }
  });
  it("every hut and crypt can be walked into from the start of its world, and has treasure inside", () => {
    for (const w of WORLDS) {
      const ok = reach(w);
      for (const h of worldHouses(w).filter((x) => x.kind === "hut" || x.kind === "crypt")) {
        expect(ok(h.door.x, h.door.y + 1)).toBe(true);
        expect(houseRoom(w, h.index).chests.length).toBeGreaterThanOrEqual(h.kind === "crypt" ? 3 : 2);
      }
    }
  });
});

describe("treasure chests in the open world", () => {
  it("every world hides at least 12 chests, each reachable from a neighbouring cell", () => {
    for (const w of WORLDS) {
      const m = worldMap(w), ok = reach(w);
      expect(m.treasures.length).toBeGreaterThanOrEqual(12);
      for (const [x, y] of m.treasures) { expect(m.cells[y * m.w + x]).toBe(T.BUILDING); expect(nextTo(ok, x, y)).toBe(true); }
    }
  });
  it("a chest opens exactly once and pays something", () => {
    const s0 = newSave();
    const r = openTreasure(s0, 0, 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.save.rubies).toBeGreaterThan(s0.rubies);
    expect(treasureOpened(r.save, 0, 1)).toBe(true);
    expect(openTreasure(r.save, 0, 1).ok).toBe(false);
    const weapon = openTreasure(s0, 2, 0);
    expect(weapon.ok && weapon.save.weapons.length).toBe(2);
  });
});

describe("hermit side quests", () => {
  it("every world has at least three hermits standing on reachable ground, with their lost item reachable too", () => {
    for (const w of WORLDS) {
      const qs = sideQuests(w), ok = reach(w);
      expect(qs.length).toBeGreaterThanOrEqual(3);
      for (const q of qs) {
        expect(nextTo(ok, q.giver.x, q.giver.y)).toBe(true);
        expect(canWalkWorld(w, q.item.x, q.item.y)).toBe(true);
        expect(Math.abs(q.item.x - q.giver.x) + Math.abs(q.item.y - q.giver.y)).toBeGreaterThanOrEqual(20);
      }
    }
    const names = WORLDS.flatMap((w) => sideQuests(w).map((q) => q.name));
    expect(new Set(names).size).toBe(names.length);
  });
  it("ask → search → pick up beside the item → return pays the reward once", () => {
    const q = sideQuests(1)[0]!;
    let s = at(newSave(), 1, q.giver.x, q.giver.y + 1);
    expect(sideStep(s, 1, 0)).toBe("ask");
    s = acceptSide(s, 1, 0);
    expect(sideStep(s, 1, 0)).toBe("search");
    expect(savePoints(s, 1).some((p) => p.kind === "hermititem" && p.x === q.item.x && p.y === q.item.y)).toBe(true);
    expect(canWalkSave(s, 1, q.item.x, q.item.y)).toBe(false);
    expect(pickSideItem(s, 1, 0).ok).toBe(false);
    const picked = pickSideItem(at(s, 1, q.item.x + 1, q.item.y), 1, 0);
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;
    expect(sideStep(picked.save, 1, 0)).toBe("return");
    const done = finishSide(picked.save, 1, 0);
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.save.rubies).toBe(picked.save.rubies + q.reward.rubies);
    expect(sideStep(done.save, 1, 0)).toBe("done");
    expect(finishSide(done.save, 1, 0).ok).toBe(false);
  });
  it("saves keep quest progress only in order (no finished quest without its find)", () => {
    const s = cleanSave({ ...newSave(), sideAsked: ["2:1"], sideFound: ["2:1", "3:0"], sideDone: ["2:1", "4:4"], treasures: ["0:3", "bad"] });
    expect(s.sideFound).toEqual(["2:1"]);
    expect(s.sideDone).toEqual(["2:1"]);
    expect(s.treasures).toEqual(["0:3"]);
  });
});
