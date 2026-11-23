import { describe, it, expect } from "vitest";
import { SHOP_ITEMS, buyItem, stealItems, payFor, type ShopState } from "./shop";
import { buildBoard, SHOP_COUNT, TAX_COUNT } from "./game";

const base = (): ShopState => ({ pos: [30, 30], coins: [20, 0], frozen: [false, false], shield: [false, false], double: [false, false] });

describe("shop", () => {
  it("has 9 items, 5 sabotage and 4 self-help", () => {
    expect(SHOP_ITEMS).toHaveLength(9);
    expect(SHOP_ITEMS.filter((i) => i.target === "other")).toHaveLength(5);
  });
  it("places exactly 10 shop tiles", () => {
    expect(buildBoard(7).filter((t) => t === "shop")).toHaveLength(SHOP_COUNT);
  });
  it("bomb sends the chosen opponent 10 back and costs coins", () => {
    const n = buyItem(base(), 0, "bomb10", 1, 150)!;
    expect(n.pos).toEqual([30, 20]);
    expect(n.coins[0]).toBe(5);
  });
  it("cannot buy without enough coins or sabotage yourself", () => {
    expect(buyItem(base(), 1, "push5", 0, 150)).toBeNull();
    expect(buyItem(base(), 0, "push5", 0, 150)).toBeNull();
  });
  it("turbo moves the buyer 5 forward", () => {
    expect(buyItem(base(), 0, "turbo5", 1, 150)!.pos).toEqual([35, 30]);
  });
  it("swap exchanges positions, coinsteal takes up to 10 coins", () => {
    const s = { ...base(), pos: [10, 40], coins: [30, 7] };
    expect(buyItem(s, 0, "swap", 1, 150)!.pos).toEqual([40, 10]);
    expect(buyItem(s, 0, "coinsteal", 1, 150)!.coins).toEqual([31, 0]);
  });
  it("places exactly 10 tax tiles", () => {
    for (const seed of [1, 7, 99]) expect(buildBoard(seed).filter((t) => t === "tax")).toHaveLength(TAX_COUNT);
    expect(TAX_COUNT).toBe(10);
  });
  it("tax steals all saved items from the chosen player", () => {
    expect(stealItems([["turbo5"], ["bomb10", "shield"]], 0, 1)).toEqual([["turbo5", "bomb10", "shield"], []]);
  });
  it("saving an item costs its price", () => {
    expect(payFor([20, 0], 0, "shield")).toEqual([5, 0]);
    expect(payFor([20, 0], 1, "shield")).toBeNull();
  });
});
