import {
  rectangle,
  circle,
  regularPolygon,
  text,
} from "../src/worker/shapes.ts";
import { init, is3D, defaultColor } from "../src/worker/util.ts";

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function vectorEquals(vector, x, y, z) {
  // vector is an array [x, y, z]
  expect(vector[0]).toEqual(x);
  expect(vector[1]).toEqual(y);
  expect(vector[2]).toEqual(z);
}

describe("shapes.js", () => {
  const context = { project: "test-shapes" };
  
  beforeAll(async () => {
    await init();
  });

  describe("circle", () => {
    it("should create a circle with specified diameter", async () => {
      const diameter = 95;

      const result = await circle(diameter, context);

      expect(result).toBeDefined();
      expect(result.geometry).toBeDefined();
      expect(typeof result.geometry).toBe('string'); // geometry is an ID
      expect(is3D(result)).toBe(false);
      expect(result.tags).toEqual([]);
      expect(result.color).toEqual(defaultColor);
      expect(result.bom).toEqual([]);

      vectorEquals(result.plane.normal, 0, 0, 1);
      vectorEquals(result.plane.origin, 0, 0, 0);
    });
  });

  describe("rectangle", () => {
    it("should create a rectangle with specified dimensions", async () => {
      const width = 90;
      const height = 5;

      const result = await rectangle(width, height, context);

      expect(result).toBeDefined();
      expect(result.geometry).toBeDefined();
      expect(typeof result.geometry).toBe('string'); // geometry is an ID
      expect(is3D(result)).toBe(false);
      expect(result.tags).toEqual([]);
      expect(result.color).toEqual(defaultColor);
      expect(result.bom).toEqual([]);

      // Check plane is the default XY plane
      vectorEquals(result.plane.normal, 0, 0, 1);
      vectorEquals(result.plane.origin, 0, 0, 0);
    });
  });

  describe("regularPolygon", () => {
    it("should create a triangle (3-sided polygon)", async () => {
      const radius = 9;
      const sides = 3;

      const result = await regularPolygon(radius, sides, context);

      expect(result).toBeDefined();
      expect(result.geometry).toBeDefined();
      expect(typeof result.geometry).toBe('string'); // geometry is an ID
      expect(is3D(result)).toBe(false);
      expect(result.tags).toEqual([]);
      expect(result.color).toEqual(defaultColor);
      expect(result.bom).toEqual([]);

      // Check plane is the default XY plane
      vectorEquals(result.plane.normal, 0, 0, 1);
      vectorEquals(result.plane.origin, 0, 0, 0);
    });
  });
});
