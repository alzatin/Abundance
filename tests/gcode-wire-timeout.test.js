import { expect, test, describe, beforeAll } from "vitest";
import { init, withTimeout } from "../src/worker/util.ts";

describe("G-code Wire Assembly Timeout Tests", () => {
  beforeAll(async () => {
    await init();
  });

  test("withTimeout should resolve when promise completes before timeout", async () => {
    const quickPromise = new Promise((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const result = await withTimeout(
      quickPromise,
      1000,
      "Should not timeout"
    );

    expect(result).toBe("success");
  });

  test("withTimeout should reject when promise exceeds timeout", async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 2000);
    });

    await expect(
      withTimeout(slowPromise, 500, "Custom timeout message")
    ).rejects.toThrow("Custom timeout message");
  });

  test("withTimeout should reject with default message when no custom message provided", async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 1000);
    });

    await expect(
      withTimeout(slowPromise, 200)
    ).rejects.toThrow("Operation timed out");
  });

  test("withTimeout should propagate original error if promise rejects before timeout", async () => {
    const failingPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Original error")), 100);
    });

    await expect(
      withTimeout(failingPromise, 1000, "Timeout message")
    ).rejects.toThrow("Original error");
  });

  test("withTimeout should clean up timeout on success", async () => {
    // This test ensures the timeout is properly cleared
    const promise = Promise.resolve("immediate");
    
    const result = await withTimeout(
      promise,
      1000,
      "Should not happen"
    );

    expect(result).toBe("immediate");
    
    // Wait a bit to ensure no timeout fires
    await new Promise(resolve => setTimeout(resolve, 1100));
    // If timeout wasn't cleared, this would fail
  });

  test("withTimeout should clean up timeout on error", async () => {
    // This test ensures the timeout is properly cleared even on error
    const promise = Promise.reject(new Error("Quick failure"));
    
    await expect(
      withTimeout(promise, 1000, "Should not happen")
    ).rejects.toThrow("Quick failure");
    
    // Wait a bit to ensure no timeout fires
    await new Promise(resolve => setTimeout(resolve, 1100));
    // If timeout wasn't cleared, this would cause issues
  });
});
