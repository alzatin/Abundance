// Test to validate that readme atom handles errors during save without crashing
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock GlobalVariables
const mockGlobalVariables = {
  generateUniqueID: () => "test-id-" + Math.random().toString(36).substr(2, 9),
  cad: {
    generateThumbnail: vi.fn(),
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
      for (var key in values) {
        this[key] = values[key];
      }
    }
  }

  addAllIOs(ios) {
    this.inputs = ios;
  }

  findIOValue(name) {
    return null;
  }
}

// Mock Readme class with the fix
class ReadmeWithFix extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = "Readme";
    this.type = "readme";
    this.name = "README";
    this.readMeText = "Readme text here";
    this.global = true;
    this.addAllIOs([
      {
        name: "geometry",
        valueType: "geometry",
      },
    ]);
    this.setValues(values);
  }

  async generateProjectThumbnail() {
    const geometry = this.findIOValue("geometry");
    if (geometry != null) {
      return mockGlobalVariables.cad.generateThumbnail(geometry);
    }
    return null;
  }

  async requestReadme() {
    if (this.global) {
      return this.generateProjectThumbnail()
        .then((res) => {
          if (res !== null) {
            return {
              readMeText: this.readMeText,
              svg: res,
              uniqueID: this.uniqueID,
            };
          } else {
            return {
              readMeText: this.readMeText,
              svg: null,
              uniqueID: this.uniqueID,
            };
          }
        })
        .catch((error) => {
          console.log(error);
          // FIX: Return a proper value instead of undefined
          return {
            readMeText: this.readMeText,
            svg: null,
            uniqueID: this.uniqueID,
          };
        });
    } else {
      return [];
    }
  }
}

// Mock Readme class WITHOUT the fix (old version)
class ReadmeWithoutFix extends MockAtom {
  constructor(values) {
    super(values);
    this.atomType = "Readme";
    this.type = "readme";
    this.name = "README";
    this.readMeText = "Readme text here";
    this.global = true;
    this.addAllIOs([
      {
        name: "geometry",
        valueType: "geometry",
      },
    ]);
    this.setValues(values);
  }

  async generateProjectThumbnail() {
    const geometry = this.findIOValue("geometry");
    if (geometry != null) {
      return mockGlobalVariables.cad.generateThumbnail(geometry);
    }
    return null;
  }

  async requestReadme() {
    if (this.global) {
      return this.generateProjectThumbnail()
        .then((res) => {
          if (res !== null) {
            return {
              readMeText: this.readMeText,
              svg: res,
              uniqueID: this.uniqueID,
            };
          } else {
            return {
              readMeText: this.readMeText,
              svg: null,
              uniqueID: this.uniqueID,
            };
          }
        })
        .catch((error) => {
          console.log(error);
          // BUG: No return statement - returns undefined
        });
    } else {
      return [];
    }
  }
}

// Mock molecule processing function (simplified version of molecule.js requestReadme)
async function processReadmeValuesWithFix(atoms) {
  const promiseArray = atoms.map((atom) => atom.requestReadme());
  let finalReadMe = [];

  await Promise.all(promiseArray).then((values) => {
    values.forEach((value) => {
      // FIX: Check for undefined/null values
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
          text = text.concat(
            " \n\n![readme](/readme" + value.uniqueID + ".svg)\n\n"
          );
        }
        finalReadMe.push({
          uniqueID: value.uniqueID,
          readMeText: text,
          svg: value.svg,
        });
      }
    });
  });
  return finalReadMe;
}

// Mock molecule processing WITHOUT the fix
async function processReadmeValuesWithoutFix(atoms) {
  const promiseArray = atoms.map((atom) => atom.requestReadme());
  let finalReadMe = [];

  await Promise.all(promiseArray).then((values) => {
    values.forEach((value) => {
      // BUG: No check for undefined/null values
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
        text = value.readMeText; // This will crash if value is undefined
        if (value.svg) {
          text = text.concat(
            " \n\n![readme](/readme" + value.uniqueID + ".svg)\n\n"
          );
        }
        finalReadMe.push({
          uniqueID: value.uniqueID,
          readMeText: text,
          svg: value.svg,
        });
      }
    });
  });
  return finalReadMe;
}

