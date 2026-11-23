import { describe, expect, it } from "vitest";
import { worldNpcs, VILLAGE_RADIUS } from "./story-npcs";
import { npcNow, npcLoopMs, nearbyVillager, NPC_STEP_MS } from "./story-life";
import { worldGroundOpen } from "./story-world";
import { worldMap } from "./story-terrain";

describe("village life", () => {
  it("every villager on the map lives in one of the villages", () => {
    for (let w = 0; w < 9; w++) {
      const open = worldNpcs(w).open, cities = worldMap(w).sites.cities;
      expect(open.length).toBe(100);
      open.forEach((n, j) => {
        const c = cities[j % cities.length]!;
        expect(Math.max(Math.abs(n.x - c[0]), Math.abs(n.y - c[1]))).toBeLessThanOrEqual(VILLAGE_RADIUS);
      });
    }
  });
  it("villagers walk around their village one step at a time and only on open ground", () => {
    for (const w of [0, 3, 7]) for (const n of worldNpcs(w).open.slice(0, 12)) {
      const loop = npcLoopMs(w, n.id), seen = new Set<string>();
      let prev = npcNow(w, n.id, 0)!;
      for (let t = 0; t < loop; t += NPC_STEP_MS / 2) {
        const now = npcNow(w, n.id, t)!;
        expect(worldGroundOpen(w, now.x, now.y)).toBe(true);
        expect(Math.abs(now.x - prev.x) + Math.abs(now.y - prev.y)).toBeLessThanOrEqual(1);
        seen.add(`${now.x},${now.y}`);
        prev = now;
      }
      expect(seen.size).toBeGreaterThan(3);
    }
  });
  it("they keep a daily routine: home, work, the square and a visit, then the loop repeats", () => {
    const n = worldNpcs(0).open[0]!, loop = npcLoopMs(0, n.id), moods = new Set<string>();
    for (let t = 0; t < loop; t += 250) { const m = npcNow(0, n.id, t)!.mood; if (m) moods.add(m); }
    expect(moods.has("💬")).toBe(true);
    expect(moods.has("👋")).toBe(true);
    expect(moods.size).toBeGreaterThanOrEqual(4);
    expect(npcNow(0, n.id, 1234)).toEqual(npcNow(0, n.id, 1234 + loop));
  });
  it("villagers who live in a house go inside to rest and are not shown meanwhile", () => {
    const resting = worldNpcs(0).open.some((n) => { const loop = npcLoopMs(0, n.id); for (let t = 0; t < loop; t += 500) if (npcNow(0, n.id, t)!.hidden) return true; return false; });
    expect(resting).toBe(true);
  });
  it("you can talk to a villager right where they are walking", () => {
    const n = worldNpcs(0).open[5]!, now = npcNow(0, n.id, 50_000)!;
    if (now.hidden) return;
    expect(nearbyVillager(0, now.x, now.y + 1, 50_000)?.id).toBe(n.id);
  });
});
