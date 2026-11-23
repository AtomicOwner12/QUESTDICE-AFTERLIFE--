import { describe, expect, it } from "vitest";
import { buildBoard, LOCAL_COUNT, teamOf, teamWinner } from "./game";
import { LOCATIONS, locationUnique } from "./locations";

describe("2v2 and location platforms", () => {
  it("pairs players 1+3 and 2+4", () => {
    expect([0, 1, 2, 3].map(teamOf)).toEqual([0, 1, 0, 1]);
  });
  it("a team wins only when both members are in the goal", () => {
    expect(teamWinner([0], 4)).toBeNull();
    expect(teamWinner([0, 1], 4)).toBeNull();
    expect(teamWinner([0, 1, 2], 4)).toBe(0);
    expect(teamWinner([3, 1], 4)).toBe(1);
  });
  it("every location has its own unique platform", () => {
    const names = LOCATIONS.map((l) => locationUnique(l.id).name);
    expect(new Set(names).size).toBe(LOCATIONS.length);
    expect(buildBoard(5).filter((t) => t === "local")).toHaveLength(LOCAL_COUNT);
  });
});
