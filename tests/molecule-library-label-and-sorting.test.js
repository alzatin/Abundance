import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Molecule Library browse tab", () => {
  const loginModePath =
    "/home/runner/work/Abundance/Abundance/src/components/main-routes/LoginMode.jsx";
  const loginModeSource = fs.readFileSync(loginModePath, "utf8");

  it('renames "Browse All Other Projects" to "Molecule Library"', () => {
    expect(loginModeSource).toContain("Molecule Library");
    expect(loginModeSource).not.toContain("Browse All Other Projects");
  });

  it("defaults all-project browsing to highest score first", () => {
    expect(loginModeSource).toContain('if (tab === "all")');
    expect(loginModeSource).toContain('updateOrderType("byStars")');
  });
});
