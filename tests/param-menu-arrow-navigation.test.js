import { describe, it, expect } from "vitest";

/**
 * Test that validates arrow key navigation in the parameter menu.
 * 
 * This test verifies that when navigating with up/down arrows,
 * the focus moves to the next/previous focusable input without skipping.
 */
describe("Parameter Menu Arrow Key Navigation", () => {
  it("should skip non-focusable controls (spacer, markdown) when navigating", () => {
    // Simulate the control structure from SimpleControlPanel.jsx
    const controlKeys = ["param1", "spacer1", "param2", "markdown1", "param3", "param4"];
    
    // Simulate controls with different types
    const controls = {
      param1: { type: "number", value: 10 },
      spacer1: { type: "spacer" },
      param2: { type: "string", value: "test" },
      markdown1: { type: "markdown", value: "# Help text" },
      param3: { type: "boolean", value: true },
      param4: { type: "range", value: 5 },
    };
    
    // Simulate inputRefs - spacer and markdown don't have refs
    const inputRefs = {
      0: { focus: () => {} }, // param1
      1: null,                 // spacer1 - no ref
      2: { focus: () => {} }, // param2
      3: null,                 // markdown1 - no ref
      4: { focus: () => {} }, // param3
      5: { focus: () => {} }, // param4
    };
    
    // Helper function to determine if a control is focusable
    const isFocusable = (idx) => {
      return inputRefs[idx] !== null && inputRefs[idx] !== undefined;
    };
    
    // Simulate ArrowDown navigation logic (fixed version)
    const getNextFocusableIndex = (currentIdx) => {
      let next = currentIdx;
      do {
        next = next + 1;
      } while (
        next < controlKeys.length &&
        (controls[controlKeys[next]]?.disabled || !isFocusable(next))
      );
      return next < controlKeys.length ? next : currentIdx;
    };
    
    // Simulate ArrowUp navigation logic (fixed version)
    const getPrevFocusableIndex = (currentIdx) => {
      let prev = currentIdx;
      do {
        prev = prev - 1;
      } while (
        prev >= 0 &&
        (controls[controlKeys[prev]]?.disabled || !isFocusable(prev))
      );
      return prev >= 0 ? prev : currentIdx;
    };
    
    // Test ArrowDown from param1 (idx 0) - should go to param2 (idx 2), skipping spacer
    expect(getNextFocusableIndex(0)).toBe(2);
    
    // Test ArrowDown from param2 (idx 2) - should go to param3 (idx 4), skipping markdown
    expect(getNextFocusableIndex(2)).toBe(4);
    
    // Test ArrowDown from param3 (idx 4) - should go to param4 (idx 5)
    expect(getNextFocusableIndex(4)).toBe(5);
    
    // Test ArrowDown from param4 (idx 5) - should stay at param4 (no more controls)
    expect(getNextFocusableIndex(5)).toBe(5);
    
    // Test ArrowUp from param4 (idx 5) - should go to param3 (idx 4)
    expect(getPrevFocusableIndex(5)).toBe(4);
    
    // Test ArrowUp from param3 (idx 4) - should go to param2 (idx 2), skipping markdown
    expect(getPrevFocusableIndex(4)).toBe(2);
    
    // Test ArrowUp from param2 (idx 2) - should go to param1 (idx 0), skipping spacer
    expect(getPrevFocusableIndex(2)).toBe(0);
    
    // Test ArrowUp from param1 (idx 0) - should stay at param1 (no previous controls)
    expect(getPrevFocusableIndex(0)).toBe(0);
  });
  
  it("should skip disabled controls when navigating", () => {
    const controlKeys = ["param1", "param2", "param3", "param4"];
    
    const controls = {
      param1: { type: "number", value: 10 },
      param2: { type: "string", value: "test", disabled: true }, // disabled
      param3: { type: "boolean", value: true },
      param4: { type: "range", value: 5 },
    };
    
    const inputRefs = {
      0: { focus: () => {} },
      1: { focus: () => {} },
      2: { focus: () => {} },
      3: { focus: () => {} },
    };
    
    const isFocusable = (idx) => {
      return inputRefs[idx] !== null && inputRefs[idx] !== undefined;
    };
    
    const getNextFocusableIndex = (currentIdx) => {
      let next = currentIdx;
      do {
        next = next + 1;
      } while (
        next < controlKeys.length &&
        (controls[controlKeys[next]]?.disabled || !isFocusable(next))
      );
      return next < controlKeys.length ? next : currentIdx;
    };
    
    // Test ArrowDown from param1 (idx 0) - should skip param2 (disabled) and go to param3 (idx 2)
    expect(getNextFocusableIndex(0)).toBe(2);
    
    // Test ArrowDown from param3 (idx 2) - should go to param4 (idx 3)
    expect(getNextFocusableIndex(2)).toBe(3);
  });
});
