import { describe, it, expect } from "vitest";
import { SIDEKICKS, sidekickRoll, sidekickPenalty, sidekickCoins } from "./sidekicks";
import { buildBoard, HELP_COUNT } from "./game";

const sk = (id: string) => SIDEKICKS.find((s) => s.id === id)!;
describe("sidekicks", () => {
  it("has over 100 sidekicks with unique abilities and names", () => {
    expect(SIDEKICKS.length).toBeGreaterThan(100);
    expect(new Set(SIDEKICKS.map((s) => s.id)).size).toBe(SIDEKICKS.length);
    expect(new Set(SIDEKICKS.map((s) => s.desc)).size).toBe(SIDEKICKS.length);
    expect(new Set(SIDEKICKS.map((s) => s.name)).size).toBe(SIDEKICKS.length);
  });
  it("places exactly 10 help tiles", () => {
    for (const seed of [1, 7, 99]) expect(buildBoard(seed).filter((t) => t === "help")).toHaveLength(HELP_COUNT);
    expect(HELP_COUNT).toBe(10);
  });
  it("+2 sidekick adds 2 to every roll", () => {
    expect(sidekickRoll(1, sk("rollPlus-2"))).toBe(3);
    expect(sidekickRoll(6, sk("rollPlus-2"))).toBe(8);
    expect(sidekickRoll(4, null)).toBe(4);
  });
  it("reduces penalties and adds coins", () => {
    expect(sidekickPenalty("death", 15, sk("deathReduce-5"))).toBe(10);
    expect(sidekickPenalty("bad", 3, sk("badReduce-3"))).toBe(0);
    expect(sidekickCoins(4, "empty", 0, sk("coinMult-2"))).toBe(8);
  });
});
