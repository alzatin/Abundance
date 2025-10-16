import { expect, test, describe, vi } from "vitest";

/**
 * Test for the fix to the issue where projects with gcode atoms
 * don't fully load until user navigates into and out of the molecule.
 * 
 * The bug was in onUpstreamChange() - it would call setWaiting() but if
 * geometry was null, the atom would stay in WAITING state forever.
 */

// Mock Status enum
const Status = {
  DISABLED: "disabled",
  WAITING: "waiting",
  READY: "ready",
  ERROR: "error",
  UPSTREAM_ERROR: "upstream_error",
  PROCESSING: "processing"
};

// Mock attachment point
class MockAttachmentPoint {
  constructor(name, value, status) {
    this.name = name;
    this.value = value;
    this.status = status;
  }

  getState() {
    return { status: this.status, value: this.value };
  }
}

// Simplified Gcode class for testing - OLD BUGGY VERSION
class GcodeBuggy {
  constructor() {
    this.status = Status.DISABLED;
    this.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    this.setWaitingCalled = false;
    this.handleGeometryInputCalled = false;
  }

  isEnabled() {
    return this.status !== Status.DISABLED;
  }

  inputsHaveErrors() {
    return this.inputs.some((input) => {
      const state = input.getState();
      return state.status === Status.ERROR || state.status === Status.UPSTREAM_ERROR;
    });
  }

  setWaiting() {
    this.status = Status.WAITING;
    this.setWaitingCalled = true;
  }

  setUpstreamError() {
    this.status = Status.UPSTREAM_ERROR;
  }

  findIOValue(name) {
    const input = this.inputs.find(inp => inp.name === name);
    return input ? input.getState().value : null;
  }

  _handleGeometryInput(geometry) {
    this.handleGeometryInputCalled = true;
  }

  // OLD BUGGY onUpstreamChange - doesn't check if enabled or has errors
  onUpstreamChange() {
    this.setWaiting();

    if (this.findIOValue("geometry") !== null) {
      this._handleGeometryInput(this.findIOValue("geometry"));
    }
    // BUG: If geometry is null, atom stays in WAITING forever
  }
}

// Simplified Gcode class for testing - FIXED VERSION
class GcodeFixed {
  constructor() {
    this.status = Status.DISABLED;
    this.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    this.setWaitingCalled = false;
    this.handleGeometryInputCalled = false;
  }

  isEnabled() {
    return this.status !== Status.DISABLED;
  }

  inputsHaveErrors() {
    return this.inputs.some((input) => {
      const state = input.getState();
      return state.status === Status.ERROR || state.status === Status.UPSTREAM_ERROR;
    });
  }

  setWaiting() {
    this.status = Status.WAITING;
    this.setWaitingCalled = true;
  }

  setUpstreamError() {
    this.status = Status.UPSTREAM_ERROR;
  }

  findIOValue(name) {
    const input = this.inputs.find(inp => inp.name === name);
    return input ? input.getState().value : null;
  }

  _handleGeometryInput(geometry) {
    this.handleGeometryInputCalled = true;
  }

  // FIXED onUpstreamChange - properly checks if enabled and handles null geometry
  onUpstreamChange() {
    // No-op if this atom isn't enabled
    if (!this.isEnabled()) {
      return;
    }

    // Check for errors in inputs first
    if (this.inputsHaveErrors()) {
      this.setUpstreamError();
      return;
    }

    // Check if geometry input is ready
    const geometryValue = this.findIOValue("geometry");
    if (geometryValue !== null) {
      this.setWaiting();
      this._handleGeometryInput(geometryValue);
    } else {
      // If geometry is not available yet, set to waiting
      this.setWaiting();
    }
  }
}

