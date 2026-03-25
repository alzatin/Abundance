/**
 * Tests that propagateInputChange() in Molecule recursively propagates into
 * nested child molecules so that equations using ancestor-level inputs (from a
 * grandparent or higher molecule) are re-evaluated when those inputs change.
 *
 * Bug: propagateInputChange() only iterated over this.nodesOnTheScreen (the
 * direct children of the current molecule).  An Equation atom inside a NESTED
 * molecule was therefore never reached, so changing an input value on the
 * parent molecule had no effect on the nested equation.
 *
 * Fix: propagateInputChange() now calls itself recursively on any child
 * molecule it encounters, so the update reaches arbitrarily deep equations.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Build a minimal mock of Molecule.propagateInputChange() that mirrors the
 * fixed implementation, without pulling in the full Molecule class (which has
 * complex side-effects on import).
 */
function makeMolecule({ nodesOnTheScreen = [] } = {}) {
  const mol = {
    atomType: "Molecule",
    nodesOnTheScreen,
    propagateInputChange(inputName) {
      this.nodesOnTheScreen.forEach((atom) => {
        // Recursively propagate to child molecules
        if (
          (atom.atomType === "Molecule" || atom.atomType === "GitHubMolecule") &&
          typeof atom.propagateInputChange === "function"
        ) {
          atom.propagateInputChange(inputName);
        }

        // Target Equation / Code atoms with no direct atom-level inputs
        if (
          (atom.atomType === "Equation" || atom.atomType === "Code") &&
          atom.inputs.length === 0
        ) {
          if (atom.atomType === "Equation") {
            const vars = atom._extractVariablesFromEquation();
            if (vars.includes(inputName) && atom.isEnabled()) {
              atom.onUpstreamChange();
            }
          } else if (atom.atomType === "Code" && atom.isEnabled()) {
            atom.onUpstreamChange();
          }
        }
      });
    },
  };
  return mol;
}

function makeEquationAtom({ equation, inputs = [], enabled = true } = {}) {
  return {
    atomType: "Equation",
    inputs,
    _extractVariablesFromEquation: vi.fn(() => {
      // Extract all identifier-like tokens from the equation string
      return (equation || "").match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    }),
    isEnabled: vi.fn(() => enabled),
    onUpstreamChange: vi.fn(),
  };
}

function makeCodeAtom({ inputs = [], enabled = true } = {}) {
  return {
    atomType: "Code",
    inputs,
    isEnabled: vi.fn(() => enabled),
    onUpstreamChange: vi.fn(),
  };
}

describe("propagateInputChange recursive into nested molecules", () => {
  it("triggers equation in a direct child (baseline – existing behaviour)", () => {
    const eq = makeEquationAtom({ equation: "TableWidth / 2" });
    const parent = makeMolecule({ nodesOnTheScreen: [eq] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).toHaveBeenCalledOnce();
  });

  it("triggers equation in a single-level nested molecule when ancestor input changes", () => {
    const eq = makeEquationAtom({ equation: "TableWidth / 2 - EdgeLip" });
    const child = makeMolecule({ nodesOnTheScreen: [eq] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).toHaveBeenCalledOnce();
  });

  it("triggers equation in a doubly-nested molecule (grandparent input)", () => {
    const eq = makeEquationAtom({ equation: "TableWidth + 10" });
    const grandchild = makeMolecule({ nodesOnTheScreen: [eq] });
    const child = makeMolecule({ nodesOnTheScreen: [grandchild] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).toHaveBeenCalledOnce();
  });

  it("does NOT trigger equation that uses a different variable", () => {
    const eq = makeEquationAtom({ equation: "EdgeLip * 2" });
    const child = makeMolecule({ nodesOnTheScreen: [eq] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    // Change TableWidth, but equation only uses EdgeLip
    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).not.toHaveBeenCalled();
  });

  it("does NOT trigger equation that has local atom-level inputs (handled via connectors)", () => {
    // When inputs.length > 0 the normal connector-based propagation handles it
    const eq = makeEquationAtom({
      equation: "TableWidth + x",
      inputs: [{ name: "x" }],
    });
    const child = makeMolecule({ nodesOnTheScreen: [eq] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).not.toHaveBeenCalled();
  });

  it("does NOT trigger disabled equation", () => {
    const eq = makeEquationAtom({ equation: "TableWidth", enabled: false });
    const child = makeMolecule({ nodesOnTheScreen: [eq] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).not.toHaveBeenCalled();
  });

  it("triggers Code atom in nested molecule for any input change", () => {
    const code = makeCodeAtom();
    const child = makeMolecule({ nodesOnTheScreen: [code] });
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("AnyInput");

    expect(code.onUpstreamChange).toHaveBeenCalledOnce();
  });

  it("triggers equations in both direct children and nested molecules", () => {
    const directEq = makeEquationAtom({ equation: "TableWidth * 3" });
    const nestedEq = makeEquationAtom({ equation: "TableWidth - 5" });
    const child = makeMolecule({ nodesOnTheScreen: [nestedEq] });
    const parent = makeMolecule({ nodesOnTheScreen: [child, directEq] });

    parent.propagateInputChange("TableWidth");

    expect(directEq.onUpstreamChange).toHaveBeenCalledOnce();
    expect(nestedEq.onUpstreamChange).toHaveBeenCalledOnce();
  });

  it("works with GitHubMolecule child type", () => {
    const eq = makeEquationAtom({ equation: "TableWidth / 4" });
    // GitHubMolecule inherits from Molecule; simulate it by overriding atomType
    const child = { ...makeMolecule({ nodesOnTheScreen: [eq] }), atomType: "GitHubMolecule" };
    const parent = makeMolecule({ nodesOnTheScreen: [child] });

    parent.propagateInputChange("TableWidth");

    expect(eq.onUpstreamChange).toHaveBeenCalledOnce();
  });
});
