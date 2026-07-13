import { describe, expect, it } from "vitest";
import renderMenuSource from "../src/components/secondary/RenderMenu.jsx?raw";

describe("Render controls context labels", () => {
  it("uses context labels for toggles in render controls", () => {
    expect(renderMenuSource).toContain('label: "Context"');
    expect(renderMenuSource).toContain('label: "Top Level Context"');
    expect(renderMenuSource).not.toContain('label: "Wireframe"');
    expect(renderMenuSource).not.toContain('label: "Top Level Wireframe"');
  });
});
