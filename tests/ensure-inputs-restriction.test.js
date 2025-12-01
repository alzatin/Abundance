import { describe, it, expect, beforeEach, vi } from "vitest";
import AttachmentPoint from "../src/prototypes/attachmentpoint.js";
import Molecule from "../src/molecules/molecule.js";
import Input from "../src/molecules/input.js";
import Atom from "../src/prototypes/atom.js";
import GlobalVariables from "../src/js/globalvariables.js";

describe("ensureInputsForEquation restriction", () => {
  let molecule;
  let testAtom;
  
  beforeEach(() => {
    // Create a parent molecule
    molecule = new Molecule({
      x: 0.5,
      y: 0.5,
      parent: null,
      uniqueID: GlobalVariables.generateUniqueID(),
      topLevel: true,
    });
    
    // Create a basic atom for testing
    testAtom = new Atom({
      x: 0.5,
      y: 0.5,
      parent: molecule,
      uniqueID: GlobalVariables.generateUniqueID(),
    });
    testAtom.atomType = "Circle"; // A regular atom type
    testAtom.inputs = [];
    testAtom.parentMolecule = molecule;
  });

  it("should NOT add inputs for unrecognized variables in non-Equation/Code atoms", () => {
    // Set up a regular atom (not Equation or Code)
    testAtom.atomType = "Circle";
    const initialInputCount = testAtom.inputs.length;
    
    // Call ensureInputsForEquation with an equation containing a new variable
    testAtom.ensureInputsForEquation("unknownVariable * 2");
    
    // Should NOT have added any inputs
    expect(testAtom.inputs.length).toBe(initialInputCount);
    expect(testAtom.inputs.find(i => i.name === "unknownVariable")).toBeUndefined();
  });

  it("should NOT add inputs for Constant atoms", () => {
    testAtom.atomType = "Constant";
    const initialInputCount = testAtom.inputs.length;
    
    testAtom.ensureInputsForEquation("newVar + 5");
    
    // Should NOT have added any inputs
    expect(testAtom.inputs.length).toBe(initialInputCount);
    expect(testAtom.inputs.find(i => i.name === "newVar")).toBeUndefined();
  });

  it("should NOT add inputs for Rectangle atoms", () => {
    testAtom.atomType = "Rectangle";
    const initialInputCount = testAtom.inputs.length;
    
    testAtom.ensureInputsForEquation("width * 2 + height");
    
    // Should NOT have added any inputs
    expect(testAtom.inputs.length).toBe(initialInputCount);
    expect(testAtom.inputs.find(i => i.name === "width")).toBeUndefined();
    expect(testAtom.inputs.find(i => i.name === "height")).toBeUndefined();
  });

  it("SHOULD add inputs for Equation atoms", () => {
    testAtom.atomType = "Equation";
    const initialInputCount = testAtom.inputs.length;
    
    testAtom.ensureInputsForEquation("newVar * 2");
    
    // Should HAVE added an input
    expect(testAtom.inputs.length).toBe(initialInputCount + 1);
    expect(testAtom.inputs.find(i => i.name === "newVar")).toBeDefined();
  });

  it("SHOULD add inputs for Code atoms", () => {
    testAtom.atomType = "Code";
    const initialInputCount = testAtom.inputs.length;
    
    testAtom.ensureInputsForEquation("anotherVar + 10");
    
    // Should HAVE added an input
    expect(testAtom.inputs.length).toBe(initialInputCount + 1);
    expect(testAtom.inputs.find(i => i.name === "anotherVar")).toBeDefined();
  });

  it("should still NOT add inputs for built-in constants even in Equation atoms", () => {
    testAtom.atomType = "Equation";
    const initialInputCount = testAtom.inputs.length;
    
    // These are built-in constants that should never be added
    testAtom.ensureInputsForEquation("pi * 2 + e");
    
    // Should NOT have added inputs for built-in constants
    expect(testAtom.inputs.find(i => i.name === "pi")).toBeUndefined();
    expect(testAtom.inputs.find(i => i.name === "e")).toBeUndefined();
    expect(testAtom.inputs.length).toBe(initialInputCount);
  });

  it("Equation atom should still respect existing inputs and parent inputs", () => {
    testAtom.atomType = "Equation";
    
    // Add an existing input attachment point (with subscribe method)
    const existingInput = new AttachmentPoint({
      parentMolecule: testAtom,
      uniqueID: GlobalVariables.generateUniqueID(),
      type: "input",
      name: "existingVar",
      valueType: "number",
      defaultValue: 10,
    });
    testAtom.inputs.push(existingInput);
    
    // Set up a parent with inputs  
    testAtom.parent = {
      inputs: [{ name: "parentVar" }]
    };
    
    const initialInputCount = testAtom.inputs.length;
    
    // Call with equation that references existing inputs and a new one
    testAtom.ensureInputsForEquation("existingVar + parentVar + newVar");
    
    // Should only add the new variable, not duplicate existing ones
    expect(testAtom.inputs.filter(i => i.name === "existingVar").length).toBe(1);
    expect(testAtom.inputs.find(i => i.name === "parentVar")).toBeUndefined(); // Parent vars are not added locally
    expect(testAtom.inputs.find(i => i.name === "newVar")).toBeDefined();
    expect(testAtom.inputs.length).toBe(initialInputCount + 1);
  });
});
