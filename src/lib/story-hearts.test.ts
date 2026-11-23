import { describe, expect, it } from "vitest";
import {
  newSave, cleanSave, playerStats, heroHearts, dungeonHeartEarned, piecesTowardHeart, enemyFoe, clearLevel,
  START_HEARTS, MAX_HEARTS, HEART_HP, BASE_HP, LEVELS_PER_WORLD, WORLDS, type StorySave,
} from "./story";
import {
  worldHouses, houseAtDoor, houseRoom, roomWalkable, openHouseChest, pieceChest, pieceSpot, pieceAt, takePiece, platePuzzle, plateAt,
  stepPlate, PLATES, PLATES_SOLVED, PIECE_FIELD, PIECE_CHEST, PIECE_PUZZLE,
} from "./story-houses";
import { canWalkWorld } from "./story-world";
import { heartFills, swordDamage, foeDamage } from "./story-combat";

const beatBoss = (s: StorySave, w: number) => clearLevel(s, w * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1);
const allPieces = (s: StorySave, w: number) => [PIECE_FIELD, PIECE_CHEST, PIECE_PUZZLE].reduce((a, p) => takePiece(a, w, p), s);

describe("hearts", () => {
  it("you start with 3 hearts and can reach 20 at most (3 + 8 dungeons + 9 piece containers)", () => {
    expect(heroHearts(newSave())).toBe(3);
    expect(START_HEARTS).toBe(3);
    expect(MAX_HEARTS).toBe(20);
    let s = newSave();
    for (let w = 0; w < WORLDS.length; w++) s = beatBoss(allPieces(s, w), w);
    expect(heroHearts(s)).toBe(20);
    expect(playerStats(s).maxHp).toBe(BASE_HP + 17 * HEART_HP);
  });
  it("each of the first 8 dungeon bosses gives 1 full heart container, without any pieces", () => {
    let s = newSave();
    for (let w = 0; w < 8; w++) { s = beatBoss(s, w); expect(dungeonHeartEarned(s, w)).toBe(true); expect(heroHearts(s)).toBe(4 + w); }
    expect(heroHearts(s)).toBe(11);
    expect(playerStats(beatBoss(newSave(), 0)).maxHp).toBe(BASE_HP + HEART_HP);
  });
  it("the final boss (world 9) gives no heart container", () => {
    const s = beatBoss(newSave(), 8);
    expect(dungeonHeartEarned(s, 8)).toBe(false);
    expect(heroHearts(s)).toBe(3);
  });
  it("every 3 heart pieces make 1 heart container, even from different worlds", () => {
    const two = takePiece(takePiece(newSave(), 0, PIECE_FIELD), 1, PIECE_CHEST);
    expect(heroHearts(two)).toBe(3);
    expect(piecesTowardHeart(two)).toBe(2);
    const three = takePiece(two, 4, PIECE_PUZZLE);
    expect(heroHearts(three)).toBe(4);
    expect(piecesTowardHeart(three)).toBe(0);
    expect(heroHearts(allPieces(newSave(), 0))).toBe(4);
  });
  it("all 27 pieces in the 9 worlds make exactly 9 heart containers", () => {
    let s = newSave();
    for (let w = 0; w < WORLDS.length; w++) s = allPieces(s, w);
    expect(s.hearts.length).toBe(27);
    expect(heroHearts(s)).toBe(12);
  });
  it("a piece counts only once and broken saves lose fake pieces", () => {
    const s = takePiece(takePiece(newSave(), 2, PIECE_FIELD), 2, PIECE_FIELD);
    expect(s.hearts).toEqual(["2:0"]);
    expect(cleanSave({ ...newSave(), hearts: ["0:0", "0:5", "9:1", "x", 3] }).hearts).toEqual(["0:0"]);
  });
  it("the life meter fills hearts in quarters", () => {
    expect(heartFills(40, 40, 3)).toEqual([1, 1, 1]);
    expect(heartFills(20, 40, 3)).toEqual([1, 0.5, 0]);
    expect(heartFills(0, 40, 3)).toEqual([0, 0, 0]);
    expect(heartFills(1, 40, 3)).toEqual([0.25, 0, 0]);
  });
});

