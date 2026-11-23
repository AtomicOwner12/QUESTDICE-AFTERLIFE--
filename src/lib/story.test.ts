import { describe, it, expect } from "vitest";
import {
  WORLDS, CITIES, COMPANIONS, WEAPON_COUNT, UPGRADES, LEVEL_COUNT, weaponAt, levelPath, stepTo, enemyFoe, bossFoe,
  startBattle, battleTurn, playerStats, newSave, buyWeapon, buyUpgrade, upgradeWeapon, cityShop, acceptQuest,
  checkDefeatQuests, payQuest, trialPasses, clearLevel, loseBattle, cleanSave, hitDamage, isBossLevel, chestWeapon,
  MASTER_SWORD_ID, SWORD_BOSSES, DUNGEON_ITEMS, GUIDES, isTrueHero, pullMasterSword, takeDungeonItem, guideWalking, sayFarewell, DEFAULT_LOOK,
  type StorySave,
} from "./story";

const rich = (s: StorySave = newSave()) => ({ ...s, rubies: 1_000_000 });

describe("story world", () => {
  it("has nine named bosses in order, each with 3 stages", () => {
    expect(WORLDS.map((w) => w.boss.name)).toEqual(["Mr. Dixie", "Mrs. Dice", "Mr. Pentious", "Mrs. Rolls", "Mr. Overhaul", "Mrs. Magma", "Mr. Nimbus", "Mrs. Kraken", "Dicey"]);
    expect(LEVEL_COUNT).toBe(36);
    for (let w = 0; w < 9; w++) expect(bossFoe(w).stages).toHaveLength(3);
  });
  it("normal enemies have 2 stages and their own dialog", () => {
    const all = WORLDS.flatMap((w) => w.enemies);
    expect(new Set(all.map((e) => e.name)).size).toBe(all.length);
    expect(new Set(all.map((e) => e.intro)).size).toBe(all.length);
    for (let w = 0; w < 9; w++) for (let s = 0; s < 6; s++) {
      const f = enemyFoe(w, s);
      expect(f.stages).toHaveLength(2);
      expect(f.stages[1]!.line).not.toBe(f.stages[0]!.line);
    }
  });
  it("has 45 villages (five per world), each with its own name, shopkeeper and weapon selection", () => {
    expect(CITIES).toHaveLength(45);
    expect(new Set(CITIES.map((c) => c.name)).size).toBe(45);
    expect(new Set(CITIES.map((c) => c.keeper)).size).toBe(45);
    expect(new Set(CITIES.map((_, i) => cityShop(i).join())).size).toBe(45);
    // The classic dice paths still visit the three main villages of every world.
    const placed = Array.from({ length: LEVEL_COUNT }, (_, l) => levelPath(l).filter((t) => t.kind === "city").map((t) => t.ref)).flat();
    expect([...placed].sort((a, b) => a! - b!)).toEqual(CITIES.map((_, i) => i).filter((i) => i % 5 < 3));
  });
  it("every companion has a unique name and appears on a path", () => {
    expect(new Set(COMPANIONS.map((c) => c.name)).size).toBe(COMPANIONS.length);
    const placed = Array.from({ length: LEVEL_COUNT }, (_, l) => levelPath(l).filter((t) => t.kind === "npc").map((t) => t.ref)).flat();
    expect(placed).toHaveLength(COMPANIONS.length);
  });
  it("boss levels end with the boss, other levels have two enemies", () => {
    for (let l = 0; l < LEVEL_COUNT; l++) {
      const p = levelPath(l);
      if (isBossLevel(l)) expect(p.at(-1)?.kind).toBe("boss");
      else expect(p.filter((t) => t.kind === "enemy")).toHaveLength(2);
    }
  });
});

