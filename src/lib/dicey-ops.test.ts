import { describe, expect, it } from "vitest";
import { applyDiceyOps, describeMap, type DiceyOp, type MapState } from "./dicey-ops";

const op = (o: Partial<DiceyOp>): DiceyOp => ({ type: "info", note: "", title: null, description: null, dice: null, length: null, from: null, to: null, every: null, tile: null, platformIndex: null, mix: null, customWeights: null, platform: null, ...o });
const base = (): MapState => ({ title: "A", description: "", dice: 1, tiles: Array.from({ length: 20 }, () => "task"), platforms: [] });

describe("Dicey building steps", () => {
  it("changes only the requested part of the map", () => {
    const { state } = applyDiceyOps(base(), [op({ type: "paint", tile: "quiz", from: 5, to: 15, every: 5 })]);
    expect(state.tiles.map((t, i) => (t === "quiz" ? i + 1 : 0)).filter(Boolean)).toEqual([5, 10, 15]);
    expect(state.tiles.filter((t) => t === "task")).toHaveLength(17);
  });
  it("adds a platform and paints it by index", () => {
    const { state, done } = applyDiceyOps(base(), [
      op({ type: "add_platform", note: "Geister-Sprung gebaut", platform: { name: "Geist", emoji: "👻", effect: "steps", value: 3, text: "" } }),
      op({ type: "paint", platformIndex: 0, from: 20, to: 20 }),
    ]);
    expect(state.platforms[0]?.name).toBe("Geist");
    expect(state.tiles[19]).toBe("custom-0");
    expect(done[0]).toBe("Geister-Sprung gebaut");
  });
  it("keeps tiles consistent when a platform is removed", () => {
    const start = { ...base(), platforms: [{ name: "X", emoji: "x", effect: "none" as const, value: 0, text: "" }, { name: "Y", emoji: "y", effect: "none" as const, value: 0, text: "" }], tiles: ["custom-0", "custom-1", ...base().tiles.slice(2)] as MapState["tiles"] };
    const { state } = applyDiceyOps(start, [op({ type: "remove_platform", platformIndex: 0 })]);
    expect(state.tiles.slice(0, 2)).toEqual(["empty", "custom-0"]);
  });
  it("grows a map without wiping what exists", () => {
    const { state } = applyDiceyOps(base(), [op({ type: "resize", length: 50 })]);
    expect(state.tiles).toHaveLength(50);
    expect(state.tiles.slice(0, 20).every((t) => t === "task")).toBe(true);
  });
  it("skips invalid steps instead of breaking", () => {
    const { state, done } = applyDiceyOps(base(), [op({ type: "paint", tile: "nope" }), op({ type: "edit_platform", platformIndex: 3 }), op({ type: "info", dice: 9 })]);
    expect(done).toHaveLength(1);
    expect(state.dice).toBe(3);
  });
  it("describes the current map for Dicey", () => {
    expect(describeMap(base())).toContain("Felder: 20");
  });
});