describe("heart pieces in every world", () => {
  for (let w = 0; w < WORLDS.length; w++) it(`world ${w + 1}: hidden piece, chest piece and plate riddle are reachable`, () => {
    const spot = pieceSpot(w);
    expect(canWalkWorld(w, spot.x, spot.y)).toBe(true);
    expect(pieceAt(newSave(), w, spot.x, spot.y)).toBe(true);
    expect(pieceAt(takePiece(newSave(), w, PIECE_FIELD), w, spot.x, spot.y)).toBe(false);
    const p = platePuzzle(w);
    for (let i = 0; i < PLATES; i++) { expect(canWalkWorld(w, p.x + i, p.y)).toBe(true); expect(plateAt(w, p.x + i, p.y)).toBe(i); }
    expect(plateAt(w, spot.x, spot.y)).toBe(-1);
    const c = pieceChest(w);
    expect(worldHouses(w)[c.house]!.kind).not.toBe("house");
    const r = openHouseChest(newSave(), w, c.house, c.k);
    expect(r.ok && r.save.hearts).toEqual([`${w}:${PIECE_CHEST}`]);
    if (r.ok) expect(openHouseChest(r.save, w, c.house, c.k).ok).toBe(false);
  });
  it("the plate riddle can be solved from any lit pattern", () => {
    expect(stepPlate(stepPlate(0, 0), 3)).toBe(PLATES_SOLVED);
    for (let start = 0; start <= PLATES_SOLVED; start++) {
      const ok = Array.from({ length: 1 << PLATES }, (_, m) => m).some((m) => [0, 1, 2, 3].reduce((lit, i) => (m & (1 << i) ? stepPlate(lit, i) : lit), start) === PLATES_SOLVED);
      expect(ok).toBe(true);
    }
  });
});

describe("walk-in houses", () => {
  for (let w = 0; w < WORLDS.length; w++) it(`world ${w + 1}: every house can be entered and every chest reached`, () => {
    for (const h of worldHouses(w)) {
      expect(canWalkWorld(w, h.door.x, h.door.y + 1)).toBe(true);
      expect(houseAtDoor(w, h.door.x, h.door.y)?.index).toBe(h.index);
      const room = houseRoom(w, h.index), start = { x: room.door.x, y: room.door.y - 1 };
      const seen = new Set([`${start.x},${start.y}`]), queue = [start];
      while (queue.length) { const c = queue.pop()!; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c.x + dx!, y = c.y + dy!; if (!seen.has(`${x},${y}`) && roomWalkable(room, x, y)) { seen.add(`${x},${y}`); queue.push({ x, y }); } } }
      for (const ch of room.chests) expect([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${ch.x + dx!},${ch.y + dy!}`))).toBe(true);
    }
  });
});

describe("first world monsters are easy", () => {
  it("every world-1 monster falls in at most 2 hits of the starting sword and hits for at most 2 life", () => {
    const st = playerStats(newSave());
    for (let slot = 0; slot < WORLDS[0]!.enemies.length; slot++) {
      const f = enemyFoe(0, slot);
      for (const stage of f.stages) {
        expect(Math.ceil(stage.hp / swordDamage(st, false, false))).toBeLessThanOrEqual(2);
        expect(foeDamage(stage.power, st)).toBeLessThanOrEqual(2);
      }
    }
  });
  it("world-2 monsters are tougher than world-1 monsters", () => {
    expect(enemyFoe(1, 0).stages[0]!.hp).toBeGreaterThan(enemyFoe(0, 0).stages[0]!.hp);
    expect(enemyFoe(1, 0).stages[0]!.power).toBeGreaterThan(enemyFoe(0, 0).stages[0]!.power);
  });
});
