import { describe, expect, it } from "vitest";
import { NPC_COUNT, npcAt, worldNpcs, cityResidents, nearbyNpc, meetNpc } from "./story-npcs";
import { worldGroundOpen, worldPoints, WORLD_W, WORLD_H, canWalkWorld, worldSpawn } from "./story-world";
import { CITIES, newSave } from "./story";

const all = Array.from({ length: NPC_COUNT }, (_, i) => npcAt(i));

describe("1000 residents", () => {
  it("are exactly 1000 people with unique names and unique looks", () => {
    expect(NPC_COUNT).toBe(1000);
    expect(new Set(all.map((n) => n.name)).size).toBe(1000);
    expect(new Set(all.map((n) => JSON.stringify(n.look))).size).toBe(1000);
  });
  it("every resident lives somewhere you can visit: on the map or in a village", () => {
    const homes = new Set<number>();
    for (let w = 0; w < 9; w++) {
      for (const n of worldNpcs(w).open) homes.add(n.id);
      for (let k = 0; k < 5; k++) for (const id of cityResidents(w * 5 + k)) homes.add(id);
    }
    expect(homes.size).toBe(1000);
    expect(CITIES.every((_, c) => cityResidents(c).length > 0)).toBe(true);
  });
  it("residents in the open world stand on walkable ground, apart from each other and from doors", () => {
    for (let w = 0; w < 9; w++) {
      const open = worldNpcs(w).open;
      expect(open.length).toBeGreaterThanOrEqual(10);
      expect(new Set(open.map((n) => `${n.x},${n.y}`)).size).toBe(open.length);
      for (const n of open) {
        expect(worldGroundOpen(w, n.x, n.y)).toBe(true);
        expect(n.x >= 0 && n.y >= 0 && n.x < WORLD_W && n.y < WORLD_H).toBe(true);
        expect(worldPoints(w).some((p) => p.x === n.x && p.y === n.y)).toBe(false);
        expect(npcAt(n.id).world).toBe(w);
      }
      expect(canWalkWorld(w, worldSpawn(w).x, worldSpawn(w).y)).toBe(true);
    }
  });
  it("you can talk to a resident standing next to you and they remember you once", () => {
    const n = worldNpcs(0).open[0]!;
    expect(nearbyNpc(0, n.x, n.y)?.id).toBe(n.id);
    const s = meetNpc(meetNpc(newSave(), n.id), n.id);
    expect(s.metNpcs).toEqual([n.id]);
  });
});
