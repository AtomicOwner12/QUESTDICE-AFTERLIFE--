import { describe, expect, it } from "vitest";
import { cleanSave, newSave, LOOK_COUNTS, playerStats, receiveFloriaBlade, weaponAt, FLORIA_BLADE_ID, MASTER_SWORD_ID, type StorySave } from "./story";
import { worldMap, dungeonMap } from "./story-terrain";
import { elfPixels, ELF_W, ELF_H, elfRects } from "./pixel-elf";
import {
  WORLD_W, WORLD_H, DUNGEON_W, DUNGEON_H, HOME_PRICE, MAX_CHILDREN, DUNGEON_ENTRY, DUNGEON_FOES, DUNGEON_CHESTS, GATE_ROWS, DATABLES,
  lostWoodsEntrance, LOST_WOODS_PATH, lostWoodsStep, lostWoodsHint, inSwordGlade,
  canWalkWorld, worldPoints, nearbyPoint, canWalkDungeon, startDungeon, gateOpen, roomLevel, dungeonRoomAt, isDungeonExit,
  findHeartRose, buyHome, giveGift, goOnDate, propose, welcomeChild, relationOf, worldSpawn,
  openSecretHouse, setPartnerFollows, partnerWalking, SECRET_CODE, secretCottage, SECRET_DATABLE, worldGroundOpen,
  guideSpot, guideStep, guidePoints, askGuide, pickGuideItem, guideJoins, canWalkSave, savePoints,
} from "./story-world";

/** Cells reachable from a start by walking (4 directions). */
function reach(open: (x: number, y: number) => boolean, start: { x: number; y: number }, w: number, h: number) {
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen.has(k) && open(nx, ny)) { seen.add(k); queue.push({ x: nx, y: ny }); }
    }
  }
  return seen;
}

describe("big open worlds", () => {
  it("every world is one huge 480x360 map", () => {
    for (let w = 0; w < 9; w++) {
      const m = worldMap(w);
      expect([m.w, m.h]).toEqual([WORLD_W, WORLD_H]);
      expect(m.cells).toHaveLength(WORLD_W * WORLD_H);
    }
    expect([WORLD_W, WORLD_H]).toEqual([480, 360]);
  });
  it("has one big dungeon and five villages per world, and a datable elf in the first five", () => {
    for (let w = 0; w < 9; w++) {
      const pts = worldPoints(w);
      expect(pts.filter((p) => p.kind === "dungeon")).toHaveLength(1);
      expect(pts.filter((p) => p.kind === "city").map((p) => p.ref)).toEqual([0, 1, 2, 3, 4].map((k) => w * 5 + k));
      expect(pts.filter((p) => p.kind === "romance")).toHaveLength(w < 5 ? 1 : 0);
    }
  });
  it("the Lost Woods entrance exists only in the first world and the sword is no longer in the open", () => {
    for (let w = 0; w < 9; w++) expect(worldPoints(w).filter((p) => p.kind === "woods")).toHaveLength(w === 0 ? 1 : 0);
    expect(worldPoints(0).find((p) => p.kind === "woods")).toMatchObject({ x: lostWoodsEntrance().x, y: lostWoodsEntrance().y });
    expect(worldPoints(0).some((p) => (p.kind as string) === "sword")).toBe(false);
  });
  it("only the right path through the Lost Woods reaches the sword glade", () => {
    let stage = 0;
    for (const d of LOST_WOODS_PATH) { expect(lostWoodsHint(stage)).toBe(d); stage = lostWoodsStep(stage, d); }
    expect(inSwordGlade(stage)).toBe(true);
    expect(lostWoodsHint(stage)).toBe(null);
    expect(lostWoodsStep(1, "S")).toBe(0);
    expect(LOST_WOODS_PATH[0]).not.toBe("S");
    expect(inSwordGlade(LOST_WOODS_PATH.length - 1)).toBe(false);
  });
  it("every place can be reached on foot from the start of its world", () => {
    for (let w = 0; w < 9; w++) {
      const start = worldSpawn(w);
      expect(canWalkWorld(w, start.x, start.y)).toBe(true);
      const seen = reach((x, y) => canWalkWorld(w, x, y), start, WORLD_W, WORLD_H);
      for (const p of worldPoints(w)) {
        const reachable = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => seen.has(`${p.x + dx},${p.y + dy}`));
        expect(reachable, `world ${w} ${p.id}`).toBe(true);
      }
    }
  });
  it("standing next to a dungeon door lets you use it", () => {
    const door = worldPoints(0).find((p) => p.kind === "dungeon")!;
    expect(nearbyPoint(0, door.x, door.y + 1)?.id).toBe(door.id);
  });
  it("you cannot leave the map", () => {
    expect(canWalkWorld(0, -1, 4)).toBe(false);
    expect(canWalkWorld(0, WORLD_W, 4)).toBe(false);
    expect(canWalkWorld(0, 4, WORLD_H)).toBe(false);
  });
});

