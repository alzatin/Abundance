/**
 * Tests for the code atom prompt generator
 */

import { describe, it, expect } from "vitest";
import { generateCodeAtomPrompt } from "../src/js/codeAtomPromptGenerator";

describe("Code Atom Prompt Generator", () => {
  it("should generate a non-empty prompt", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("should include Abundance methods in the prompt", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("Move");
    expect(prompt).toContain("Rotate");
    expect(prompt).toContain("Scale");
    expect(prompt).toContain("Assembly");
    expect(prompt).toContain("Fillet");
    expect(prompt).toContain("Chamfer");
  });

  it("should include input structure requirements", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("const Inputs");
    expect(prompt).toContain("inputName");
    expect(prompt).toContain("type");
    expect(prompt).toContain("defaultValue");
  });

  it("should include AbundanceObject structure", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("AbundanceObject");
    expect(prompt).toContain("geometry");
    expect(prompt).toContain("dimension");
    expect(prompt).toContain("tags");
    expect(prompt).toContain("color");
    expect(prompt).toContain("plane");
    expect(prompt).toContain("bom");
  });

  it("should include Replicad API information", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("replicad");
    expect(prompt).toContain("makePlane");
    expect(prompt).toContain("drawCircle");
    expect(prompt).toContain("extrude");
  });

  it("should include best practices", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("Best Practices");
    expect(prompt).toContain("await");
  });

  it("should include examples", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("Example");
    expect(prompt).toContain("library[");
  });

  it("should include common patterns", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("Common Patterns");
    expect(prompt).toContain("Importing and Using Geometry");
    expect(prompt).toContain("Creating New Geometry");
  });

  it("should include mistakes to avoid", () => {
    const prompt = generateCodeAtomPrompt();
    expect(prompt).toContain("Mistakes to Avoid");
    expect(prompt).toContain("❌");
  });
});
