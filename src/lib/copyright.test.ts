import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { COPYRIGHT_EMAIL, COPYRIGHT_OWNER, COPYRIGHT_TEXT, COPYRIGHT_TITLE, COPYRIGHT_UNLOCK_SHA256 } from "./copyright";

// The owner fixed this notice. If a change makes this test fail, the change is not allowed: put the notice back.
describe("owner's copyright notice", () => {
  it("names the owner and his e-mail address exactly", () => {
    expect(COPYRIGHT_OWNER).toBe("Umut Demir");
    expect(COPYRIGHT_EMAIL).toBe("umut_demir2013@icloud.com");
    expect(COPYRIGHT_TITLE).toBe("© Copyright");
  });
  it("says the game may NOT be remixed without permission", () => {
    expect(COPYRIGHT_TEXT).toBe(
      "© 2026 Umut Demir – QUESTDICE. Alle Rechte vorbehalten. Dieses Spiel gehört Umut Demir. " +
      "Es ist NICHT erlaubt, dieses Spiel ohne meine ausdrückliche Erlaubnis zu remixen, zu kopieren oder weiterzugeben. " +
      "Wenn du es remixen möchtest, frag mich zuerst per E-Mail um Erlaubnis.",
    );
  });
  it("only the owner's code unlocks changes; the fingerprint stays fixed and a wrong code does not match", () => {
    expect(COPYRIGHT_UNLOCK_SHA256).toBe("a37d3b945788a6c6168d5bb169347c1f4bbe24e228f78c5fd57f0e8bd9d36075");
    expect(createHash("sha256").update("falscher-code").digest("hex")).not.toBe(COPYRIGHT_UNLOCK_SHA256);
  });
});
