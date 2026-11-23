import { describe, it, expect } from "vitest";
import { buildModeBoard, partyTile, advancePosition, hasFinished, REMAKE_PLATFORMS, platformChallenge, modeGoal, MODES, diceCount, isEndless, usesStatelessBoard } from "./remake";
import { LOOK_COMBINATIONS, TINTS, PATTERNS, TRAILS, BADGES, BACKS, FEET, FX, DANCES, HALOS, SPIRITS } from "./avatar";
import { LOCATIONS, locationTasks, locationQuickTasks, locationSpecials } from "./locations";
describe("Afterlife Remake rules", () => {
  it("has 300 platform variants: 100 Anniversary + 100 Party + 100 Afterlife", () => {
    expect(new Set(REMAKE_PLATFORMS.map(p => p.id)).size).toBe(300);
    expect(REMAKE_PLATFORMS.filter(p => p.series === "party")).toHaveLength(100);
    expect(REMAKE_PLATFORMS.filter(p => p.series === "afterlife")).toHaveLength(100);
    const board = buildModeBoard("anniversary", 42);
    expect(board).toHaveLength(451);
    expect(board.filter(t => t.startsWith("remake-"))).toHaveLength(300);
    expect(board.filter(t => t === "special")).toHaveLength(50);
    expect(board.filter(t => t === "quiz")).toHaveLength(5);
    expect(buildModeBoard("classic", 42)).toHaveLength(151);
  });
  it("generates 1000 genuinely different challenge texts for every platform", () => {
    for (const platform of REMAKE_PLATFORMS) {
      expect(new Set(Array.from({ length: 1000 }, (_, i) => platformChallenge(platform, i, "Zuhause"))).size).toBe(1000);
    }
  });
  it("Party continues over thousands of fields without a goal or giant board", () => {
    expect(advancePosition(9999, 6, "party")).toBe(10005);
    expect(hasFinished(10005, "party")).toBe(false);
    expect(buildModeBoard("party", 42)).toEqual([]);
    expect(partyTile(10005, 42)).toBe(partyTile(10005, 42));
    const tiles = Array.from({ length: 5000 }, (_, i) => partyTile(i + 1, 42));
    expect(tiles).not.toContain("goal");
    expect(new Set(tiles.filter(t => t.startsWith("remake-"))).size).toBe(300);
    expect(tiles.some((t, i) => t !== partyTile(i + 1, 99))).toBe(true);
  });
  it("offers 12 modes with their own goals and dice", () => {
    expect(MODES).toHaveLength(12);
    expect(modeGoal("ultra")).toBe(10000);
    expect(modeGoal("jenseits")).toBe(600);
    expect(modeGoal("geister")).toBe(300);
    expect(modeGoal("anniversary")).toBe(450);
    expect(isEndless("afterlife")).toBe(true);
    expect(hasFinished(99999, "afterlife")).toBe(false);
    expect([diceCount("afterlife"), diceCount("jenseits")]).toEqual([3, 3]);
    expect(modeGoal("blitz")).toBe(75);
    expect(modeGoal("mega")).toBe(5000);
    expect(modeGoal("turbo")).toBe(250);
    expect(modeGoal("chaos")).toBe(200);
    expect(hasFinished(449, "anniversary")).toBe(false);
    expect(hasFinished(450, "anniversary")).toBe(true);
    expect(hasFinished(5000, "mega")).toBe(true);
    expect(isEndless("rave")).toBe(true);
    expect(hasFinished(99999, "rave")).toBe(false);
    expect(usesStatelessBoard("mega")).toBe(true);
    expect([diceCount("turbo"), diceCount("rave"), diceCount("anniversary")]).toEqual([2, 2, 1]);
  });
  it("Turbo has 250 steps and Chaos 200 steps with no empty fields", () => {
    expect(buildModeBoard("turbo", 7)).toHaveLength(251);
    const chaos = buildModeBoard("chaos", 7);
    expect(chaos).toHaveLength(201);
    expect(chaos.slice(1, -1)).not.toContain("empty");
  });
  it("Geisterstunde has 300 steps where every Afterlife platform appears twice", () => {
    const board = buildModeBoard("geister", 7);
    expect(board).toHaveLength(301);
    const afterlife = board.filter(t => REMAKE_PLATFORMS.find(p => p.id === t)?.series === "afterlife");
    expect(afterlife).toHaveLength(200);
    expect(new Set(afterlife).size).toBe(100);
    expect(board.slice(1, -1)).not.toContain("empty");
  });
  it("offers over 40 Billionen (trillion) combinatorial looks with bounded catalogs", () => {
    expect(LOOK_COMBINATIONS).toBeGreaterThanOrEqual(40_000_000_000_000);
    expect([TINTS.length, PATTERNS.length, TRAILS.length, BADGES.length, BACKS.length, FEET.length, FX.length, DANCES.length, HALOS.length, SPIRITS.length]).toEqual([24, 16, 16, 32, 32, 32, 16, 12, 12, 12]);
  });
  it("has 43 locations with 1000 unique location-aware tasks per pool", () => {
    expect(LOCATIONS).toHaveLength(43);
    for (const l of LOCATIONS) {
      expect(new Set(locationTasks(l.id)).size).toBe(1000);
      expect(new Set(locationQuickTasks(l.id)).size).toBe(1000);
      expect(new Set(locationSpecials(l.id).map(s => s.desc)).size).toBe(1000);
    }
    expect(locationTasks("auto").every(t => t.includes("Fahrer spielen nicht mit"))).toBe(true);
    expect(locationTasks("bus").every(t => t.includes("Fahrer spielen nicht mit"))).toBe(true);
  });
});
