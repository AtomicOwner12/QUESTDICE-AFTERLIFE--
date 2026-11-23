import { describe, expect, it } from "vitest";
import { COIN_PACKS, MIN_PRICE, START_BONUS, CREATOR_BONUS_SALES, CREATOR_MONTHLY_BONUS, validPrice, creatorBonusUnlocked, cleanSkin, cleanSoldMap, marketError } from "./marketplace";

describe("marketplace rules", () => {
  it("sells Questcoin packs at 3/9/20 CHF for 360/1030/3000 coins", () => {
    expect(COIN_PACKS.map((p) => [p.chf, p.coins])).toEqual([[3, 360], [9, 1030], [20, 3000]]);
  });
  it("gives new players a 360 Questcoin start bonus", () => expect(START_BONUS).toBe(360));
  it("does not allow prices below 180 Questcoins", () => {
    expect(MIN_PRICE).toBe(180);
    expect(validPrice(179)).toBe(false);
    expect(validPrice(180)).toBe(true);
  });
  it("allows prices well over 2000 Questcoins", () => expect(validPrice(2500)).toBe(true));
  it("lets 360 Questcoins buy one or two items at the minimum price", () => {
    expect(Math.floor(COIN_PACKS[0].coins / MIN_PRICE)).toBe(2);
  });
  it("gives creators 500 Questcoins per month from 1000 sales", () => {
    expect(CREATOR_BONUS_SALES).toBe(1000);
    expect(CREATOR_MONTHLY_BONUS).toBe(500);
    expect(creatorBonusUnlocked(999)).toBe(false);
    expect(creatorBonusUnlocked(1000)).toBe(true);
  });
  it("strips unknown skin parts", () => {
    const s = cleanSkin({ skin: "nope", look: { hat: "💣", aura: "fire", tint: 999, fx: 1 } });
    expect(s.look.hat).toBe("");
    expect(s.look.aura).toBe("fire");
    expect(s.look.tint).toBeUndefined();
    expect(s.look.fx).toBe(1);
  });
  it("cleans bought maps", () => {
    const m = cleanSoldMap({ title: "X", tiles: ["task", "custom-5", 3], platforms: [], dice: 9 });
    expect(m.dice).toBe(3);
    expect(m.tiles.slice(0, 3)).toEqual(["task", "empty", "empty"]);
  });
  it("explains database errors in German", () => expect(marketError("ERROR: not_enough_coins")).toBe("Du hast nicht genug Questcoins."));
});