describe("Readme Error Handling During Save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle generateThumbnail success correctly", async () => {
    // Setup: mock successful thumbnail generation
    mockGlobalVariables.cad.generateThumbnail.mockResolvedValue("mock-svg-data");

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme content");
    expect(result.svg).toBe("mock-svg-data");
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle generateThumbnail returning null correctly", async () => {
    // Setup: mock thumbnail generation returning null
    mockGlobalVariables.cad.generateThumbnail.mockResolvedValue(null);

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const result = await readme.requestReadme();

    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme content");
    expect(result.svg).toBe(null);
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle generateThumbnail error with FIX - returns valid object", async () => {
    // Setup: mock thumbnail generation throwing error
    mockGlobalVariables.cad.generateThumbnail.mockRejectedValue(
      new Error("Thumbnail generation failed")
    );

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const result = await readme.requestReadme();

    // With the fix, we should get a valid object even when there's an error
    expect(result).toBeDefined();
    expect(result.readMeText).toBe("Test readme content");
    expect(result.svg).toBe(null);
    expect(result.uniqueID).toBeDefined();
  });

  it("should handle generateThumbnail error WITHOUT fix - returns undefined", async () => {
    // Setup: mock thumbnail generation throwing error
    mockGlobalVariables.cad.generateThumbnail.mockRejectedValue(
      new Error("Thumbnail generation failed")
    );

    const readme = new ReadmeWithoutFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const result = await readme.requestReadme();

    // Without the fix, result will be undefined
    expect(result).toBeUndefined();
  });

  it("should process readme values with fix when error occurs", async () => {
    // Setup: mock thumbnail generation throwing error
    mockGlobalVariables.cad.generateThumbnail.mockRejectedValue(
      new Error("Thumbnail generation failed")
    );

    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const atoms = [readme];
    const result = await processReadmeValuesWithFix(atoms);

    // With the fix, processing should complete without error
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].readMeText).toBe("Test readme content");
    expect(result[0].svg).toBe(null);
  });

  it("should fail to process readme values without fix when error occurs", async () => {
    // Setup: mock thumbnail generation throwing error
    mockGlobalVariables.cad.generateThumbnail.mockRejectedValue(
      new Error("Thumbnail generation failed")
    );

    const readme = new ReadmeWithoutFix({
      readMeText: "Test readme content",
    });
    readme.findIOValue = vi.fn().mockReturnValue({ mock: "geometry" });

    const atoms = [readme];

    // Without the fix, this should throw an error
    await expect(processReadmeValuesWithoutFix(atoms)).rejects.toThrow();
  });

  it("should handle global=false correctly", async () => {
    const readme = new ReadmeWithFix({
      readMeText: "Test readme content",
      global: false,
    });

    const result = await readme.requestReadme();

    // When global is false, should return empty array
    expect(result).toEqual([]);
  });

  it("should process multiple readme atoms including one with error", async () => {
    // Setup: first atom succeeds, second atom fails
    mockGlobalVariables.cad.generateThumbnail
      .mockResolvedValueOnce("svg-data-1")
      .mockRejectedValueOnce(new Error("Thumbnail generation failed"));

    const readme1 = new ReadmeWithFix({
      readMeText: "First readme",
    });
    readme1.findIOValue = vi.fn().mockReturnValue({ mock: "geometry1" });

    const readme2 = new ReadmeWithFix({
      readMeText: "Second readme",
    });
    readme2.findIOValue = vi.fn().mockReturnValue({ mock: "geometry2" });

    const atoms = [readme1, readme2];
    const result = await processReadmeValuesWithFix(atoms);

    // With the fix, both should be processed
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    // First readme has SVG, so text will include SVG reference
    expect(result[0].readMeText).toContain("First readme");
    expect(result[0].svg).toBe("svg-data-1");
    expect(result[1].readMeText).toBe("Second readme");
    expect(result[1].svg).toBe(null); // Error case returns null svg
  });
});
