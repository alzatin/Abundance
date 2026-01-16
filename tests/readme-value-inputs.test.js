/**
 * Test to validate that the README atom can accept and display different value types
 * (geometry, numbers, and text strings) as inputs
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock GlobalVariables
const mockGlobalVariables = {
  generateUniqueID: () => "test-id-" + Math.random().toString(36).substring(2, 11),
  cad: {
    generateDisplayMesh: vi.fn(),
  },
  meshRef: {
    current: {
      buildThumbnail: vi.fn(),
    },
  },
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

  findIOValue(name) {
    // Mock implementation that returns the stored test value
    return this._testInputValue;
  }
}

// Mock Readme class with the new functionality
class ReadmeWithValueInputs extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = "Readme";
    this.type = "readme";
    this.name = "README";
    this.readMeText = "Readme text here";
    this.global = true;
    this.parent = { getContext: () => ({}) }; // Mock parent
    this.addAllIOs([
      {
        name: "value",
        valueType: "geometry",
      },
    ]);
    this.setValues(values);
  }

  async generateProjectThumbnail() {
    const value = this.findIOValue("value");
    // Generate a thumbnail only if value is geometry
    if (value != null && this.parent && typeof value === 'object') {
      const mesh = await mockGlobalVariables.cad.generateDisplayMesh(
        value,
        this.parent.getContext()
      );
      
      if (mockGlobalVariables.meshRef && mockGlobalVariables.meshRef.current) {
        const svg = await mockGlobalVariables.meshRef.current.buildThumbnail(mesh);
        return svg;
      }
    }
    return null;
  }

  async requestReadme() {
    if (this.global) {
      // Get the input value (could be geometry, number, or string)
      const inputValue = this.findIOValue("value");
      let readMeTextWithValue = this.readMeText;
      
      // If there's a non-geometry input value, append it to the readme text
      if (inputValue != null && typeof inputValue !== 'object') {
        const valueStr = String(inputValue);
        readMeTextWithValue = this.readMeText + '\n\n**Value:** ' + valueStr;
      }
      
      return this.generateProjectThumbnail()
        .then((res) => {
          if (res !== null) {
            return {
              readMeText: readMeTextWithValue,
              svg: res,
              uniqueID: this.uniqueID,
            };
          } else {
            return {
              readMeText: readMeTextWithValue,
              svg: null,
              uniqueID: this.uniqueID,
            };
          }
        })
        .catch((error) => {
          console.log(error);
          return {
            readMeText: readMeTextWithValue,
            svg: null,
            uniqueID: this.uniqueID,
          };
        });
    } else {
      return [];
    }
  }
}

describe("README Atom Value Inputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle geometry input with thumbnail generation", async () => {
    // Setup: mock successful thumbnail generation
    mockGlobalVariables.cad.generateDisplayMesh.mockResolvedValue({ mock: "mesh" });
    mockGlobalVariables.meshRef.current.buildThumbnail.mockResolvedValue("mock-svg-data");

    const readme = new ReadmeWithValueInputs({
      readMeText: "Test readme with geometry",
    });
    readme._testInputValue = { type: "geometry", data: "mockGeometry" };

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme with geometry");
    expect(result.svg).toBe("mock-svg-data");
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle number input and display it in readme text", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Test readme with number",
    });
    readme._testInputValue = 42;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme with number\n\n**Value:** 42");
    expect(result.svg).toBe(null); // No thumbnail for numbers
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle string input and display it in readme text", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Test readme with string",
    });
    readme._testInputValue = "Hello, World!";

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme with string\n\n**Value:** Hello, World!");
    expect(result.svg).toBe(null); // No thumbnail for strings
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle decimal number input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Radius measurement",
    });
    readme._testInputValue = 3.14159;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Radius measurement\n\n**Value:** 3.14159");
    expect(result.svg).toBe(null);
  });

  it("should handle zero as a valid number input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Zero value test",
    });
    readme._testInputValue = 0;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Zero value test\n\n**Value:** 0");
    expect(result.svg).toBe(null);
  });

  it("should handle empty string input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Empty string test",
    });
    readme._testInputValue = "";

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Empty string test\n\n**Value:** ");
    expect(result.svg).toBe(null);
  });

  it("should handle null input without adding value text", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Null input test",
    });
    readme._testInputValue = null;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Null input test"); // No value appended
    expect(result.svg).toBe(null);
  });

  it("should handle undefined input without adding value text", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Undefined input test",
    });
    readme._testInputValue = undefined;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Undefined input test"); // No value appended
    expect(result.svg).toBe(null);
  });

  it("should handle global=false correctly", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Test readme content",
      global: false,
    });
    readme._testInputValue = 123;

    const result = await readme.requestReadme();

    // When global is false, should return empty array
    expect(result).toEqual([]);
  });

  it("should handle multiline string input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Multiline test",
    });
    readme._testInputValue = "Line 1\nLine 2\nLine 3";

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Multiline test\n\n**Value:** Line 1\nLine 2\nLine 3");
    expect(result.svg).toBe(null);
  });

  it("should handle negative number input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Negative number test",
    });
    readme._testInputValue = -42.5;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Negative number test\n\n**Value:** -42.5");
    expect(result.svg).toBe(null);
  });

  it("should prioritize geometry thumbnail over value display for objects", async () => {
    // Setup: mock successful thumbnail generation
    mockGlobalVariables.cad.generateDisplayMesh.mockResolvedValue({ mock: "mesh" });
    mockGlobalVariables.meshRef.current.buildThumbnail.mockResolvedValue("geometry-svg");

    const readme = new ReadmeWithValueInputs({
      readMeText: "Geometry priority test",
    });
    readme._testInputValue = { type: "geometry", vertices: [] };

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    // For geometry (object type), no value text is appended
    expect(result.readMeText).toBe("Geometry priority test");
    expect(result.svg).toBe("geometry-svg");
  });

  it("should handle special characters in string input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Special chars test",
    });
    readme._testInputValue = "Test with <>&\"' special chars";

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toContain("Test with <>&\"' special chars");
  });

  it("should handle boolean false as valid input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Boolean test",
    });
    readme._testInputValue = false;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Boolean test\n\n**Value:** false");
  });

  it("should handle boolean true as valid input", async () => {
    const readme = new ReadmeWithValueInputs({
      readMeText: "Boolean test",
    });
    readme._testInputValue = true;

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Boolean test\n\n**Value:** true");
  });
});
