import { describe, it, expect } from "vitest";
import { buildBoard, move, applyBad, GOAL, SPECIAL_COUNT, DEATH_COUNT, randomBad, laneDrift } from "./game";

describe("game rules", () => {
  it("path has exactly 150 steps to the goal", () => {
    const b = buildBoard();
    expect(GOAL).toBe(150);
    expect(b.length).toBe(151);
    expect(b[150]).toBe("goal");
  });
  it("has exactly 50 special tiles", () => {
    expect(SPECIAL_COUNT).toBe(50);
    for (const seed of [1, 7, 99]) expect(buildBoard(seed).filter((t) => t === "special").length).toBe(50);
  });
  it("has exactly 15 death penalty tiles", () => {
    expect(DEATH_COUNT).toBe(15);
    for (const seed of [1, 7, 99]) expect(buildBoard(seed).filter((t) => t === "death").length).toBe(15);
  });
  it("bad tiles never send you back to start", () => {
    for (let i = 0; i < 500; i++) expect(randomBad().kind).not.toBe("start");
  });
  it("moves forward by the rolled number, capped at goal", () => {
    expect(move(10, 6)).toBe(16);
    expect(move(148, 6)).toBe(150);
  });
  it("bad tiles: 3 back or back to start", () => {
    expect(applyBad(20, { kind: "back", steps: 3 })).toBe(17);
    expect(applyBad(2, { kind: "back", steps: 3 })).toBe(0);
    expect(applyBad(90, { kind: "start" })).toBe(0);
  });
});

import { TASKS, QUICK_TASKS, MINIGAMES, DEATH_GAMES } from "./content";
import { QTE_WINDOW_MS } from "./game";
import { CLICK_COUNT } from "./game";
import { CLICK_GAMES, quickTaskPosition, scoreClick } from "./click-games";
describe("click platforms and quick-task deadlines", () => {
  it("has exactly 15 click platforms without replacing Specials or Death Penalties", () => {
    expect(CLICK_COUNT).toBe(15);
    for (const seed of [1, 7, 99]) {
      const board = buildBoard(seed);
      expect(board.filter((t) => t === "click")).toHaveLength(15);
      expect(board.filter((t) => t === "special")).toHaveLength(50);
      expect(board.filter((t) => t === "death")).toHaveLength(15);
    }
  });
  it("provides 1000 playable click variants with distinct parameters", () => {
    expect(CLICK_GAMES).toHaveLength(1000);
    expect(new Set(CLICK_GAMES.map((g) => g.id)).size).toBe(1000);
    expect(new Set(CLICK_GAMES.map((g) => JSON.stringify([g.mode, g.targetCount, g.size, g.interval]))).size).toBe(1000);
    expect(new Set(CLICK_GAMES.map((g) => g.mode)).size).toBe(10);
  });
  it("moves an expired misfortune task three steps backwards", () => {
    expect(quickTaskPosition(20, 20_000, 20_001)).toBe(17);
    expect(quickTaskPosition(20, 20_000, 20_000)).toBe(17);
    expect(quickTaskPosition(2, 20_000, 21_000)).toBe(0);
  });
  it("keeps the position when continuing before the deadline", () => {
    expect(quickTaskPosition(20, 20_000, 19_999)).toBe(20);
  });
  it("penalizes bombs, wrong sequences and early reaction taps", () => {
    for (const game of CLICK_GAMES) {
      if (game.mode === "dodge") expect(scoreClick(game, 1, 0, true)).toBe(-2);
      if (game.mode === "sequence") expect(scoreClick(game, 1, 0, true)).toBe(-1);
      if (game.mode === "reaction") expect(scoreClick(game, 0, 0, false)).toBe(-1);
      expect(scoreClick(game, 0, 0, true)).toBe(1);
    }
  });
});
describe("content pools", () => {
  it("death penalty window is 1 second", () => expect(QTE_WINDOW_MS).toBe(1000));
  it("has 1000 additional special variants", () => expect(MINIGAMES.length).toBe(1100));
  it("has at least 100 tasks and quick tasks", () => { expect(TASKS.length).toBeGreaterThanOrEqual(100); expect(QUICK_TASKS.length).toBeGreaterThanOrEqual(100); });
  it("has 1000 death game variants", () => expect(DEATH_GAMES.length).toBe(1000));
});

describe("irregular player lanes", () => {
  it("keeps every lane drift inside -1..1 and is deterministic", () => {
    for (const player of [0, 1, 2, 3]) {
      for (let i = 0; i <= GOAL; i++) {
        const d = laneDrift(i, player);
        expect(d).toBeGreaterThanOrEqual(-1);
        expect(d).toBeLessThanOrEqual(1);
      }
    }
    expect(laneDrift(42, 2)).toBe(laneDrift(42, 2));
  });
  it("winds back and forth many times instead of running straight", () => {
    let turns = 0;
    for (let i = 2; i <= GOAL; i++) {
      const a = laneDrift(i - 1, 0) - laneDrift(i - 2, 0);
      const b = laneDrift(i, 0) - laneDrift(i - 1, 0);
      if (a * b < 0) turns++;
    }
    expect(turns).toBeGreaterThan(10);
  });
  it("gives each player a different line", () => {
    for (let i = 1; i <= 20; i++) {
      expect(laneDrift(i, 0)).not.toBeCloseTo(laneDrift(i, 1), 6);
      expect(laneDrift(i, 2)).not.toBeCloseTo(laneDrift(i, 3), 6);
    }
  });
});
