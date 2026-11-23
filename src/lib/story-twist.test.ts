import { describe, expect, it } from "vitest";
import { WORLDS, FINAL_WORLD, bossFoe, bossShown, needsDiceyReveal, revealDicey, newSave, cleanSave, LEVELS_PER_WORLD, DICEY_REVEAL } from "./story";
import { savePoints } from "./story-world";

describe("final boss plot twist", () => {
  it("the final boss is Dicey", () => {
    expect(FINAL_WORLD).toBe(WORLDS.length - 1);
    expect(bossFoe(FINAL_WORLD).name).toBe("Dicey");
    expect(bossFoe(FINAL_WORLD).boss).toBe(true);
  });

  it("Dicey hides behind King Chaoswürfel until the reveal", () => {
    const s = newSave();
    expect(bossShown(s, FINAL_WORLD).name).toBe("König Chaoswürfel");
    expect(bossShown(revealDicey(s), FINAL_WORLD).name).toBe("Dicey");
  });

  it("other worlds always show their real boss", () => {
    const s = newSave();
    for (let w = 0; w < FINAL_WORLD; w++) expect(bossShown(s, w).name).toBe(WORLDS[w]!.boss.name);
  });

  it("the reveal plays only once and only in the final world", () => {
    const s = newSave();
    expect(needsDiceyReveal(s, FINAL_WORLD)).toBe(true);
    expect(needsDiceyReveal(s, 0)).toBe(false);
    expect(needsDiceyReveal(revealDicey(s), FINAL_WORLD)).toBe(false);
    expect(DICEY_REVEAL.length).toBeGreaterThan(1);
  });

  it("the reveal survives saving and loading, and a saved final world counts as revealed", () => {
    expect(cleanSave(JSON.parse(JSON.stringify(revealDicey(newSave())))).diceyRevealed).toBe(true);
    expect(cleanSave({ ...newSave(), diceyRevealed: "yes" }).diceyRevealed).toBe(false);
    const finalBoss = FINAL_WORLD * LEVELS_PER_WORLD + LEVELS_PER_WORLD - 1;
    const won = cleanSave({ ...newSave(), unlocked: finalBoss, cleared: Array.from({ length: finalBoss + 1 }, (_, i) => i) });
    expect(won.diceyRevealed).toBe(true);
  });

  it("the dungeon sign in the final world does not spoil the twist", () => {
    const sign = savePoints(newSave(), FINAL_WORLD).find((p) => p.kind === "dungeon");
    expect(sign?.name).toBe("Dungeon von König Chaoswürfel");
  });
});
