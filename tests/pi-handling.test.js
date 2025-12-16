import { describe, it, expect, beforeEach } from "vitest";
import { create, all } from "mathjs";

describe("Pi handling in equations", () => {
  let math;
  
  beforeEach(() => {
    math = create(all);
  });

  it("mathjs evaluate should handle pi correctly", () => {
    const result = math.evaluate("pi");
    expect(result).toBeCloseTo(Math.PI, 10);
  });

  it("mathjs evaluate should handle pi in expressions", () => {
    const result = math.evaluate("2 * pi");
    expect(result).toBeCloseTo(2 * Math.PI, 10);
  });

  it("mathjs evaluate should handle pi with variable substitution", () => {
    const result = math.evaluate("x * pi", { x: 2 });
    expect(result).toBeCloseTo(2 * Math.PI, 10);
  });

  it("mathjs parse should extract pi as a symbol", () => {
    const node = math.parse("pi");
    let foundPi = false;
    node.traverse((n) => {
      if (n.isSymbolNode && n.name === "pi") {
        foundPi = true;
      }
    });
    expect(foundPi).toBe(true);
  });

  it("mathjs parse should extract pi in expressions", () => {
    const node = math.parse("2 * pi + x");
    const symbols = [];
    node.traverse((n) => {
      if (n.isSymbolNode) {
        symbols.push(n.name);
      }
    });
    expect(symbols).toContain("pi");
    expect(symbols).toContain("x");
  });
});
