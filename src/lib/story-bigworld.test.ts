import { describe, expect, it } from "vitest";
import { worldMap, T, WORLD_W, WORLD_H } from "./story-terrain";
import { canWalkWorld, worldPoints, worldSpawn } from "./story-world";
import { cleanSave, newSave, upgradeWeapon, HERO_LOOK_V, type StorySave } from "./story";
import { LINK_PRESET } from "./pixel-elf";
import { worldNpcs, OPEN_NPCS_PER_WORLD } from "./story-npcs";
import { treasureAt } from "./story-quests";

const reachFrom = (w: number) => {
  const seen = new Uint8Array(WORLD_W * WORLD_H), s = worldSpawn(w), q = [s.y * WORLD_W + s.x];
  seen[q[0]!] = 1;
  while (q.length) {
    const i = q.pop()!, x = i % WORLD_W, y = (i - x) / WORLD_W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy, k = yy * WORLD_W + xx;
      if (!seen[k] && canWalkWorld(w, xx, yy)) { seen[k] = 1; q.push(k); }
    }
  }
  return seen;
};

describe("huge worlds with big villages", () => {
  it("every village has a shop, a blacksmith you can walk up to and at least 20 homes", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), seen = reachFrom(w);
      expect(m.structures.filter((s) => s.kind === "smithy")).toHaveLength(5);
      expect(m.structures.filter((s) => s.kind === "house").length).toBeGreaterThanOrEqual(5 * 20);
      const smiths = worldPoints(w).filter((p) => p.kind === "smith");
      expect(smiths.map((p) => p.ref)).toEqual([0, 1, 2, 3, 4].map((k) => w * 5 + k));
      for (const p of smiths) expect(seen[(p.y + 1) * WORLD_W + p.x], `world ${w} ${p.id}`).toBe(1);
    }
  });
  it("every world has a hedge labyrinth with a reachable treasure chest in its middle", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), lab = m.sites.labyrinth!, seen = reachFrom(w);
      expect(lab, `world ${w}`).toBeTruthy();
      expect(m.cells.filter((c) => c === T.HEDGE).length).toBeGreaterThan(300);
      expect(treasureAt(w, lab.center[0], lab.center[1])).toBeGreaterThanOrEqual(0);
      const [cx, cy] = lab.center;
      expect([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(cy + dy!) * WORLD_W + cx + dx!])).toBe(true);
    }
  });
  it("waterfalls pour into pools in most worlds", () => {
    let worlds = 0;
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w), falls = m.structures.filter((s) => s.kind === "falls");
      if (falls.length) worlds++;
      for (const f of falls) expect(m.cells[(f.y + f.h) * m.w + f.x + 1]).toBe(T.WATER);
    }
    expect(worlds).toBeGreaterThanOrEqual(7);
  });
  it("100 residents walk around the villages of every world", () => {
    expect(OPEN_NPCS_PER_WORLD).toBe(100);
    for (let w = 0; w < 9; w++) expect(worldNpcs(w).open.length, `world ${w}`).toBe(100);
  });
});

describe("blacksmith and hero look", () => {
  const rich = (): StorySave => ({ ...newSave(), rubies: 10_000, weapons: [0, 5], weapon: 0 });
  it("the blacksmith can sharpen any weapon you own, not only the equipped one", () => {
    const r = upgradeWeapon(rich(), 5);
    expect(r.ok && r.save.weaponLevels["5"]).toBe(1);
    expect(r.ok && r.save.weaponLevels["0"]).toBeUndefined();
  });
  it("the blacksmith refuses weapons you do not own", () => {
    expect(upgradeWeapon(rich(), 7).ok).toBe(false);
  });
  it("new heroes start as Link; saved looks are kept", () => {
    expect(newSave().heroLook).toEqual(LINK_PRESET);
    expect(cleanSave({ ...newSave(), heroLook: { ...LINK_PRESET, hair: 4 }, heroLookV: HERO_LOOK_V }).heroLook.hair).toBe(4);
  });
});
