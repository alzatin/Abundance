// Test file for worker error handling
import { beforeAll, describe, it, expect, vi } from "vitest";
import { init } from "../src/worker/util.js";
import { 
  circle, 
  rectangle, 
  move, 
  rotate, 
  scale,
  difference,
  intersect,
  assembly,
  extractAllTags,
  extractTag,
  isAssembly,
  extractParts
} from "../src/worker/worker.js";

describe("Worker error handling", () => {
  beforeAll(async () => {
    await init();
  });

  describe("geometry creation error handling", () => {
    it("should catch and handle errors in circle creation", async () => {
      // Mock console.warn to capture warning messages
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to create a circle with invalid parameters
        await circle("test-id", "invalid-diameter");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to create circle");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error creating circle"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in rectangle creation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to create a rectangle with invalid parameters
        await rectangle("test-id", null, undefined);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to create rectangle");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error creating rectangle"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });
  });

  describe("transformation error handling", () => {
    it("should catch and handle errors in move operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to move a non-existent geometry
        await move("non-existent-id", 1, 2, 3, "target-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to move geometry");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error moving geometry"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in rotate operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to rotate a non-existent geometry
        await rotate("non-existent-id", 45, 0, 0, "target-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to rotate geometry");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error rotating geometry"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in scale operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to scale a non-existent geometry
        await scale("non-existent-id", 2.0, "target-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to scale geometry");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error scaling geometry"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });
  });

  describe("boolean operation error handling", () => {
    it("should catch and handle errors in difference operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to perform difference with non-existent geometries
        await difference("result-id", "non-existent-1", "non-existent-2");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to perform difference operation");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error performing difference operation"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in intersect operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to perform intersect with non-existent geometries
        await intersect("non-existent-1", "non-existent-2", "result-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to perform intersect operation");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error performing intersect operation"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in assembly operation", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to create assembly with non-existent geometries
        await assembly(["non-existent-1", "non-existent-2"], "result-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to create assembly");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error creating assembly"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });
  });

  describe("utility function error handling", () => {
    it("should catch and handle errors in extractAllTags", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to extract tags from non-existent geometry
        await extractAllTags("non-existent-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to extract all tags");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error extracting all tags"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in extractTag", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to extract specific tag from non-existent geometry
        await extractTag("result-id", "non-existent-id", "some-tag");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to extract tag");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error extracting tag"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in isAssembly", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to check if non-existent geometry is assembly
        await isAssembly("non-existent-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to check if geometry is assembly");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error checking if geometry is assembly"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });

    it("should catch and handle errors in extractParts", async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      consoleSpy.mockImplementation(() => {});

      try {
        // Try to extract parts from non-existent assembly
        await extractParts("non-existent-id");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Failed to extract parts from assembly");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error extracting parts from assembly"),
          expect.anything()
        );
      }

      consoleSpy.mockRestore();
    });
  });
});