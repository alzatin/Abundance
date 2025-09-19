// Integration test to verify actual file size reduction using real Atom class
import { beforeAll, describe, it, expect, vi } from "vitest";

// Setup mock dependencies first
const mockGlobalVariables = {
  generateUniqueID: () => "test-id-" + Math.random().toString(36).substr(2, 9),
};

global.GlobalVariables = mockGlobalVariables;

// Mock the parse function from mathjs
vi.mock("mathjs", () => ({
  parse: vi.fn(() => ({})),
}));

// Mock AttachmentPoint
global.AttachmentPoint = class MockAttachmentPoint {
  constructor() {
    this.name = "mockAP";
    this.getValue = () => "mockValue";
  }
};

// Import the real Atom class after mocking dependencies  
let Atom;

beforeAll(async () => {
  // Mock the ObservableEntity first
  vi.mock("../src/prototypes/observableEntity.js", () => ({
    ObservableEntity: class MockObservableEntity {
      constructor() {}
    },
    Status: {
      DISABLED: "disabled",
      WAITING: "waiting", 
      PROCESSING: "processing",
      ERROR: "error",
      UPSTREAM_ERROR: "upstream_error",
      READY: "ready",
    }
  }));

  // Now import the real Atom class
  const atomModule = await import("../src/prototypes/atom.js");
  Atom = atomModule.default;
});

describe("Real Atom Class Serialization Optimization", () => {
  it("should demonstrate file size reduction using real Atom class", async () => {
    // Create a real Atom instance
    const atom = new Atom({
      atomType: "TestAtom",
      name: "TestAtomName",
      x: 0.5,
      y: 0.3,
    });

    // The atom should have a description (set in constructor)
    expect(atom.description).toBeDefined();
    expect(atom.description.length).toBeGreaterThan(0);

    // Serialize the atom
    const serialized = atom.serialize();

    // Verify description is NOT included in serialization (this is our fix)
    expect(serialized.description).toBeUndefined();

    // Verify all essential data is still there
    expect(serialized.atomType).toBe("TestAtom");
    expect(serialized.name).toBe("TestAtomName");
    expect(serialized.x).toBe(0.5);
    expect(serialized.y).toBe(0.3);
    expect(serialized.uniqueID).toBeDefined();
    expect(serialized.ioValues).toBeDefined();

    console.log("✅ Real Atom serialization test passed");
    console.log("Description in atom instance:", atom.description);
    console.log("Description in serialized data:", serialized.description);
    console.log("Serialized object:", JSON.stringify(serialized, null, 2));
  });

  it("should calculate file size savings across multiple real atoms", async () => {
    const atoms = [];
    
    // Create multiple atom instances
    for (let i = 0; i < 5; i++) {
      atoms.push(new Atom({
        atomType: "TestAtom",
        name: `Atom${i}`,
        x: i * 0.1,
        y: i * 0.1,
      }));
    }

    // Serialize all atoms
    const serializedAtoms = atoms.map(atom => atom.serialize());

    // Create a mock project with these atoms
    const project = {
      filetypeVersion: 1,
      atoms: serializedAtoms
    };

    const projectJson = JSON.stringify(project, null, 2);
    const projectSize = projectJson.length;

    // Calculate what the size would be WITH descriptions
    const atomsWithDescriptions = atoms.map(atom => ({
      ...atom.serialize(),
      description: atom.description
    }));

    const projectWithDescriptions = {
      filetypeVersion: 1,
      atoms: atomsWithDescriptions
    };

    const projectWithDescriptionsJson = JSON.stringify(projectWithDescriptions, null, 2);
    const projectWithDescriptionsSize = projectWithDescriptionsJson.length;

    const sizeSavings = projectWithDescriptionsSize - projectSize;
    const percentageSavings = Math.round((sizeSavings / projectWithDescriptionsSize) * 100);

    console.log(`✅ File size analysis for ${atoms.length} atoms:`);
    console.log(`Size without descriptions: ${projectSize} bytes`);
    console.log(`Size with descriptions: ${projectWithDescriptionsSize} bytes`);
    console.log(`Savings: ${sizeSavings} bytes (${percentageSavings}%)`);

    // Expect meaningful savings
    expect(sizeSavings).toBeGreaterThan(0);
    expect(percentageSavings).toBeGreaterThan(5); // At least 5% savings
  });
});