describe("weapons and upgrades", () => {
  it("has 1000 different weapons", () => {
    expect(WEAPON_COUNT).toBe(1000);
    const names = new Set(Array.from({ length: 1000 }, (_, i) => weaponAt(i).name));
    expect(names.size).toBe(1000);
    expect(weaponAt(MASTER_SWORD_ID).name).toBe("Master Dice Sword");
    expect(weaponAt(1001).name).toBe("Blütenherz-Klinge");
    expect(() => weaponAt(1002)).toThrow();
  });
  it("has 50 different upgrades", () => {
    expect(UPGRADES).toHaveLength(50);
    expect(new Set(UPGRADES.map((u) => u.name)).size).toBe(50);
  });
  it("buying costs rubies and fails without enough", () => {
    const s = { ...newSave(), rubies: 10 };
    const w = cityShop(0)[0]!;
    expect(buyWeapon(s, w).ok).toBe(false);
    const r = buyWeapon({ ...s, rubies: weaponAt(w).price }, w);
    expect(r.ok && r.save.rubies).toBe(0);
    expect(r.ok && r.save.weapon).toBe(w);
  });
  it("upgrades need the tier before and the right world", () => {
    expect(buyUpgrade(rich(), "vit-1").ok).toBe(false);
    const a = buyUpgrade(rich(), "vit-0");
    expect(a.ok && playerStats(a.save).maxHp).toBe(55);
    expect(a.ok && buyUpgrade(a.save, "vit-1").ok).toBe(false); // world 2 required
    expect(a.ok && buyUpgrade({ ...a.save, unlocked: 4 }, "vit-1").ok).toBe(true);
  });
  it("weapon upgrades raise power", () => {
    const r = upgradeWeapon(rich());
    expect(r.ok && playerStats(r.save).power).toBe(2);
  });
});

describe("path and battle", () => {
  it("moving stops on an enemy not beaten yet", () => {
    const p = levelPath(0);
    const enemy = p.findIndex((t) => t.kind === "enemy");
    expect(stepTo(p, enemy - 1, 6, [])).toBe(enemy);
    expect(stepTo(p, enemy - 1, 1, [])).toBe(enemy);
    expect(stepTo(p, p.length - 2, 6, [])).toBe(p.length - 1);
  });
  it("a higher roll deals more damage", () => {
    const st = playerStats(newSave());
    expect(hitDamage(5, st, false, false)).toBeGreaterThan(hitDamage(2, st, false, false));
  });
  it("normal enemies go through stage 2 before they are beaten", () => {
    const st = { ...playerStats(newSave()), power: 1000 };
    let b = startBattle(enemyFoe(0, 0), 40);
    b = battleTurn(b, st, 3, 1, [1, 1]).battle;
    expect(b.status).toBe("stage");
    expect(b.stage).toBe(1);
    b = battleTurn(b, st, 3, 1, [1, 1]).battle;
    expect(b.status).toBe("won");
  });
  it("bosses need three stages", () => {
    const st = { ...playerStats(newSave()), power: 10000 };
    let b = startBattle(bossFoe(0), 40);
    const seen: string[] = [];
    while (b.status !== "won") { b = battleTurn(b, st, 3, 1, [1, 1]).battle; seen.push(b.status); }
    expect(seen).toEqual(["stage", "stage", "won"]);
  });
  it("enemy damage can defeat the player", () => {
    const r = battleTurn(startBattle(bossFoe(4), 5), playerStats(newSave()), 1, 6, [1, 1]);
    expect(r.battle.status).toBe("lost");
  });
  it("losing costs 10% rubies and restarts the level", () => {
    const s = loseBattle({ ...newSave(), rubies: 100, hp: 3, run: { level: 0, pos: 9, done: [3] } });
    expect(s.rubies).toBe(90);
    expect(s.hp).toBe(40);
    expect(s.run).toEqual({ level: 0, pos: 0, done: [] });
  });
  it("clearing a level unlocks the next", () => {
    expect(clearLevel(newSave(), 0).unlocked).toBe(1);
  });
});

describe("companions", () => {
  it("defeat quests complete after enough wins", () => {
    let s = acceptQuest(newSave(), "kruemel");
    s = { ...s, kills: 1 };
    expect(checkDefeatQuests(s).joined).toEqual([]);
    const done = checkDefeatQuests({ ...s, kills: 2 });
    expect(done.joined).toEqual(["kruemel"]);
    expect(done.save.companion).toBe("kruemel");
    expect(playerStats(done.save).atk).toBe(2);
  });
  it("ruby quests cost the asked rubies", () => {
    const s = acceptQuest({ ...newSave(), rubies: 100 }, "karl");
    const r = payQuest(s, "karl");
    expect(r.ok && r.save.rubies).toBe(40);
    expect(r.ok && r.save.companions).toEqual(["karl"]);
    expect(payQuest({ ...s, rubies: 59 }, "karl").ok).toBe(false);
  });
  it("dice trials need the target sum", () => {
    expect(trialPasses("flimmer", 4, 4)).toBe(true);
    expect(trialPasses("flimmer", 3, 4)).toBe(false);
  });
});