describe("dungeons", () => {
  const allCleared = (world: number) => ({ cleared: [0, 1, 2, 3].map((r) => roomLevel(world, r)), dungeonItems: [world] });
  it("every dungeon is 48x80 and its enemies, chests and exit are reachable once the gates are open", () => {
    expect([DUNGEON_W, DUNGEON_H]).toEqual([48, 80]);
    for (let w = 0; w < 9; w++) {
      const m = dungeonMap(w);
      expect(m.cells).toHaveLength(DUNGEON_W * DUNGEON_H);
      const open = allCleared(w);
      const seen = reach((x, y) => canWalkDungeon(open, w, x, y), DUNGEON_ENTRY, DUNGEON_W, DUNGEON_H);
      const near = (x: number, y: number) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx!},${y + dy!}`));
      for (const f of DUNGEON_FOES) expect(near(f.x, f.y), `world ${w} foe ${f.index}`).toBe(true);
      for (const c of DUNGEON_CHESTS) expect(near(c.x, c.y), `world ${w} chest ${c.index}`).toBe(true);
      expect([...seen].some((k) => isDungeonExit(Number(k.split(",")[1])))).toBe(true);
    }
  });
  it("four rooms: three fight rooms and a boss room at the top", () => {
    expect(DUNGEON_FOES.filter((f) => f.boss)).toHaveLength(1);
    expect(DUNGEON_FOES.find((f) => f.boss)!.room).toBe(3);
    for (const f of DUNGEON_FOES) expect(dungeonRoomAt(f.y)).toBe(f.room);
    expect(startDungeon(2)).toMatchObject({ level: roomLevel(2, 0), ...DUNGEON_ENTRY, defeated: [] });
  });
  it("each gate opens once its room is cleared; the boss gate also needs the dungeon item", () => {
    const none = { cleared: [] as number[], dungeonItems: [] as number[] };
    expect(gateOpen(none, 0, 0)).toBe(false);
    expect(gateOpen({ ...none, cleared: [roomLevel(0, 0)] }, 0, 0)).toBe(true);
    const twoRooms = { cleared: [0, 1, 2].map((r) => roomLevel(0, r)), dungeonItems: [] as number[] };
    expect(gateOpen(twoRooms, 0, 1)).toBe(true);
    expect(gateOpen(twoRooms, 0, 2)).toBe(false);
    expect(gateOpen({ ...twoRooms, dungeonItems: [0] }, 0, 2)).toBe(true);
    expect(canWalkDungeon(none, 0, 24, GATE_ROWS[0])).toBe(false);
  });
});

describe("hero look and saves", () => {
  it("old saves standing on a blocked spot move back to the world start", () => {
    const s = cleanSave({ ...newSave(), world: 2, worldPos: { x: 0, y: 0 }, heroLook: { skin: 3, hair: 5, outfit: 5, style: 3 }, heroLookV: 2 });
    expect(s.worldPos).toEqual(worldSpawn(2));
    expect(s.heroLook.hair).toBe(5);
    expect(s.heroLook.body).toBe(0);
  });
  it("broken look values fall back instead of crashing", () => {
    const s = cleanSave({ heroLook: { skin: 99, hair: -1, eyes: 2.5, head: 4 }, heroLookV: 2 });
    expect(s.heroLook.skin).toBeLessThan(LOOK_COUNTS.skin);
    expect(s.heroLook.head).toBe(4);
  });
  it("every pixel elf variant is a clean 16x24 sprite", () => {
    for (let style = 0; style < LOOK_COUNTS.style; style++) for (let head = 0; head < LOOK_COUNTS.head; head++) for (let body = 0; body < 2; body++) for (let dir = 0; dir < 4; dir++) {
      const rows = elfPixels({ skin: 0, hair: 0, outfit: 0, eyes: 0, ears: 0, style, head, body }, dir as 0, (dir % 2) as 0);
      expect(rows).toHaveLength(ELF_H);
      for (const r of rows) expect(r).toHaveLength(ELF_W);
    }
    expect(elfRects(DATABLES[0]!.look, 0).every((r) => r.fill !== "#ff00ff")).toBe(true);
  });
});

describe("hidden Heartrose life", () => {
  const married = (): StorySave => ({ ...findHeartRose(newSave()), rubies: 1000, homeOwned: true, relationships: { liora: { affection: 10, dates: 2, married: true, child: false } } });
  it("dating stays secret until the rose is found", () => {
    const s = { ...newSave(), rubies: 1000 };
    expect(giveGift(s, "liora").ok).toBe(false);
    expect(giveGift(findHeartRose(s), "liora").ok).toBe(true);
  });
  it("five adult elves can be dated, one in every world", () => {
    expect(DATABLES.map((d) => d.world)).toEqual([0, 1, 2, 3, 4]);
  });
  it("a house costs exactly 300 rubies", () => {
    const s = { ...newSave(), rubies: HOME_PRICE };
    const r = buyHome(s);
    expect(r.ok && r.save.rubies).toBe(0);
    expect(r.ok && r.save.homeOwned).toBe(true);
    expect(buyHome(newSave()).ok).toBe(false);
  });
  it("marriage needs a house, eight hearts and two dates", () => {
    let s = { ...findHeartRose(newSave()), rubies: 1000, homeOwned: true };
    expect(propose(s, "liora").ok).toBe(false);
    for (let i = 0; i < 6; i++) { const r = giveGift(s, "liora"); if (r.ok) s = r.save; }
    expect(propose(s, "liora").ok).toBe(false);
    for (let i = 0; i < 2; i++) { const r = goOnDate(s, "liora"); if (r.ok) s = r.save; }
    const m = propose(s, "liora");
    expect(m.ok && relationOf(m.save, "liora").married).toBe(true);
  });
  it("the first child arrives after marriage and a third date, and needs a name", () => {
    let s = married();
    expect(welcomeChild(s, "liora", "Mira").ok).toBe(false);
    const date = goOnDate(s, "liora");
    if (date.ok) s = date.save;
    expect(welcomeChild(s, "liora", "M").ok).toBe(false);
    const child = welcomeChild(s, "liora", "Mira");
    expect(child.ok && child.save.children.map((c) => c.name)).toEqual(["Mira"]);
  });
  it("every further child needs one more date, up to six children", () => {
    let s: StorySave = { ...married(), relationships: { liora: { affection: 10, dates: 3, married: true, child: false } } };
    const first = welcomeChild(s, "liora", "Mira");
    if (first.ok) s = first.save;
    expect(welcomeChild(s, "liora", "Tavi").ok).toBe(false);
    s = { ...s, relationships: { liora: { ...relationOf(s, "liora"), dates: 99 } } };
    for (let i = 0; i < 10; i++) { const r = welcomeChild(s, "liora", `Kind${i}`); if (r.ok) s = r.save; }
    expect(s.children).toHaveLength(MAX_CHILDREN);
  });
  it("children survive saving and loading", () => {
    const s = { ...married(), children: [{ name: "Mira", parent: "liora", look: DATABLES[0]!.look }] };
    expect(cleanSave(JSON.parse(JSON.stringify(s))).children.map((c) => c.name)).toEqual(["Mira"]);
  });
});

describe("secret flower cottage", () => {
  const id = SECRET_DATABLE.id;
  const opened = (): StorySave => { const r = openSecretHouse({ ...newSave(), rubies: 1000 }, "201356"); if (!r.ok) throw new Error(r.error); return r.save; };
  it("opens only with the code 201356", () => {
    expect(SECRET_CODE).toBe("201356");
    expect(openSecretHouse(newSave(), "123456").ok).toBe(false);
    expect(openSecretHouse(newSave(), "20135").ok).toBe(false);
    expect(opened().secretHouse).toBe(true);
  });
  it("hides in the first world and can be reached on foot", () => {
    const p = worldPoints(0).find((q) => q.kind === "secret")!;
    expect(p).toMatchObject({ x: secretCottage().x, y: secretCottage().y });
    expect(worldPoints(1).some((q) => q.kind === "secret")).toBe(false);
    const open = reach((x, y) => canWalkWorld(0, x, y), worldSpawn(0), WORLD_W, WORLD_H);
    const doorstep = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]].some(([dx, dy]) => open.has(`${p.x + dx!},${p.y + dy!}`));
    expect(worldGroundOpen(0, p.x, p.y) && doorstep).toBe(true);
  });
  it("Floria can only be courted after the code, not through the Heartrose", () => {
    const s = { ...findHeartRose(newSave()), rubies: 1000 };
    expect(giveGift(s, id).ok).toBe(false);
    expect(giveGift(opened(), id).ok).toBe(true);
  });
  it("her cottage counts as a home: marriage without buying a house", () => {
    let s = opened();
    for (let i = 0; i < 6; i++) { const r = giveGift(s, id); if (r.ok) s = r.save; }
    for (let i = 0; i < 2; i++) { const r = goOnDate(s, id); if (r.ok) s = r.save; }
    const m = propose(s, id);
    expect(m.ok && relationOf(m.save, id).married).toBe(true);
    expect(m.ok && relationOf(cleanSave(JSON.parse(JSON.stringify(m.save))), id).married).toBe(true);
  });
  it("children with Floria follow the usual date rule", () => {
    const s: StorySave = { ...opened(), relationships: { [id]: { affection: 10, dates: 3, married: true, child: false } } };
    const kid = welcomeChild(s, id, "Rosa");
    expect(kid.ok && kid.save.children.map((c) => c.name)).toEqual(["Rosa"]);
  });
  it("she follows you once she has 2 hearts, and that survives loading", () => {
    const s = opened();
    expect(setPartnerFollows(s, true).ok).toBe(false);
    const liked: StorySave = { ...s, relationships: { [id]: { affection: 2, dates: 0, married: false, child: false } } };
    const r = setPartnerFollows(liked, true);
    expect(r.ok && partnerWalking(r.save)).toBe(true);
    expect(r.ok && partnerWalking(cleanSave(JSON.parse(JSON.stringify(r.save))))).toBe(true);
    expect(partnerWalking(cleanSave({ ...newSave(), partnerFollows: true }))).toBe(false);
  });
  it("Floria gives her SUPER OP blade only after the code and 2 hearts", () => {
    expect(receiveFloriaBlade({ ...newSave(), relationships: { [id]: { affection: 10, dates: 0, married: false, child: false } } }).ok).toBe(false);
    expect(receiveFloriaBlade(opened()).ok).toBe(false);
    const liked: StorySave = { ...opened(), relationships: { [id]: { affection: 2, dates: 0, married: false, child: false } } };
    const r = receiveFloriaBlade(liked);
    expect(r.ok && r.save.weapon).toBe(FLORIA_BLADE_ID);
    expect(r.ok && receiveFloriaBlade(r.save).ok).toBe(false);
  });
  it("the Master Dice Sword always beats her blade", () => {
    expect(weaponAt(MASTER_SWORD_ID).power).toBeGreaterThan(weaponAt(FLORIA_BLADE_ID).power);
    const base: StorySave = { ...opened(), relationships: { [id]: { affection: 2, dates: 0, married: false, child: false } } };
    const a = playerStats({ ...base, weapons: [0, MASTER_SWORD_ID], weapon: MASTER_SWORD_ID }), b = playerStats({ ...base, weapons: [0, FLORIA_BLADE_ID], weapon: FLORIA_BLADE_ID });
    for (const k of ["maxHp", "atk", "def", "crit", "dodge", "leech", "regen", "greed", "power"] as const) expect(a[k]).toBeGreaterThanOrEqual(b[k]);
    const liked: StorySave = { ...opened(), relationships: { [id]: { affection: 2, dates: 0, married: false, child: false } } };
    const r = receiveFloriaBlade(liked);
    if (!r.ok) throw new Error(r.error);
    expect(playerStats(r.save).maxHp - playerStats(liked).maxHp).toBe(200);
    expect(r.save.hp).toBe(playerStats(r.save).maxHp);
  });
  it("loading keeps the blade only when it was earned", () => {
    const liked: StorySave = { ...opened(), relationships: { [id]: { affection: 2, dates: 0, married: false, child: false } } };
    const r = receiveFloriaBlade(liked);
    if (!r.ok) throw new Error(r.error);
    const loaded = cleanSave(JSON.parse(JSON.stringify(r.save)));
    expect(loaded.weapon).toBe(FLORIA_BLADE_ID);
    expect(cleanSave({ ...newSave(), weapons: [0, FLORIA_BLADE_ID], weapon: FLORIA_BLADE_ID }).weapons).not.toContain(FLORIA_BLADE_ID);
  });
});

describe("guides wait in their villages until you help them", () => {
  it("every guide and lost item stands on open ground beside a reachable spot, away from other places", () => {
    for (let w = 0; w < 8; w++) {
      const spot = guideSpot(w);
      const others = worldPoints(w);
      const open = reach((x, y) => canWalkWorld(w, x, y), worldSpawn(w), WORLD_W, WORLD_H);
      for (const [x, y] of [spot.home, spot.lost]) {
        expect(worldGroundOpen(w, x, y)).toBe(true);
        expect(others.some((p) => p.x === x && p.y === y)).toBe(false);
        const beside = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => open.has(`${x + dx},${y + dy}`));
        expect(beside).toBe(true);
      }
      // The guide waits close to the first village of their world.
      const village = others.find((p) => p.kind === "city" && p.ref === w * 5)!;
      expect(Math.abs(village.x - spot.home[0]) + Math.abs(village.y - spot.home[1])).toBeLessThanOrEqual(8);
    }
  });
  it("talk → find the item → bring it back → the guide walks with you", () => {
    let s = newSave();
    expect(guideStep(s, 0)).toBe("ask");
    expect(guidePoints(s, 0).map((p) => p.kind)).toEqual(["guide"]);
    expect(guideJoins(s, 0).ok).toBe(false);
    s = askGuide(s, 0);
    expect(guideStep(s, 0)).toBe("search");
    expect(guidePoints(s, 0).map((p) => p.kind)).toEqual(["guide", "lost"]);
    const [lx, ly] = guideSpot(0).lost;
    expect(pickGuideItem(s, 0).ok).toBe(false); // too far away
    expect(canWalkSave(s, 0, lx, ly)).toBe(false);
    const r = pickGuideItem({ ...s, worldPos: { x: lx - 1, y: ly } }, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.save;
    expect(guideStep(s, 0)).toBe("return");
    expect(guidePoints(s, 0).map((p) => p.kind)).toEqual(["guide"]);
    const j = guideJoins(s, 0);
    expect(j.ok).toBe(true);
    if (!j.ok) return;
    expect(guideStep(j.save, 0)).toBe("walking");
    expect(guidePoints(j.save, 0)).toEqual([]);
    const [hx, hy] = guideSpot(0).home;
    expect(canWalkSave(j.save, 0, hx, hy)).toBe(canWalkWorld(0, hx, hy));
    expect(savePoints(j.save, 0)).toEqual(worldPoints(0));
  });
  it("a loaded save can never skip a step of the favour", () => {
    expect(cleanSave({ ...newSave(), guidesJoined: [0, 1] }).guidesJoined).toEqual([]);
    expect(cleanSave({ ...newSave(), guideQuests: [0], guideFinds: [0], guidesJoined: [0] }).guidesJoined).toEqual([0]);
    expect(cleanSave({ ...newSave(), guideQuests: [8] }).guideQuests).toEqual([]);
  });
});
