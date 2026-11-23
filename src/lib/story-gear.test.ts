import { describe, expect, it } from "vitest";
import {
  newSave, cleanSave, equipWeapon, equipTool, unequipTool, equippedTool, spendBomb, buyBombs, bombPackPrice, heroDown, takeDungeonItem,
  BOMB_PACK, MAX_BOMBS, SHOP_BOMB, DUNGEON_ITEMS, MASTER_SWORD_ID, type StorySave,
} from "./story";
import { worldMap, terrainOpen } from "./story-terrain";
import { worldSpawn, startDungeon, dungeonDoorStep, canWalkWorld, worldPoints, dungeonProgress, roomLevel } from "./story-world";

const rich = (): StorySave => ({ ...newSave(), rubies: 10_000, weapons: [0, 5], dungeonItems: [0, 3] });

describe("two equipment slots", () => {
  it("the sword slot only takes weapons you own", () => {
    const s = rich();
    const r = equipWeapon(s, 5);
    expect(r.ok && r.save.weapon).toBe(5);
    expect(equipWeapon(s, 6).ok).toBe(false);
    expect(equipWeapon(s, MASTER_SWORD_ID).ok).toBe(false);
    expect(equipWeapon(s, 2000).ok).toBe(false);
  });
  it("the item slot only takes a found dungeon item or bombs", () => {
    const s = rich();
    const r = equipTool(s, 3);
    expect(r.ok && r.save.tool).toBe(3);
    expect(r.ok && equippedTool(r.save)).toBe(DUNGEON_ITEMS[3]);
    expect(equipTool(s, 1).ok).toBe(false);
    expect(equipTool(s, 42).ok).toBe(false);
    expect(equipTool(s, "bombs").ok).toBe(false);
    const b = equipTool({ ...s, bombs: 2 }, "bombs");
    expect(b.ok && equippedTool(b.save)).toBe(SHOP_BOMB);
  });
  it("swapping one slot never changes the other", () => {
    const a = equipTool(rich(), 0);
    if (!a.ok) throw new Error();
    const b = equipWeapon(a.save, 5);
    expect(b.ok && b.save.tool).toBe(0);
    const c = equipTool({ ...(b.ok ? b.save : a.save), bombs: 3 }, "bombs");
    expect(c.ok && c.save.weapon).toBe(5);
  });
  it("an emptied item slot stays empty after loading", () => {
    const s = unequipTool(rich());
    expect(equippedTool(s)).toBeNull();
    expect(cleanSave(JSON.parse(JSON.stringify(s))).tool).toBeNull();
    expect(cleanSave(JSON.parse(JSON.stringify({ ...s, tool: "bombs", bombs: 4 }))).tool).toBe("bombs");
  });
  it("a new dungeon item goes straight into the item slot", () => {
    expect(takeDungeonItem(newSave(), 0).tool).toBe(0);
  });
});

describe("bombs", () => {
  it("come in packs of five from the village shop, up to 30", () => {
    const r = buyBombs({ ...newSave(), rubies: 100 }, 0);
    expect(r.ok && r.save.bombs).toBe(BOMB_PACK);
    expect(r.ok && r.save.rubies).toBe(100 - bombPackPrice(0));
    expect(r.ok && r.save.tool).toBe("bombs");
    expect(buyBombs({ ...newSave(), rubies: 0 }, 0).ok).toBe(false);
    expect(buyBombs({ ...newSave(), rubies: 1e6, bombs: MAX_BOMBS }, 0).ok).toBe(false);
    const near = buyBombs({ ...newSave(), rubies: 1e6, bombs: MAX_BOMBS - 2 }, 0);
    expect(near.ok && near.save.bombs).toBe(MAX_BOMBS);
  });
  it("every throw uses one; with none left the item button does nothing", () => {
    let s: StorySave = { ...newSave(), bombs: 2, tool: "bombs" };
    s = spendBomb(s); expect(s.bombs).toBe(1);
    s = spendBomb(s); expect(s.bombs).toBe(0);
    expect(equippedTool(s)).toBeNull();
    expect(spendBomb(s).bombs).toBe(0);
    // A dungeon item in the slot never uses bombs.
    expect(spendBomb({ ...rich(), bombs: 3, tool: 0 }).bombs).toBe(3);
  });
  it("cannot be cheated past the limit in a save", () => {
    expect(cleanSave({ bombs: 999 }).bombs).toBe(MAX_BOMBS);
    expect(cleanSave({ bombs: -5 }).bombs).toBe(0);
  });
});

describe("being beaten in real-time combat", () => {
  it("in the open world you wake up in the start village with full life and 10 % fewer rubies", () => {
    const s = heroDown({ ...newSave(), world: 0, worldPos: { x: 30, y: 30 }, hp: 0, rubies: 200 });
    expect(s.worldPos).toEqual(worldSpawn(0));
    expect(s.hp).toBe(40);
    expect(s.rubies).toBe(180);
  });
  it("in a dungeon you stand outside again and keep the rooms you cleared", () => {
    const outside = dungeonDoorStep(1);
    const s0: StorySave = { ...newSave(), unlocked: 5, world: 1, worldPos: outside, dungeon: startDungeon(1), cleared: [roomLevel(1, 0)], rubies: 100 };
    const s = heroDown(s0);
    expect(s.dungeon).toBeNull();
    expect(s.worldPos).toEqual(outside);
    expect(dungeonProgress(s, 1)).toBe(1);
  });
});

describe("villages and dungeon doors", () => {
  it("every world has five villages that do not overlap and stay out of the river", () => {
    for (let w = 0; w < 9; w++) {
      const shops = worldMap(w).structures.filter((s) => s.kind === "shop");
      expect(shops).toHaveLength(5);
      for (let i = 0; i < shops.length; i++) for (let j = i + 1; j < shops.length; j++) {
        const a = shops[i]!, b = shops[j]!;
        expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThan(20);
      }
    }
  });
  it("you can stand in front of every dungeon door, and that spot is where the world map sends you", () => {
    for (let w = 0; w < 9; w++) {
      const step = dungeonDoorStep(w);
      expect(terrainOpen(worldMap(w).cells[step.y * worldMap(w).w + step.x])).toBe(true);
      expect(canWalkWorld(w, step.x, step.y)).toBe(true);
      const door = worldPoints(w).find((p) => p.kind === "dungeon")!;
      expect(Math.abs(door.x - step.x) + Math.abs(door.y - step.y)).toBe(1);
    }
  });
});
