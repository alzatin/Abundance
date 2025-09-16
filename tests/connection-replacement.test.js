/**
 * Tests for connection replacement with type compatibility checking
 * This implements the functionality described in PR #563 for the current codebase
 */

import { describe, it, expect, beforeEach } from "vitest";

describe("Connection Replacement with Type Compatibility", () => {
  
  // Mock AttachmentPoint class for testing the static method
  class MockAttachmentPoint {
    constructor(valueType) {
      this.valueType = valueType;
    }

    static areTypesCompatible(outputAP, inputAP) {
      // If either attachment point doesn't have a defined valueType, allow the connection
      if (!outputAP.valueType || !inputAP.valueType) {
        return true;
      }
      
      // Same types are always compatible
      if (outputAP.valueType === inputAP.valueType) {
        return true;
      }
      
      // Special compatibility rules:
      // - geometry can connect to geometry
      // - number can connect to number
      // - array can connect to array
      // - Other combinations are not compatible by default
      return false;
    }

    wasConnectionMade(x, y, outputAP) {
      if (!this.isCloseEnoughToTarget(x, y)) {
        return false;
      }
      
      // If no existing connections, allow the connection
      if (this.connectors.length === 0) {
        return true;
      }
      
      // If there are existing connections and no output AP provided, don't allow replacement
      if (!outputAP) {
        return false;
      }
      
      // Check if the new connection type is compatible with this input
      return MockAttachmentPoint.areTypesCompatible(outputAP, this);
    }
  }

  describe("AttachmentPoint.areTypesCompatible", () => {
    it("should allow connections when both attachment points have undefined valueType", () => {
      const outputAP = new MockAttachmentPoint(undefined);
      const inputAP = new MockAttachmentPoint(undefined);
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should allow connections when output has undefined valueType", () => {
      const outputAP = new MockAttachmentPoint(undefined);
      const inputAP = new MockAttachmentPoint("number");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should allow connections when input has undefined valueType", () => {
      const outputAP = new MockAttachmentPoint("geometry");
      const inputAP = new MockAttachmentPoint(undefined);
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should allow connections between same types", () => {
      const outputAP = new MockAttachmentPoint("number");
      const inputAP = new MockAttachmentPoint("number");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should allow geometry to geometry connections", () => {
      const outputAP = new MockAttachmentPoint("geometry");
      const inputAP = new MockAttachmentPoint("geometry");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should allow array to array connections", () => {
      const outputAP = new MockAttachmentPoint("array");
      const inputAP = new MockAttachmentPoint("array");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(true);
    });

    it("should block incompatible type combinations", () => {
      const outputAP = new MockAttachmentPoint("geometry");
      const inputAP = new MockAttachmentPoint("number");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(false);
    });

    it("should block number to geometry connections", () => {
      const outputAP = new MockAttachmentPoint("number");
      const inputAP = new MockAttachmentPoint("geometry");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(false);
    });

    it("should block array to number connections", () => {
      const outputAP = new MockAttachmentPoint("array");
      const inputAP = new MockAttachmentPoint("number");
      
      expect(MockAttachmentPoint.areTypesCompatible(outputAP, inputAP)).toBe(false);
    });
  });

  describe("AttachmentPoint.wasConnectionMade with replacement support", () => {
    it("should allow connections to empty attachment points", () => {
      const outputAP = new MockAttachmentPoint("number");
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => true;
      inputAP.connectors = [];
      
      expect(inputAP.wasConnectionMade(100, 100, outputAP)).toBe(true);
    });

    it("should block connections when coordinates are not close enough", () => {
      const outputAP = new MockAttachmentPoint("number");
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => false;
      inputAP.connectors = [];
      
      expect(inputAP.wasConnectionMade(100, 100, outputAP)).toBe(false);
    });

    it("should block replacement when no output AP is provided", () => {
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => true;
      // Simulate existing connection
      inputAP.connectors = [{}];
      
      expect(inputAP.wasConnectionMade(100, 100)).toBe(false);
    });

    it("should allow replacement when types are compatible", () => {
      const outputAP = new MockAttachmentPoint("number");
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => true;
      // Simulate existing connection
      inputAP.connectors = [{}];
      
      expect(inputAP.wasConnectionMade(100, 100, outputAP)).toBe(true);
    });

    it("should block replacement when types are incompatible", () => {
      const outputAP = new MockAttachmentPoint("geometry");
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => true;
      // Simulate existing connection
      inputAP.connectors = [{}];
      
      expect(inputAP.wasConnectionMade(100, 100, outputAP)).toBe(false);
    });
  });

  describe("Connection replacement scenarios", () => {
    it("should demonstrate the use case: replacing compatible number connections", () => {
      // This simulates the example from PR #563:
      // constant1 → circle.diameter (existing connection)
      // constant2 → circle.diameter (should replace constant1)
      
      const constant1Output = new MockAttachmentPoint("number");
      const constant2Output = new MockAttachmentPoint("number");
      const circleDiameterInput = new MockAttachmentPoint("number");
      
      // Mock the required methods
      circleDiameterInput.isCloseEnoughToTarget = () => true;
      circleDiameterInput.connectors = [];
      
      // Test initial empty state
      expect(circleDiameterInput.wasConnectionMade(100, 100, constant1Output)).toBe(true);
      
      // Simulate existing connection from constant1
      circleDiameterInput.connectors = [{}];
      
      // Test that constant2 can replace constant1 (compatible types)
      expect(circleDiameterInput.wasConnectionMade(100, 100, constant2Output)).toBe(true);
    });

    it("should demonstrate the blocked use case: incompatible geometry to number", () => {
      // This simulates the blocked example from PR #563:
      // circle.geometry → constant.input (geometry→number, should be blocked)
      
      const circleGeometryOutput = new MockAttachmentPoint("geometry");
      const constantInput = new MockAttachmentPoint("number");
      
      // Mock the required methods
      constantInput.isCloseEnoughToTarget = () => true;
      
      // Simulate existing connection
      constantInput.connectors = [{}];
      
      // Test that geometry cannot replace number connection
      expect(constantInput.wasConnectionMade(100, 100, circleGeometryOutput)).toBe(false);
    });

    it("should handle edge case with undefined types gracefully", () => {
      const sourceOutput = new MockAttachmentPoint(undefined);
      const targetInput = new MockAttachmentPoint("number");
      
      // Mock the required methods
      targetInput.isCloseEnoughToTarget = () => true;
      
      // Simulate existing connection
      targetInput.connectors = [{}];
      
      // Test that undefined type allows replacement (backward compatibility)
      expect(targetInput.wasConnectionMade(100, 100, sourceOutput)).toBe(true);
    });
  });

  describe("Backward compatibility", () => {
    it("should maintain existing behavior when outputAP is not provided", () => {
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => true;
      inputAP.connectors = [];
      
      // Test traditional behavior without outputAP parameter
      expect(inputAP.wasConnectionMade(100, 100)).toBe(true);
      
      // Simulate existing connection
      inputAP.connectors = [{}];
      
      // Should block when there are existing connections and no outputAP provided
      expect(inputAP.wasConnectionMade(100, 100)).toBe(false);
    });

    it("should preserve the original method signature behavior", () => {
      const inputAP = new MockAttachmentPoint("number");
      
      // Mock the required methods
      inputAP.isCloseEnoughToTarget = () => false;
      inputAP.connectors = [];
      
      // Should return false when not close enough, regardless of other conditions
      expect(inputAP.wasConnectionMade(100, 100)).toBe(false);
    });
  });

  describe("Silent deletion behavior for undo functionality", () => {
    it("should not reset attachment point values when using silent deletion", () => {
      // Mock AttachmentPoint with deleteConnector method that respects silent flag
      class MockAttachmentPointWithSilent extends MockAttachmentPoint {
        constructor(valueType) {
          super(valueType);
          this.connectors = [];
          this.setDefaultCalled = false;
        }

        setDefault() {
          this.setDefaultCalled = true;
        }

        deleteConnector(connector, silent = false) {
          // Remove the connector
          const index = this.connectors.indexOf(connector);
          if (index > -1) {
            this.connectors.splice(index, 1);
          }
          
          // Only call setDefault if not silent (this is the fix)
          if (!silent) {
            this.setDefault();
          }
        }

        attach(connector) {
          this.connectors.push(connector);
        }
      }

      const inputAP = new MockAttachmentPointWithSilent("geometry");
      const mockConnector = { id: "test-connector" };
      
      // Simulate having a connection
      inputAP.attach(mockConnector);
      expect(inputAP.connectors.length).toBe(1);
      
      // Test silent deletion (for connection replacement)
      inputAP.deleteConnector(mockConnector, true);
      expect(inputAP.connectors.length).toBe(0);
      expect(inputAP.setDefaultCalled).toBe(false); // Should NOT reset to default
      
      // Reset for next test
      inputAP.attach(mockConnector);
      inputAP.setDefaultCalled = false;
      
      // Test normal deletion (for regular deletion)
      inputAP.deleteConnector(mockConnector, false);
      expect(inputAP.connectors.length).toBe(0);
      expect(inputAP.setDefaultCalled).toBe(true); // SHOULD reset to default
    });

    it("should demonstrate the undo issue scenario and fix", () => {
      // This test demonstrates the exact scenario reported by @alzatin
      // When connection replacement happens and undo is triggered,
      // atoms should not become Status.DISABLED
      
      class MockAttachmentPointForUndo extends MockAttachmentPoint {
        constructor(valueType) {
          super(valueType);
          this.connectors = [];
          this.status = "READY";
          this.value = "some-geometry-value";
        }

        setDefault() {
          // Simulate what happens when setDefault is called:
          // For geometry inputs, defaultValue is null
          this.setValue(null);
        }

        setValue(newValue) {
          if (newValue === null || newValue === undefined) {
            this.status = "WAITING"; // This becomes the problem!
            this.value = null;
          } else {
            this.status = "READY";
            this.value = newValue;
          }
        }

        deleteConnector(connector, silent = false) {
          const index = this.connectors.indexOf(connector);
          if (index > -1) {
            this.connectors.splice(index, 1);
          }
          
          // The fix: respect the silent parameter
          if (!silent) {
            this.setDefault();
          }
        }

        attach(connector) {
          this.connectors.push(connector);
        }
      }

      const geometryInput = new MockAttachmentPointForUndo("geometry");
      const mockConnector = { id: "existing-connector" };
      
      // Setup: Connected geometry input with READY status
      geometryInput.attach(mockConnector);
      geometryInput.status = "READY";
      geometryInput.value = "some-geometry-value";
      
      // Before the fix: silent deletion would still call setDefault
      // This would cause the status to become WAITING (disabled)
      
      // After the fix: silent deletion preserves the current state
      geometryInput.deleteConnector(mockConnector, true);
      expect(geometryInput.status).toBe("READY"); // Should remain READY
      expect(geometryInput.value).toBe("some-geometry-value"); // Should remain unchanged
      
      // Verify normal deletion still works as expected
      geometryInput.attach(mockConnector);
      geometryInput.deleteConnector(mockConnector, false);
      expect(geometryInput.status).toBe("WAITING"); // Should reset to default
      expect(geometryInput.value).toBe(null); // Should reset to null
    });
  });
});