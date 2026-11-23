import { describe, expect, it } from "vitest";
import {
  ELF_H, ELF_W, ELF_HD, HERO_PRESET, LINK_PRESET, SILVER_PRESET, COAT_OUTFIT, NPC_LOOK_COUNTS,
  elfColors, elfPixels, elfRectsHD,
  type ElfDir, type WalkFrame,
} from "./pixel-elf";

const directions: ElfDir[] = [0, 1, 2, 3];
const frames: WalkFrame[] = [0, 1, 2, 3, 4];

describe("elf hero sprites", () => {
  it("keeps HD sprite rectangles inside 32×48 without fallback colours", () => {
    expect(ELF_HD).toBe(2);
    for (const dir of directions) {
      for (const frame of frames) {
        for (const gear of [true, "swing"] as const) {
          const rects = elfRectsHD(HERO_PRESET, dir, frame, gear);
          expect(rects.length).toBeGreaterThan(0);
          for (const r of rects) {
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.y).toBeGreaterThanOrEqual(0);
            expect(r.w).toBeGreaterThan(0);
            expect(r.x + r.w).toBeLessThanOrEqual(32);
            expect(r.y + 1).toBeLessThanOrEqual(48);
            expect(r.fill).not.toBe("#ff00ff");
          }
        }
      }
    }
  });

  it("removes the sheathed sword but retains the shield while swinging", () => {
    for (const dir of directions) {
      for (const frame of frames) {
        const equipped = elfPixels(HERO_PRESET, dir, frame, true);
        const swing = elfPixels(HERO_PRESET, dir, frame, "swing");
        expect(swing).not.toEqual(equipped);
        const shield = (rows: string[]) => rows.flatMap((row, y) =>
          [...row].flatMap((c, x) => c === "k" || c === "K" ? [`${x},${y}:${c}`] : []));
        expect(shield(swing).length).toBeGreaterThanOrEqual(shield(equipped).length);
        expect(shield(swing).length).toBeGreaterThan(0);
      }
    }
  });

  it("makes each new hero option visibly different from option zero", () => {
    for (const key of ["style", "outfit", "eyes"] as const) {
      expect(elfColors(HERO_PRESET, 0))
        .not.toEqual(elfColors({ ...HERO_PRESET, [key]: 0 }, 0));
    }
  });

  it("preserves the original NPC look space", () => {
    expect(NPC_LOOK_COUNTS).toEqual({
      skin: 6, hair: 10, outfit: 8, style: 6,
      body: 2, eyes: 6, head: 5, ears: 2,
    });
  });

  it("keeps new-option sprites rectangular and fully paletted", () => {
    for (const body of [0, 1]) {
      for (const dir of directions) {
        for (const frame of frames) {
          for (const gear of [false, true, "swing"] as const) {
            const look = { ...HERO_PRESET, body };
            const rows = elfPixels(look, dir, frame, gear);
            expect(rows).toHaveLength(ELF_H);
            expect(rows.every((row) => row.length === ELF_W)).toBe(true);
            expect(elfColors(look, dir, frame, gear).flat())
              .not.toContain("#ff00ff");
          }
        }
      }
    }
  });
});

describe("silver-haired swordsman look", () => {
  const count = (rows: string[], letters: RegExp) => rows.join("").split("").filter((c) => letters.test(c)).length;
  it("wears silver hair, green eyes, the black coat and hides the ears", () => {
    expect(SILVER_PRESET).toMatchObject({ hair: 3, style: 7, eyes: 7, outfit: COAT_OUTFIT, ears: 2, head: 0 });
  });
  it("its hair falls far below the head, down past the belt", () => {
    for (const dir of directions) {
      const rows = elfPixels(SILVER_PRESET, dir, 0, true);
      const lowest = rows.reduce((at, row, y) => (/[hH]/.test(row) ? y : at), -1);
      expect(lowest).toBeGreaterThanOrEqual(20);
    }
  });
  it("carries a long katana instead of shield and sword, and the katana leaves the sprite while swinging", () => {
    for (const dir of directions) for (const frame of frames) {
      const held = elfPixels(SILVER_PRESET, dir, frame, true);
      const swing = elfPixels(SILVER_PRESET, dir, frame, "swing");
      expect(count(held, /[kK]/)).toBe(0);
      expect(count(held, /[jW]/)).toBeGreaterThanOrEqual(5);
      expect(count(swing, /[jW]/)).toBe(0);
    }
  });
  it("has two shoulder guards in front view", () => {
    const rows = elfPixels(SILVER_PRESET, 0, 0, true);
    expect(rows[14]!.slice(0, 5)).toContain("a");
    expect(rows[14]!.slice(11)).toContain("a");
  });
  it("draws every frame fully paletted", () => {
    for (const body of [0, 1]) for (const dir of directions) for (const frame of frames) for (const gear of [false, true, "swing"] as const) {
      const look = { ...SILVER_PRESET, body };
      expect(elfPixels(look, dir, frame, gear)).toHaveLength(ELF_H);
      expect(elfColors(look, dir, frame, gear).flat()).not.toContain("#ff00ff");
    }
  });
});

describe("Minish Cap proportions", () => {
  const width = (rows: string[], from: number, to: number) => Math.max(...rows.slice(from, to).map((r) => r.replace(/^\.+|\.+$/g, "").length));
  it("the head is wider than the slim body, so nobody looks chubby", () => {
    for (const look of [LINK_PRESET, { ...LINK_PRESET, head: 0, style: 1 }]) {
      const rows = elfPixels(look, 0, 0, false);
      // Head without ears (rows 4–7) vs. torso (rows 14–16).
      expect(width(rows, 14, 17)).toBeLessThan(width(rows, 5, 8));
      expect(width(rows, 14, 17)).toBeLessThanOrEqual(10);
    }
  });
  it("Link wears the green cap and tunic with gold hair and blue eyes", () => {
    expect(LINK_PRESET).toMatchObject({ head: 1, outfit: 0, hair: 0, eyes: 1 });
    const rows = elfPixels(LINK_PRESET, 0).join("");
    expect(rows).toContain("c");
    expect(rows).toContain("h");
    expect(rows).toContain("e");
  });
});
