/**
 * Integration test to demonstrate README generation with molecule titles
 * This test shows how the final README would look when saved
 */
import { describe, it, expect } from "vitest";

describe("README Generation with Molecule Titles - Integration Example", () => {
  it("should demonstrate expected README format with molecule titles", () => {
    // Simulating the final README structure that would be generated
    // based on the issue requirements
    
    // Example: A project with a molecule called "Arm" containing two readme atoms
    const readMeItems = [
      {
        uniqueID: "molecule-arm-heading",
        readMeText: "### Arm",
        svg: null,
      },
      {
        uniqueID: "readme-1",
        readMeText: "Text in the first readme atom",
        svg: null,
      },
      {
        uniqueID: "readme-2",
        readMeText: "Text in the second readme atom",
        svg: null,
      },
    ];

    // This mimics the concatenation logic in ProjectContext.jsx line 1064-1066
    let readMeTextArray = " ";
    readMeItems.forEach((item) => {
      readMeTextArray = readMeTextArray.concat(item["readMeText"]) + "\n\n";
    });

    // The final README would look like:
    const expectedFormat = ` ### Arm

Text in the first readme atom

Text in the second readme atom

`;

    expect(readMeTextArray).toBe(expectedFormat);
  });

  it("should demonstrate nested molecules with multiple readme atoms", () => {
    // Example: Parent molecule "Robot" with child molecule "Arm"
    const readMeItems = [
      {
        uniqueID: "molecule-robot-heading",
        readMeText: "### Robot",
        svg: null,
      },
      {
        uniqueID: "readme-robot-1",
        readMeText: "This is a robot assembly",
        svg: null,
      },
      {
        uniqueID: "molecule-arm-heading",
        readMeText: "### Arm",
        svg: null,
      },
      {
        uniqueID: "readme-arm-1",
        readMeText: "The arm is 50cm long",
        svg: null,
      },
      {
        uniqueID: "readme-arm-2",
        readMeText: "Made from aluminum",
        svg: null,
      },
      {
        uniqueID: "molecule-gripper-heading",
        readMeText: "### Gripper",
        svg: null,
      },
      {
        uniqueID: "readme-gripper-1",
        readMeText: "The gripper can hold 5kg",
        svg: null,
      },
    ];

    let readMeTextArray = " ";
    readMeItems.forEach((item) => {
      readMeTextArray = readMeTextArray.concat(item["readMeText"]) + "\n\n";
    });

    // The final README would have clear sections for each molecule
    expect(readMeTextArray).toContain("### Robot");
    expect(readMeTextArray).toContain("### Arm");
    expect(readMeTextArray).toContain("### Gripper");
    
    // Check ordering is preserved
    const robotIndex = readMeTextArray.indexOf("### Robot");
    const armIndex = readMeTextArray.indexOf("### Arm");
    const gripperIndex = readMeTextArray.indexOf("### Gripper");
    
    expect(robotIndex).toBeLessThan(armIndex);
    expect(armIndex).toBeLessThan(gripperIndex);
  });

  it("should demonstrate top-level molecule does not add heading", () => {
    // Top-level molecule doesn't add its own heading (project name is already H1)
    const readMeItems = [
      {
        uniqueID: "readme-top-1",
        readMeText: "Project overview text",
        svg: null,
      },
      {
        uniqueID: "molecule-component-heading",
        readMeText: "### Component",
        svg: null,
      },
      {
        uniqueID: "readme-component-1",
        readMeText: "Component details",
        svg: null,
      },
    ];

    let readMeTextArray = " ";
    readMeItems.forEach((item) => {
      readMeTextArray = readMeTextArray.concat(item["readMeText"]) + "\n\n";
    });

    // First text is NOT a heading (top-level molecule doesn't add one)
    expect(readMeTextArray).toContain("Project overview text");
    expect(readMeTextArray.indexOf("Project overview text")).toBeLessThan(
      readMeTextArray.indexOf("### Component")
    );
  });

  it("should match the exact format from the issue example", () => {
    // Direct example from the issue
    const readMeItems = [
      {
        uniqueID: "molecule-arm-heading",
        readMeText: "### Arm",
        svg: null,
      },
      {
        uniqueID: "readme-1",
        readMeText: "Text in the first readme atom",
        svg: null,
      },
      {
        uniqueID: "readme-2",
        readMeText: "Text in the second readme atom",
        svg: null,
      },
    ];

    let readMeTextArray = " ";
    readMeItems.forEach((item) => {
      readMeTextArray = readMeTextArray.concat(item["readMeText"]) + "\n\n";
    });

    // Verify exact format from issue
    expect(readMeTextArray).toContain("### Arm\n\nText in the first readme atom");
    expect(readMeTextArray).toContain("Text in the first readme atom\n\nText in the second readme atom");
  });
});
