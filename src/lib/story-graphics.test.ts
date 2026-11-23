import { describe, expect, it } from "vitest";
import { elfPixels, ELF_H, ELF_W, WALK_FRAMES } from "./pixel-elf";
import { worldMap, T } from "./story-terrain";
import { canWalkWorld, lostWoodsEntrance, worldSpawn } from "./story-world";

const look = { skin: 0, hair: 0, outfit: 0, eyes: 0, ears: 0, style: 0, head: 0, body: 0 };

describe("walking animation", () => {
  it("has a 4-step cycle and every frame is a clean 16x24 sprite", () => {
    expect(WALK_FRAMES).toEqual([1, 2, 3, 4]);
    for (const body of [0, 1]) for (let dir = 0; dir < 4; dir++) for (const f of [0, ...WALK_FRAMES] as const) {
      const rows = elfPixels({ ...look, body }, dir as 0, f);
      expect(rows).toHaveLength(ELF_H);
      for (const r of rows) expect(r).toHaveLength(ELF_W);
    }
  });
  it("the legs really move: both strides differ from standing and from each other in every direction", () => {
    for (const body of [0, 1]) for (let dir = 0; dir < 4; dir++) {
      const [stand, a, b] = [0, 1, 3].map((f) => elfPixels({ ...look, body }, dir as 0, f as 0).slice(18).join("|"));
      expect(a).not.toBe(stand);
      expect(b).not.toBe(stand);
      expect(a).not.toBe(b);
    }
  });
});

describe("Lost Woods entrance", () => {
  const map = worldMap(0);
  const cell = (x: number, y: number) => map.cells[y * map.w + x];
  it("sits at the northern forest edge of world 1, inside an archway of trees", () => {
    const e = lostWoodsEntrance();
    expect(e).toMatchObject({ world: 0, x: 53, y: 6 });
    expect(cell(e.x - 1, 6)).toBe(T.TREE);
    expect(cell(e.x + 1, 6)).toBe(T.TREE);
    expect(map.structures.some((s) => s.kind === "grove" && s.x + 3 === e.x && s.y + 4 === e.y)).toBe(true);
  });
  it("a trail leads from the start up to the step in front of the archway", () => {
    const start = worldSpawn(0), goal = { x: 53, y: 7 };
    const seen = new Set([`${start.x},${start.y}`]), queue = [start];
    while (queue.length) {
      const p = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = p.x + dx!, y = p.y + dy!, k = `${x},${y}`;
        if (!seen.has(k) && canWalkWorld(0, x, y)) { seen.add(k); queue.push({ x, y }); }
      }
    }
    expect(seen.has(`${goal.x},${goal.y}`)).toBe(true);
  });
});
