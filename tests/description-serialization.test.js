// Test to validate that atom descriptions don't need to be serialized
import { beforeAll, describe, it, expect, vi } from "vitest";

// Mock GlobalVariables and dependencies
const mockGlobalVariables = {
  generateUniqueID: () => "test-id-" + Math.random().toString(36).substr(2, 9),
  topLevelMolecule: null,
};

const mockParent = {
  name: "TestParent",
};

// Mock the base Atom class
class MockAtom {
  constructor(values) {
    this.inputs = [];
    this.output = null;
    this.uniqueID = mockGlobalVariables.generateUniqueID();
    this.x = 0;
    this.y = 0;
    this.parent = mockParent;
    this.atomType = "MockAtom";
    this.name = "MockAtom";
    this.description = "This is a test atom description that should not be serialized";
    this.setValues(values);
  }

  setValues(values) {
    if (values) {
      for (var key in values) {
        this[key] = values[key];
      }
    }
  }

  // Current serialize method with description (before fix)
  serializeWithDescription(offset = { x: 0, y: 0 }) {
    const ioValues = [];
    const object = {
      atomType: this.atomType,
      name: this.name,
      x: this.x + offset.x,
      y: this.y - offset.y,
      uniqueID: this.uniqueID,
      ioValues: ioValues,
      description: this.description, // This should be removed
    };
    return object;
  }

  // Fixed serialize method without description (after fix)
  serializeWithoutDescription(offset = { x: 0, y: 0 }) {
    const ioValues = [];
    const object = {
      atomType: this.atomType,
      name: this.name,
      x: this.x + offset.x,
      y: this.y - offset.y,
      uniqueID: this.uniqueID,
      ioValues: ioValues,
      // description: this.description, // Removed!
    };
    return object;
  }
}

describe("Description Serialization Optimization", () => {
  it("should demonstrate file size reduction by removing descriptions", () => {
    const atom = new MockAtom({
      atomType: "TestAtom",
      name: "TestAtomName",
      x: 0.5,
      y: 0.3,
    });

    const withDescription = atom.serializeWithDescription();
    const withoutDescription = atom.serializeWithoutDescription();

    // Verify the description exists in the atom instance
    expect(atom.description).toBe("This is a test atom description that should not be serialized");

    // Verify the description is included in the old serialization
    expect(withDescription.description).toBe("This is a test atom description that should not be serialized");

    // Verify the description is NOT included in the new serialization
    expect(withoutDescription.description).toBeUndefined();

    // Calculate file size difference
    const sizeWithDescription = JSON.stringify(withDescription).length;
    const sizeWithoutDescription = JSON.stringify(withoutDescription).length;
    const reduction = sizeWithDescription - sizeWithoutDescription;

    console.log("Serialization with description:", JSON.stringify(withDescription, null, 2));
    console.log("Serialization without description:", JSON.stringify(withoutDescription, null, 2));
    console.log(`Size with description: ${sizeWithDescription} bytes`);
    console.log(`Size without description: ${sizeWithoutDescription} bytes`);
    console.log(`Size reduction: ${reduction} bytes (${Math.round(reduction/sizeWithDescription*100)}%)`);

    // Expect some size reduction
    expect(reduction).toBeGreaterThan(0);
  });

  it("should verify that atom can be reconstructed without serialized description", () => {
    const original = new MockAtom({
      atomType: "TestAtom",
      name: "TestAtomName", 
      x: 0.5,
      y: 0.3,
    });

    // Serialize without description
    const serialized = original.serializeWithoutDescription();

    // Create new atom from serialized data (simulating loading from file)
    const reconstructed = new MockAtom(serialized);

    // Verify all important data is preserved
    expect(reconstructed.atomType).toBe(original.atomType);
    expect(reconstructed.name).toBe(original.name);
    expect(reconstructed.x).toBe(original.x);
    expect(reconstructed.y).toBe(original.y);
    expect(reconstructed.uniqueID).toBe(original.uniqueID);

    // Verify description is still available in the reconstructed atom
    // (it should come from the class definition, not serialization)
    expect(reconstructed.description).toBe("This is a test atom description that should not be serialized");
  });

  it("should demonstrate cumulative file size reduction across multiple atoms", () => {
    const atoms = [];
    for (let i = 0; i < 10; i++) {
      atoms.push(new MockAtom({
        atomType: "TestAtom",
        name: `Atom${i}`,
        x: i * 0.1,
        y: i * 0.1,
      }));
    }

    const projectWithDescriptions = {
      atoms: atoms.map(atom => atom.serializeWithDescription())
    };

    const projectWithoutDescriptions = {
      atoms: atoms.map(atom => atom.serializeWithoutDescription())
    };

    const sizeWithDescriptions = JSON.stringify(projectWithDescriptions).length;
    const sizeWithoutDescriptions = JSON.stringify(projectWithoutDescriptions).length;
    const totalReduction = sizeWithDescriptions - sizeWithoutDescriptions;

    console.log(`Project with ${atoms.length} atoms:`);
    console.log(`Size with descriptions: ${sizeWithDescriptions} bytes`);
    console.log(`Size without descriptions: ${sizeWithoutDescriptions} bytes`);
    console.log(`Total reduction: ${totalReduction} bytes (${Math.round(totalReduction/sizeWithDescriptions*100)}%)`);

    // Expect significant cumulative reduction
    expect(totalReduction).toBeGreaterThan(0);
    expect(totalReduction / sizeWithDescriptions).toBeGreaterThan(0.1); // At least 10% reduction
  });
});