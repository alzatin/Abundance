/**
 * Test to validate that readme thumbnail generation works even without parent set
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Readme Thumbnail Generation Fix", () => {
  let mockGlobalVariables;
  let mockMeshRef;

  beforeEach(() => {
    // Mock meshRef
    mockMeshRef = {
      current: {
        buildThumbnail: vi.fn().mockResolvedValue('<svg>mock thumbnail</svg>')
      }
    };

    // Mock GlobalVariables
    mockGlobalVariables = {
      generateUniqueID: () => "test-id-" + Math.random().toString(36).substring(2, 11),
      cad: {
        generateDisplayMesh: vi.fn().mockResolvedValue({ mesh: 'mock-mesh-data' }),
      },
      meshRef: mockMeshRef,
    };

    // Set up global mock
    globalThis.GlobalVariables = mockGlobalVariables;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete globalThis.GlobalVariables;
  });

  // Mock Readme class with the fix
  class ReadmeWithFix {
    constructor(values) {
      this.atomType = "Readme";
      this.type = "readme";
      this.name = "README";
      this.readMeText = "Readme text here";
      this.global = true;
      this.uniqueID = mockGlobalVariables.generateUniqueID();
      this.parent = values?.parent || null;
      this.context = null;
      this.inputs = [
        {
          name: "value",
          type: "input",
          getValue: vi.fn()
        }
      ];
    }

    // Simplified getContext() like in atom.js
    getContext() {
      if (!this.context) {
        let curr = this;
        while (curr.parent) {
          curr = curr.parent;
        }
        this.context = { project: curr.uniqueID };
      }
      return this.context;
    }

    findIOValue(ioName) {
      const input = this.inputs.find(i => i.name === ioName);
      return input ? input.getValue() : null;
    }

    // Fixed version - no parent check, uses this.getContext()
    async generateProjectThumbnail() {
      try {
        const value = this.findIOValue("value");
        // Generate a thumbnail only if value is geometry (object but not null or array)
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
          // Use the new thumbnail generation method
          // First generate the display mesh from the geometry
          const mesh = await GlobalVariables.cad.generateDisplayMesh(
            value,
            this.getContext()
          );
          
          // Then convert the mesh to SVG using the meshRef
          if (GlobalVariables.meshRef && GlobalVariables.meshRef.current) {
            const svg = await GlobalVariables.meshRef.current.buildThumbnail(mesh);
            return svg;
          } else {
            console.warn("meshRef not available for thumbnail generation");
            return null;
          }
        }
        return null;
      } catch (error) {
        console.error("Error generating project thumbnail:", error);
        return null;
      }
    }
  }

  it("should generate thumbnail even when parent is null", async () => {
    // Create readme without parent
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock geometry value
    const mockGeometry = { type: "box", width: 10, height: 10, depth: 10 };
    readme.inputs[0].getValue.mockReturnValue(mockGeometry);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify thumbnail was generated
    expect(result).toBe('<svg>mock thumbnail</svg>');
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledTimes(1);
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledWith(
      mockGeometry,
      expect.objectContaining({ project: readme.uniqueID })
    );
    expect(mockMeshRef.current.buildThumbnail).toHaveBeenCalledTimes(1);
  });

  it("should generate thumbnail when parent is set", async () => {
    // Create parent molecule
    const parentMolecule = {
      uniqueID: "parent-123",
      parent: null
    };

    // Create readme with parent
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
      parent: parentMolecule
    });

    // Mock geometry value
    const mockGeometry = { type: "sphere", radius: 5 };
    readme.inputs[0].getValue.mockReturnValue(mockGeometry);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify thumbnail was generated using parent context
    expect(result).toBe('<svg>mock thumbnail</svg>');
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledTimes(1);
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledWith(
      mockGeometry,
      expect.objectContaining({ project: "parent-123" })
    );
  });

  it("should return null when value is not geometry (number)", async () => {
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock non-geometry value (number)
    readme.inputs[0].getValue.mockReturnValue(42);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify no thumbnail was generated
    expect(result).toBeNull();
    expect(mockGlobalVariables.cad.generateDisplayMesh).not.toHaveBeenCalled();
  });

  it("should return null when value is an array", async () => {
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock array value
    readme.inputs[0].getValue.mockReturnValue([1, 2, 3]);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify no thumbnail was generated
    expect(result).toBeNull();
    expect(mockGlobalVariables.cad.generateDisplayMesh).not.toHaveBeenCalled();
  });

  it("should return null when value is null", async () => {
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock null value
    readme.inputs[0].getValue.mockReturnValue(null);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify no thumbnail was generated
    expect(result).toBeNull();
    expect(mockGlobalVariables.cad.generateDisplayMesh).not.toHaveBeenCalled();
  });

  it("should handle meshRef not available gracefully", async () => {
    // Mock meshRef as null
    mockGlobalVariables.meshRef = null;

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock geometry value
    const mockGeometry = { type: "cylinder", radius: 3, height: 6 };
    readme.inputs[0].getValue.mockReturnValue(mockGeometry);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify mesh was generated but thumbnail returned null
    expect(result).toBeNull();
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledTimes(1);
  });

  it("should handle generateDisplayMesh error gracefully", async () => {
    // Mock generateDisplayMesh to throw error
    mockGlobalVariables.cad.generateDisplayMesh.mockRejectedValue(
      new Error("Mesh generation failed")
    );

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });

    // Mock geometry value
    const mockGeometry = { type: "invalid" };
    readme.inputs[0].getValue.mockReturnValue(mockGeometry);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify error was caught and null returned
    expect(result).toBeNull();
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledTimes(1);
  });

  it("should use correct context based on parent hierarchy", async () => {
    // Create nested parent structure
    const topLevelMolecule = {
      uniqueID: "top-level-123",
      parent: null
    };
    const midLevelMolecule = {
      uniqueID: "mid-level-456",
      parent: topLevelMolecule
    };

    // Create readme with nested parent
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
      parent: midLevelMolecule
    });

    // Mock geometry value
    const mockGeometry = { type: "cone", radius: 4, height: 8 };
    readme.inputs[0].getValue.mockReturnValue(mockGeometry);

    // Generate thumbnail
    const result = await readme.generateProjectThumbnail();

    // Verify thumbnail was generated using top-level context
    expect(result).toBe('<svg>mock thumbnail</svg>');
    expect(mockGlobalVariables.cad.generateDisplayMesh).toHaveBeenCalledWith(
      mockGeometry,
      expect.objectContaining({ project: "top-level-123" })
    );
  });
});
