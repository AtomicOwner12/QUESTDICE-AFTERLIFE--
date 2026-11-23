import { describe, it, expect } from "vitest";
import { pickRoles, placePowerTiles, demonStrike, angelBless, DEMON_TILES } from "./demon-angel";
import { buildBoard } from "./game";

describe("Demon & Angel Time", () => {
  it("appears only in 1 of 5 games", () => {
    expect(pickRoles(2, () => 0.19)).not.toBeNull();
    expect(pickRoles(2, () => 0.2)).toBeNull();
  });
  it("gives demon and angel to two different players", () => {
    for (let i = 0; i < 200; i++) {
      const r = pickRoles(4, (() => { let f = true; return () => (f ? ((f = false), 0) : Math.random()); })())!;
      expect(r.demon).not.toBe(r.angel);
    }
  });
  it("places exactly 5 tiles of the kind", () => {
    expect(DEMON_TILES).toBe(5);
    const b = placePowerTiles(buildBoard(3), "demon");
    expect(b.filter((t) => t === "demon")).toHaveLength(5);
    expect(b.filter((t) => t === "special")).toHaveLength(50);
  });
  it("demon pushes back 3, but not the active angel", () => {
    expect(demonStrike([10, 10], 1, true, 0)).toEqual([10, 7]);
    expect(demonStrike([10, 10], 0, true, 0)).toEqual([10, 10]);
  });
  it("angel pushes forward 3", () => {
    expect(angelBless([10, 148], 0, 150)).toEqual([13, 148]);
    expect(angelBless([10, 148], 1, 150)).toEqual([10, 149]);
  });
});

import { ABILITIES, applyAbility } from "./demon-angel";
describe("Demon & Angel abilities", () => {
  const s = { pos: [10, 20], coins: [3, 8], frozen: [false, true], shield: [true, false] };
  it("has 5 abilities per side", () => {
    expect(ABILITIES.filter((a) => a.side === "demon")).toHaveLength(5);
    expect(ABILITIES.filter((a) => a.side === "angel")).toHaveLength(5);
  });
  it("demon greed steals up to 5 coins", () => expect(applyAbility(s, "greed", 0, 1, 150, false).coins).toEqual([8, 3]));
  it("demon swap trades places", () => expect(applyAbility(s, "swap", 0, 1, 150, false).pos).toEqual([20, 10]));
  it("demon cannot touch the protected angel", () => expect(applyAbility(s, "strike", 1, 0, 150, true)).toEqual(s));
  it("angel thaw unfreezes and gives 1 step", () => { const n = applyAbility(s, "thaw", 0, 1, 150, false); expect(n.frozen[1]).toBe(false); expect(n.pos[1]).toBe(21); });
  it("angel wings moves the angel 5 forward", () => expect(applyAbility(s, "wings", 0, 0, 150, false).pos[0]).toBe(15));
});
