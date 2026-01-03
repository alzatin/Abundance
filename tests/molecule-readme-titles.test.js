/**
 * Test to validate that molecules contribute heading 3 titles to the README
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock GlobalVariables
const mockGlobalVariables = {
  generateUniqueID: () => "test-id-" + Math.random().toString(36).substring(2, 11),
  distBetweenPoints: (x1, x2, y1, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
};

// Mock the base Atom class
class MockAtom {
  constructor(values) {
    this.inputs = [];
    this.output = null;
    this.uniqueID = mockGlobalVariables.generateUniqueID();
    this.x = 0;
    this.y = 0;
    this.atomType = "MockAtom";
    this.name = "MockAtom";
    this.nodesOnTheScreen = [];
    this.setValues(values);
  }

  setValues(values) {
    if (values) {
      for (const key in values) {
        this[key] = values[key];
      }
    }
  }

  addAllIOs(ios) {
    this.inputs = ios;
  }
}

// Mock Readme class
class MockReadme extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = "Readme";
    this.type = "readme";
    this.name = "README";
    this.readMeText = "Readme text here";
    this.global = true;
    this.setValues(values);
  }

  async requestReadme() {
    if (this.global) {
      return {
        readMeText: this.readMeText,
        svg: null,
        uniqueID: this.uniqueID,
      };
    } else {
      return [];
    }
  }
}

// Mock Molecule class with the new heading feature
class MockMolecule extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = "Molecule";
    this.name = "Molecule";
    this.nodesOnTheScreen = [];
    this.setValues(values);
  }

  async requestReadme() {
    var sortableAtomsList = this.nodesOnTheScreen;
    sortableAtomsList = sortableAtomsList
      .filter((atom) => atom.atomType === "Molecule" || atom.atomType === "Readme")
      .sort(function (a, b) {
        return (
          mockGlobalVariables.distBetweenPoints(a.x, 0, a.y, 0) -
          mockGlobalVariables.distBetweenPoints(b.x, 0, b.y, 0)
        );
      });

    const promiseArray = sortableAtomsList.map((atom) => {
      return atom.requestReadme();
    });

    let finalReadMe = [];

    await Promise.all(promiseArray).then((values) => {
      values.forEach((value) => {
        if (!value) {
          return;
        }
        let text;
        if (value instanceof Array) {
          value.forEach((arrayItem) => {
            text = arrayItem.readMeText;
            finalReadMe.push({
              uniqueID: arrayItem.uniqueID,
              readMeText: text,
              svg: arrayItem.svg,
            });
          });
        } else {
          text = value.readMeText;
          if (value.svg) {
            text = text.concat(" \n\n![readme](/readme" + value.uniqueID + ".svg)\n\n");
          }
          finalReadMe.push({
            uniqueID: value.uniqueID,
            readMeText: text,
            svg: value.svg,
          });
        }
      });
    });

    // Add heading for this molecule if there are any readme contributions
    if (finalReadMe.length > 0) {
      // Insert heading at the beginning
      finalReadMe.unshift({
        uniqueID: this.uniqueID + "-heading",
        readMeText: `### ${this.name}`,
        svg: null,
      });
    }

    return finalReadMe;
  }
}

describe("Molecule README Title Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add a heading 3 title before readme atoms in a molecule", async () => {
    const molecule = new MockMolecule({ name: "Arm", x: 0, y: 0 });
    
    const readme1 = new MockReadme({
      readMeText: "Text in the first readme atom",
      x: 0.1,
      y: 0.1,
    });
    
    const readme2 = new MockReadme({
      readMeText: "Text in the second readme atom",
      x: 0.2,
      y: 0.2,
    });
    
    molecule.nodesOnTheScreen = [readme1, readme2];
    
    const result = await molecule.requestReadme();
    
    // Should have 3 items: heading + 2 readme atoms
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    
    // First item should be the heading
    expect(result[0].readMeText).toBe("### Arm");
    expect(result[0].svg).toBe(null);
    expect(result[0].uniqueID).toContain("heading");
    
    // Second item should be the first readme atom
    expect(result[1].readMeText).toBe("Text in the first readme atom");
    
    // Third item should be the second readme atom
    expect(result[2].readMeText).toBe("Text in the second readme atom");
  });

  it("should not add heading if molecule has no readme contributions", async () => {
    const molecule = new MockMolecule({ name: "Empty", x: 0, y: 0 });
    
    // No atoms on the screen
    molecule.nodesOnTheScreen = [];
    
    const result = await molecule.requestReadme();
    
    // Should return empty array
    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  it("should add heading for nested molecule with readme atoms", async () => {
    const parentMolecule = new MockMolecule({ name: "Parent", x: 0, y: 0 });
    const childMolecule = new MockMolecule({ name: "Child", x: 0.1, y: 0.1 });
    
    const readme1 = new MockReadme({
      readMeText: "Child readme text",
      x: 0.1,
      y: 0.1,
    });
    
    childMolecule.nodesOnTheScreen = [readme1];
    parentMolecule.nodesOnTheScreen = [childMolecule];
    
    const result = await parentMolecule.requestReadme();
    
    // Should have 3 items: parent heading + child heading + readme atom
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    
    // First should be parent heading
    expect(result[0].readMeText).toBe("### Parent");
    
    // Second should be child heading
    expect(result[1].readMeText).toBe("### Child");
    
    // Third should be the readme text
    expect(result[2].readMeText).toBe("Child readme text");
  });

  it("should preserve order of readme atoms based on position", async () => {
    const molecule = new MockMolecule({ name: "OrderTest", x: 0, y: 0 });
    
    // Create readmes at different positions
    const readme1 = new MockReadme({
      readMeText: "Third (furthest)",
      x: 0.5,
      y: 0.5,
    });
    
    const readme2 = new MockReadme({
      readMeText: "First (closest)",
      x: 0.1,
      y: 0.1,
    });
    
    const readme3 = new MockReadme({
      readMeText: "Second (middle)",
      x: 0.3,
      y: 0.3,
    });
    
    molecule.nodesOnTheScreen = [readme1, readme2, readme3];
    
    const result = await molecule.requestReadme();
    
    // Should have 4 items: heading + 3 readme atoms in sorted order
    expect(result).toBeDefined();
    expect(result.length).toBe(4);
    
    // First item should be heading
    expect(result[0].readMeText).toBe("### OrderTest");
    
    // Subsequent items should be sorted by distance from origin
    expect(result[1].readMeText).toBe("First (closest)");
    expect(result[2].readMeText).toBe("Second (middle)");
    expect(result[3].readMeText).toBe("Third (furthest)");
  });

  it("should handle molecule with only one readme atom", async () => {
    const molecule = new MockMolecule({ name: "SingleReadme", x: 0, y: 0 });
    
    const readme = new MockReadme({
      readMeText: "Only readme text",
      x: 0.1,
      y: 0.1,
    });
    
    molecule.nodesOnTheScreen = [readme];
    
    const result = await molecule.requestReadme();
    
    // Should have 2 items: heading + 1 readme atom
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    
    expect(result[0].readMeText).toBe("### SingleReadme");
    expect(result[1].readMeText).toBe("Only readme text");
  });
});
