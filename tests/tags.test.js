// Direct unit tests for tags.js
import { tag, color, bom, extractAllTags } from "../src/worker/tags.js";

describe("tags.js", () => {
  let geometry;

  beforeEach(() => {
    geometry = {
      id: "geom1",
      // Fake geometry ok since tags don't perform any geometry operations
      geometry: [{ type: "circle", radius: 10 }],
      tags: [],
      color: null,
      bom: [],
    };
  });

  describe("tag operations", () => {
    it("should add tags to a geometry", () => {
      const tags = ["important", "red"];
      const result = tag(geometry, tags);

      expect(result.tags).toContain("important");
      expect(result.tags).toContain("red");
      expect(result.geometry).toHaveLength(1);
    });

    it("should add single tag to geometry", () => {
      const singleTag = ["feature"];
      const result = tag(geometry, singleTag);

      expect(result.tags).toContain("feature");
    });

    it("should preserve existing tags when adding new ones", () => {
      geometry.tags = ["initial"];
      const result = tag(geometry, ["additional"]);

      expect(result.tags).toContain("initial");
      expect(result.tags).toContain("additional");
    });
  });

  describe("color operations", () => {
    it("should apply color to geometry", () => {
      const colorValue = "#FF0000";
      const result = color(geometry, colorValue);

      expect(result.color).toBe(colorValue);
      expect(result.geometry).toHaveLength(1);
    });

    it("should automatically add keepout tag for specific color", () => {
      const keepoutColor = "#D9544D";
      const result = color(geometry, keepoutColor);

      expect(result.color).toBe(keepoutColor);
      expect(result.tags).toContain("keepout");
    });

    it("should handle different color formats", () => {
      const blueColor = "#0000FF";
      const result = color(geometry, blueColor);

      expect(result.color).toBe(blueColor);
    });
  });

  describe("BOM operations", () => {
    it("should add BOM entry to geometry", () => {
      const bomEntry = {
        name: "Circular Part",
        material: "Steel",
        quantity: 2,
        cost: 15.5,
      };
      const result = bom(geometry, bomEntry);

      expect(result.bom).toContain(bomEntry);
      expect(result.geometry).toHaveLength(1);
    });

    it("should handle multiple BOM entries", () => {
      const bomEntry1 = { name: "Part A", material: "Aluminum" };
      const bomEntry2 = { name: "Part B", material: "Plastic" };

      geometry = bom(geometry, bomEntry1);
      geometry = bom(geometry, bomEntry2);

      expect(geometry.bom).toContain(bomEntry1);
      expect(geometry.bom).toContain(bomEntry2);
    });
    // TODO: add tests for extracting BOM list, especially for assemblies.
  });

  describe("extractAllTags", () => {
    it("should extract all tags from geometry", () => {
      geometry.tags = ["tag1", "tag2", "tag3"];
      const allTags = extractAllTags(geometry);

      expect(Array.isArray(allTags)).toBe(true);
      expect(allTags).toContain("tag1");
      expect(allTags).toContain("tag2");
      expect(allTags).toContain("tag3");
    });

    it("should handle geometry with no tags", () => {
      geometry.tags = [];
      const allTags = extractAllTags(geometry);

      expect(Array.isArray(allTags)).toBe(true);
      expect(allTags[0]).toBe("Select Tag");
    });
  });
});
