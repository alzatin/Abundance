import { expect, test, describe, vi } from "vitest";

describe("G-code regeneration guard", () => {
  // Mock Gcode class with the guard logic
  class MockGcode {
    constructor() {
      this.isGenerating = false;
      this.processing = false;
      this.progress = 1.0;
    }

    async _generateGcode() {
      // Prevent multiple concurrent gcode generation processes
      if (this.isGenerating) {
        console.warn("G-code generation already in progress, ignoring new request");
        return;
      }

      // Initialize progress tracking
      this.progress = 0.0;
      this.processing = true;
      this.isGenerating = true;

      try {
        // Simulate generation process
        await this._generateSequentialGcode();
      } catch (err) {
        console.error("Error generating G-code:", err);
        this.progress = 1.0;
        this.processing = false;
        this.isGenerating = false;
        throw err;
      } finally {
        // Always reset the flag when generation completes
        this.isGenerating = false;
      }
    }

    async _generateSequentialGcode() {
      // Mock implementation - will be replaced by spy in tests
      return "mock-gcode";
    }
  }

  test("should prevent multiple concurrent gcode generation processes", async () => {
    // Create a mock Gcode instance
    const gcodeAtom = new MockGcode();
    
    // Spy on the generation method
    const generateSpy = vi.spyOn(gcodeAtom, "_generateSequentialGcode");
    generateSpy.mockImplementation(() => {
      // Simulate a slow generation process
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("mock-gcode-wire");
        }, 100);
      });
    });
    
    // Verify initial state
    expect(gcodeAtom.isGenerating).toBe(false);
    
    // Start first generation
    const firstGeneration = gcodeAtom._generateGcode();
    
    // Verify flag is set
    expect(gcodeAtom.isGenerating).toBe(true);
    
    // Try to start second generation immediately (should be ignored)
    const secondGeneration = gcodeAtom._generateGcode();
    
    // Wait for both to complete
    await Promise.all([firstGeneration, secondGeneration]);
    
    // Verify that _generateSequentialGcode was only called once
    expect(generateSpy).toHaveBeenCalledTimes(1);
    
    // Verify flag is reset
    expect(gcodeAtom.isGenerating).toBe(false);
  });
  
  test("should allow generation after previous one completes", async () => {
    // Create a mock Gcode instance
    const gcodeAtom = new MockGcode();
    
    // Spy on the generation method
    const generateSpy = vi.spyOn(gcodeAtom, "_generateSequentialGcode");
    generateSpy.mockResolvedValue("mock-gcode-wire");
    
    // First generation
    await gcodeAtom._generateGcode();
    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(gcodeAtom.isGenerating).toBe(false);
    
    // Second generation should be allowed after first completes
    await gcodeAtom._generateGcode();
    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(gcodeAtom.isGenerating).toBe(false);
  });
  
  test("should reset isGenerating flag on error", async () => {
    // Create a mock Gcode instance
    const gcodeAtom = new MockGcode();
    
    // Spy on the generation method to throw an error
    const generateSpy = vi.spyOn(gcodeAtom, "_generateSequentialGcode");
    generateSpy.mockRejectedValue(new Error("Test error"));
    
    // Verify initial state
    expect(gcodeAtom.isGenerating).toBe(false);
    
    // Start generation that will fail
    try {
      await gcodeAtom._generateGcode();
    } catch (err) {
      // Expected to throw
    }
    
    // Verify flag is reset even after error
    expect(gcodeAtom.isGenerating).toBe(false);
  });

  test("should track multiple rapid button clicks correctly", async () => {
    // Create a mock Gcode instance
    const gcodeAtom = new MockGcode();
    
    // Spy on the generation method
    const generateSpy = vi.spyOn(gcodeAtom, "_generateSequentialGcode");
    generateSpy.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve("mock-gcode"), 50);
      });
    });
    
    // Simulate rapid button clicks (5 times)
    const generations = [];
    for (let i = 0; i < 5; i++) {
      generations.push(gcodeAtom._generateGcode());
    }
    
    // Wait for all attempts to complete
    await Promise.all(generations);
    
    // Only the first click should trigger generation
    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(gcodeAtom.isGenerating).toBe(false);
  });
});
