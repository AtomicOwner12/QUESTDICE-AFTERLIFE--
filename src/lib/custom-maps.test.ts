import { describe, expect, it } from "vitest";
import { applyCustomPlatform, cleanPlatform, cleanTiles, customBoard, generateTiles, MAX_TILES, MIN_TILES, USERNAME_RE } from "./custom-maps";

describe("custom maps", () => {
  it("generates exactly the requested number of fields", () => {
    expect(generateTiles({ length: 500, mix: { task: 1, special: 1 }, platformWeights: [] })).toHaveLength(500);
  });
  it("allows very long maps up to the storage limit", () => {
    expect(generateTiles({ length: 5_000_000, mix: { empty: 1 }, platformWeights: [] })).toHaveLength(MAX_TILES);
  });
  it("is reproducible for the same seed", () => {
    const r = { length: 200, mix: { task: 2, bad: 1 }, platformWeights: [1] };
    expect(generateTiles(r, 7)).toEqual(generateTiles(r, 7));
  });
  it("places custom platforms when weighted", () => {
    expect(generateTiles({ length: 300, mix: {}, platformWeights: [1] }).every((t) => t === "custom-0")).toBe(true);
  });
  it("turns unknown or out-of-range tiles into empty fields and pads short maps", () => {
    const t = cleanTiles(["task", "custom-3", "hack", 4], 2);
    expect(t.slice(0, 4)).toEqual(["task", "empty", "empty", "empty"]);
    expect(t).toHaveLength(MIN_TILES);
  });
  it("wraps the map with start and goal", () => {
    const b = customBoard(cleanTiles(["task"], 0));
    expect(b[0]).toBe("start");
    expect(b[b.length - 1]).toBe("goal");
  });
  it("moves players by a steps platform but never past the goal or below start", () => {
    const fwd = cleanPlatform({ effect: "steps", value: 10 });
    expect(applyCustomPlatform({ pos: 95, coins: 0, shield: false }, fwd, 100).pos).toBe(99);
    const back = cleanPlatform({ effect: "steps", value: -10 });
    expect(applyCustomPlatform({ pos: 3, coins: 0, shield: false }, back, 100).pos).toBe(0);
  });
  it("never lets coins go negative", () => {
    expect(applyCustomPlatform({ pos: 0, coins: 2, shield: false }, cleanPlatform({ effect: "coins", value: -9 }), 50).coins).toBe(0);
  });
  it("accepts usernames of 3-20 letters, digits or underscore", () => {
    expect(USERNAME_RE.test("Umut_42")).toBe(true);
    expect(USERNAME_RE.test("ab")).toBe(false);
    expect(USERNAME_RE.test("mit leer")).toBe(false);
  });
});
