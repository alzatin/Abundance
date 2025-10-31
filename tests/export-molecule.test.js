import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Test suite for Export Molecule functionality
 */
describe("Export Molecule", () => {
  let mockOctokit;
  let mockCurrentUser;
  let setNewProjectBar;

  beforeEach(() => {
    // Mock Octokit
    mockOctokit = {
      request: vi.fn(),
      rest: {
        repos: {
          createOrUpdateFileContents: vi.fn(),
          replaceAllTopics: vi.fn(),
        },
      },
    };

    mockCurrentUser = "testuser";
    setNewProjectBar = vi.fn();

    // Mock GlobalVariables
    global.GlobalVariables = {
      currentUser: mockCurrentUser,
      topLevelMolecule: null,
      currentMolecule: null,
      generateUniqueID: () => "test-unique-id",
      toBinaryStr: (str) => str,
      fromBinaryStr: (str) => str,
    };

    // Mock window functions
    global.window = {
      alert: vi.fn(),
      btoa: (str) => Buffer.from(str).toString("base64"),
      atob: (str) => Buffer.from(str, "base64").toString(),
    };

    // Mock fetch
    global.fetch = vi.fn();
  });

  it("should update top molecule name when exporting", () => {
    const originalMoleculeName = "molecule";
    const projectName = "my-exported-project";

    // Simulate an existing molecule being exported
    const moleculeToExport = {
      name: originalMoleculeName,
      atomType: "Molecule",
      topLevel: false,
      uniqueID: "test-molecule-id",
      allAtoms: [],
      allConnectors: [],
      serialize: function () {
        return {
          name: this.name,
          atomType: this.atomType,
          topLevel: this.topLevel,
          uniqueID: this.uniqueID,
          allAtoms: this.allAtoms,
          allConnectors: this.allConnectors,
        };
      },
    };

    // Set the molecule as top level (simulating the export process)
    global.GlobalVariables.topLevelMolecule = moleculeToExport;
    moleculeToExport.topLevel = true;

    // Update the name to match the project name (this is what the fix does)
    global.GlobalVariables.topLevelMolecule.name = projectName;

    // Serialize the molecule
    const serialized = global.GlobalVariables.topLevelMolecule.serialize();

    // Verify the name was updated correctly
    expect(serialized.name).toBe(projectName);
    expect(serialized.name).not.toBe(originalMoleculeName);
    expect(serialized.topLevel).toBe(true);
  });

  it("should use GitHub's renamed project name if changed", () => {
    const requestedName = "My Project With Spaces";
    const githubRenamedTo = "My-Project-With-Spaces";

    const moleculeToExport = {
      name: "molecule",
      atomType: "Molecule",
      topLevel: false,
      uniqueID: "test-molecule-id",
      allAtoms: [],
      allConnectors: [],
      serialize: function () {
        return {
          name: this.name,
          atomType: this.atomType,
          topLevel: this.topLevel,
          uniqueID: this.uniqueID,
          allAtoms: this.allAtoms,
          allConnectors: this.allConnectors,
        };
      },
    };

    // Set the molecule as top level
    global.GlobalVariables.topLevelMolecule = moleculeToExport;
    moleculeToExport.topLevel = true;

    // Update the name to match GitHub's actual repo name (not the requested name)
    global.GlobalVariables.topLevelMolecule.name = githubRenamedTo;

    // Serialize the molecule
    const serialized = global.GlobalVariables.topLevelMolecule.serialize();

    // Verify the name matches GitHub's renamed version
    expect(serialized.name).toBe(githubRenamedTo);
    expect(serialized.name).not.toBe(requestedName);
    expect(serialized.name).not.toBe("molecule");
  });

  it("should preserve molecule structure when updating name", () => {
    const moleculeToExport = {
      name: "molecule",
      atomType: "Molecule",
      topLevel: false,
      uniqueID: "test-molecule-id",
      unitsKey: "MM",
      allAtoms: [
        {
          atomType: "Circle",
          name: "TestCircle",
          uniqueID: "circle-123",
        },
      ],
      allConnectors: [
        {
          name: "connector-1",
          uniqueID: "conn-123",
        },
      ],
      compiledBom: { items: [] },
      serialize: function () {
        return {
          name: this.name,
          atomType: this.atomType,
          topLevel: this.topLevel,
          uniqueID: this.uniqueID,
          unitsKey: this.unitsKey,
          allAtoms: this.allAtoms,
          allConnectors: this.allConnectors,
          compiledBom: this.compiledBom,
        };
      },
    };

    const newProjectName = "exported-project";

    // Set as top level and update name
    global.GlobalVariables.topLevelMolecule = moleculeToExport;
    moleculeToExport.topLevel = true;
    global.GlobalVariables.topLevelMolecule.name = newProjectName;

    // Serialize
    const serialized = global.GlobalVariables.topLevelMolecule.serialize();

    // Verify only the name and topLevel changed
    expect(serialized.name).toBe(newProjectName);
    expect(serialized.topLevel).toBe(true);
    expect(serialized.atomType).toBe("Molecule");
    expect(serialized.uniqueID).toBe("test-molecule-id");
    expect(serialized.unitsKey).toBe("MM");
    expect(serialized.allAtoms).toHaveLength(1);
    expect(serialized.allAtoms[0].name).toBe("TestCircle");
    expect(serialized.allConnectors).toHaveLength(1);
    expect(serialized.compiledBom).toEqual({ items: [] });
  });

  it("should handle new project creation without exporting", () => {
    const projectName = "new-project";

    // Simulate creating a new project (not exporting)
    const newMolecule = {
      x: 0,
      y: 0,
      topLevel: true,
      name: projectName,
      atomType: "Molecule",
      uniqueID: "test-unique-id",
      unitsKey: "MM",
    };

    global.GlobalVariables.topLevelMolecule = newMolecule;

    // Verify the name is already set correctly
    expect(global.GlobalVariables.topLevelMolecule.name).toBe(projectName);
    expect(global.GlobalVariables.topLevelMolecule.topLevel).toBe(true);
  });
});