describe("save", () => {
  it("cleans broken saves", () => {
    expect(cleanSave("nope")).toEqual(newSave());
    const s = cleanSave({ rubies: -5, weapon: 999, weapons: [5, 5000], upgrades: ["vit-0", "fake"], unlocked: 99 });
    expect(s.rubies).toBe(0);
    expect(s.weapon).toBe(0);
    expect(s.weapons).toEqual([0, 5]);
    expect(s.upgrades).toEqual(["vit-0"]);
    expect(s.unlocked).toBe(LEVEL_COUNT - 1);
  });
});

describe("Master Dice Sword", () => {
  const heroAfter = (bosses: readonly number[]) => ({ ...newSave(), cleared: [...bosses], unlocked: 16 });
  it("only the true hero who beat the first four dungeon bosses can pull it", () => {
    expect(SWORD_BOSSES).toEqual([3, 7, 11, 15]);
    expect(pullMasterSword(heroAfter([3, 7, 11])).ok).toBe(false);
    expect(isTrueHero(heroAfter([3, 7, 11, 15]))).toBe(true);
    const r = pullMasterSword(heroAfter([3, 7, 11, 15]));
    expect(r.ok && r.save.weapon).toBe(MASTER_SWORD_ID);
    expect(r.ok && pullMasterSword(r.save).ok).toBe(false);
  });
  it("is the strongest blade and a cheated save cannot keep it", () => {
    const r = pullMasterSword(heroAfter([3, 7, 11, 15]));
    expect(r.ok && playerStats(r.save).power).toBeGreaterThan(weaponAt(999).power);
    expect(cleanSave({ weapons: [0, MASTER_SWORD_ID], weapon: MASTER_SWORD_ID }).weapons).not.toContain(MASTER_SWORD_ID);
    expect(r.ok && cleanSave(JSON.parse(JSON.stringify(r.save))).weapon).toBe(MASTER_SWORD_ID);
  });
});

describe("dungeon items and guides", () => {
  it("every world's big dungeon hides its own item", () => {
    expect(DUNGEON_ITEMS).toHaveLength(WORLDS.length);
    expect(new Set(DUNGEON_ITEMS.map((i) => i.name)).size).toBe(WORLDS.length);
  });
  it("an item gives its bonus once and stays after loading", () => {
    const it0 = DUNGEON_ITEMS[0]!;
    const s = takeDungeonItem(newSave(), 0);
    expect(playerStats(s)[it0.stat]).toBeCloseTo(playerStats(newSave())[it0.stat] + it0.value);
    expect(takeDungeonItem(s, 0)).toBe(s);
    expect(cleanSave(JSON.parse(JSON.stringify(s))).dungeonItems).toEqual([0]);
  });
  it("eight guides, one per world before the last, walk with you only after you helped them, until their world is saved", () => {
    expect(GUIDES.map((g) => g.world)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    const fresh = newSave();
    expect(guideWalking(fresh, 0)).toBe(false);
    expect(sayFarewell(clearLevel(fresh, 3), 0).farewells).toEqual([]);
    const s = { ...fresh, guideQuests: [0], guideFinds: [0], guidesJoined: [0] };
    expect(guideWalking(s, 0)).toBe(true);
    const saved = clearLevel(s, 3);
    expect(guideWalking(saved, 0)).toBe(false);
    expect(guideWalking(s, 8)).toBe(false);
    expect(sayFarewell(saved, 0).farewells).toEqual([0]);
  });
  it("chests in the new worlds still drop real weapons", () => {
    for (let w = 0; w < 9; w++) expect(() => weaponAt(chestWeapon(w, 0.99))).not.toThrow();
  });
  it("a new hero starts as green-cap Link: gold hair, blue eyes, long elf ears, green tunic and pointy cap", () => {
    expect(DEFAULT_LOOK.ears).toBe(0);
    expect(DEFAULT_LOOK.hair).toBe(0);
    expect(DEFAULT_LOOK.eyes).toBe(1);
    expect(DEFAULT_LOOK.outfit).toBe(0);
    expect(DEFAULT_LOOK.head).toBe(1);
  });
});