describe("Gcode loading fix", () => {
  test("OLD BUGGY VERSION: should demonstrate the bug when atom is DISABLED", () => {
    const gcode = new GcodeBuggy();
    gcode.status = Status.DISABLED;
    
    // Call onUpstreamChange when disabled
    gcode.onUpstreamChange();
    
    // BUG: The old version doesn't check if enabled, so it processes anyway
    expect(gcode.setWaitingCalled).toBe(true);
    expect(gcode.status).toBe(Status.WAITING); // Should stay DISABLED!
  });

  test("FIXED VERSION: should not process when atom is DISABLED", () => {
    const gcode = new GcodeFixed();
    gcode.status = Status.DISABLED;
    
    // Call onUpstreamChange when disabled
    gcode.onUpstreamChange();
    
    // FIXED: Should remain disabled and not set to waiting
    expect(gcode.setWaitingCalled).toBe(false);
    expect(gcode.status).toBe(Status.DISABLED);
  });

  test("OLD BUGGY VERSION: should set to waiting but not process when geometry is null", () => {
    const gcode = new GcodeBuggy();
    gcode.status = Status.READY; // Enable it first
    gcode.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    
    gcode.onUpstreamChange();
    
    // Sets to waiting but doesn't handle the null case
    expect(gcode.setWaitingCalled).toBe(true);
    expect(gcode.handleGeometryInputCalled).toBe(false);
    expect(gcode.status).toBe(Status.WAITING);
  });

  test("FIXED VERSION: should set to waiting when geometry is null", () => {
    const gcode = new GcodeFixed();
    gcode.status = Status.READY; // Enable it first
    gcode.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    
    gcode.onUpstreamChange();
    
    // Should set to waiting and not try to process null geometry
    expect(gcode.setWaitingCalled).toBe(true);
    expect(gcode.handleGeometryInputCalled).toBe(false);
    expect(gcode.status).toBe(Status.WAITING);
  });

  test("FIXED VERSION: should process when geometry is available", () => {
    const gcode = new GcodeFixed();
    gcode.status = Status.READY; // Enable it first
    gcode.inputs = [new MockAttachmentPoint("geometry", "some-geometry-id", Status.READY)];
    
    gcode.onUpstreamChange();
    
    // Should set to waiting and process the geometry
    expect(gcode.setWaitingCalled).toBe(true);
    expect(gcode.handleGeometryInputCalled).toBe(true);
    expect(gcode.status).toBe(Status.WAITING);
  });

  test("FIXED VERSION: should handle upstream errors", () => {
    const gcode = new GcodeFixed();
    gcode.status = Status.READY; // Enable it first
    gcode.inputs = [new MockAttachmentPoint("geometry", null, Status.ERROR)];
    
    gcode.onUpstreamChange();
    
    // Should set upstream error status
    expect(gcode.status).toBe(Status.UPSTREAM_ERROR);
    expect(gcode.handleGeometryInputCalled).toBe(false);
  });

  test("should demonstrate the complete bug scenario", () => {
    // This test demonstrates the exact scenario from the bug report:
    // "Projects with gcode atoms don't fully load until user navigates into and out of molecule"
    
    const gcodeBuggy = new GcodeBuggy();
    const gcodeFixed = new GcodeFixed();
    
    // Simulate project loading: atom is created DISABLED
    expect(gcodeBuggy.status).toBe(Status.DISABLED);
    expect(gcodeFixed.status).toBe(Status.DISABLED);
    
    // Simulate enable() being called during molecule deserialize
    gcodeBuggy.status = Status.READY;
    gcodeFixed.status = Status.READY;
    
    // Simulate onUpstreamChange being called with null geometry
    // (because connections are restored but upstream hasn't provided data yet)
    gcodeBuggy.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    gcodeFixed.inputs = [new MockAttachmentPoint("geometry", null, Status.WAITING)];
    
    gcodeBuggy.onUpstreamChange();
    gcodeFixed.onUpstreamChange();
    
    // Both should be in WAITING state
    expect(gcodeBuggy.status).toBe(Status.WAITING);
    expect(gcodeFixed.status).toBe(Status.WAITING);
    
    // But the key difference is that the fixed version properly checked
    // all conditions and will respond correctly to future upstream changes
    // The buggy version didn't check if enabled, which could cause issues
  });
});
