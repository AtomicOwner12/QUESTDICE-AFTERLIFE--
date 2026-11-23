import { describe, expect, it } from "vitest";
import { STORY_CREDITS, CREDITS_INSPIRATION } from "./story";

const names = STORY_CREDITS.flatMap((s) => s.names);

describe("story end credits", () => {
  it("lists the owner first", () => {
    expect(STORY_CREDITS[0]!.names).toEqual(["Umut Demir"]);
  });
  it("thanks every person and class the owner named", () => {
    for (const n of ["Semih Demir", "Arda Demir", "Frau Ibusoska", "Herr Balmer", "Frau Capovilla", "Klasse 3ra", "Klasse 3rb"]) expect(names).toContain(n);
  });
  it("mentions the Zelda and Final Fantasy inspiration", () => {
    expect(CREDITS_INSPIRATION).toContain("The Legend of Zelda");
    expect(CREDITS_INSPIRATION).toContain("Final Fantasy");
  });
});
