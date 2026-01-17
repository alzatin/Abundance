import { describe, it, expect } from "vitest";

/**
 * Test suite for InfoPanel search functionality
 * Tests the filtering logic that will be used in the InfoPanel component
 */
describe("InfoPanel Search Filtering", () => {
  // Sample methods data similar to what replicad API provides
  const sampleMethods = [
    { name: "Box", usage: "replicad.Box(x, y, z)", params: ["x", "y", "z"], returns: "Shape3D" },
    { name: "Sphere", usage: "replicad.Sphere(radius)", params: ["radius"], returns: "Shape3D" },
    { name: "Cylinder", usage: "replicad.Cylinder(radius, height)", params: ["radius", "height"], returns: "Shape3D" },
    { name: "Shape.fillet", usage: "shape.fillet(radius)", params: ["radius"], returns: "Shape3D" },
    { name: "Shape.chamfer", usage: "shape.chamfer(distance)", params: ["distance"], returns: "Shape3D" },
    { name: "drawRectangle", usage: "replicad.drawRectangle(width, height)", params: ["width", "height"], returns: "Sketch" },
    { name: "drawCircle", usage: "replicad.drawCircle(radius)", params: ["radius"], returns: "Sketch" },
  ];

  // Filtering function extracted from the InfoPanel component
  function filterMethods(methods, searchTerm) {
    if (!searchTerm.trim()) {
      return methods;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return methods.filter((method) =>
      method.name.toLowerCase().includes(lowerSearch)
    );
  }

  it("should return all methods when search term is empty", () => {
    const result = filterMethods(sampleMethods, "");
    expect(result).toHaveLength(7);
    expect(result).toEqual(sampleMethods);
  });

  it("should return all methods when search term is only whitespace", () => {
    const result = filterMethods(sampleMethods, "   ");
    expect(result).toHaveLength(7);
    expect(result).toEqual(sampleMethods);
  });

  it("should filter methods by exact name match", () => {
    const result = filterMethods(sampleMethods, "Box");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Box");
  });

  it("should filter methods case-insensitively", () => {
    const result = filterMethods(sampleMethods, "box");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Box");
  });

  it("should filter methods by partial name match", () => {
    const result = filterMethods(sampleMethods, "draw");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toEqual(["drawRectangle", "drawCircle"]);
  });

  it("should filter methods by shape prefix", () => {
    const result = filterMethods(sampleMethods, "Shape.");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toContain("Shape.fillet");
    expect(result.map(m => m.name)).toContain("Shape.chamfer");
  });

  it("should return empty array when no methods match", () => {
    const result = filterMethods(sampleMethods, "xyz123");
    expect(result).toHaveLength(0);
  });

  it("should handle special characters in search term", () => {
    const result = filterMethods(sampleMethods, ".");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toContain("Shape.fillet");
    expect(result.map(m => m.name)).toContain("Shape.chamfer");
  });

  it("should filter methods case-insensitively with mixed case", () => {
    const result = filterMethods(sampleMethods, "CiRcLe");
    expect(result).toHaveLength(1);
    expect(result.map(m => m.name)).toContain("drawCircle");
  });
});
