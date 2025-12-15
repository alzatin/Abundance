import { describe, it, expect } from "vitest";

// Mock API structure similar to methodsreplicad.json
const mockApi = {
  drawCircle: {
    type: "function",
    requiredParams: ["radius"],
    optionalParams: [],
    returns: "Drawing",
  },
  "Drawing.sketchOnPlane": {
    type: "method",
    requiredParams: [],
    optionalParams: ["inputPlane", "origin"],
    returns: "Sketches",
  },
  "Sketches.extrude": {
    type: "method",
    requiredParams: ["extrusionDistance"],
    optionalParams: ["{ extrusionDirection, extrusionProfile, twistAngle, origin, }"],
    returns: "Shape3D",
  },
  "Sketch.extrude": {
    type: "method",
    requiredParams: ["extrusionDistance"],
    optionalParams: ["{ extrusionDirection, extrusionProfile, twistAngle, origin, }"],
    returns: "Shape3D",
  },
  "Shape3D.fillet": {
    type: "method",
    requiredParams: ["radiusConfig"],
    optionalParams: ["filter"],
    returns: "Shape3D",
  },
};

// Helper function to infer the type of a chained expression
// This is a copy of the function from ReactCodeEditorWithApiAutocomplete.tsx
function inferChainType(chain, api, variableTypes) {
  if (!api) return null;

  // Remove any trailing dots
  chain = chain.trim().replace(/\.$/, "");

  // Split the chain into segments (e.g., ["replicad.drawCircle(5)", "sketchOnPlane()"])
  // We need to handle nested parentheses carefully
  const segments = [];
  let currentSegment = "";
  let parenDepth = 0;
  let i = 0;

  while (i < chain.length) {
    const char = chain[i];
    if (char === "(") {
      parenDepth++;
      currentSegment += char;
    } else if (char === ")") {
      parenDepth--;
      currentSegment += char;
    } else if (char === "." && parenDepth === 0) {
      // This is a method chaining dot, not a dot inside parameters
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
    } else {
      currentSegment += char;
    }
    i++;
  }
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Now process each segment to infer the final type
  let currentType = null;

  for (const segment of segments) {
    // Extract method name from segment (e.g., "drawCircle(5)" -> "drawCircle")
    const methodMatch = segment.match(/^([a-zA-Z_$][\w$]*)\(/);
    if (!methodMatch) {
      // Check if it's a variable or property access
      const varMatch = segment.match(/^([a-zA-Z_$][\w$]*)$/);
      if (varMatch) {
        const varName = varMatch[1];
        if (varName === "replicad") {
          currentType = "replicad";
        } else if (variableTypes[varName]) {
          currentType = variableTypes[varName];
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      const methodName = methodMatch[1];

      // Determine the full API key
      let apiKey;
      if (currentType === null || currentType === "replicad") {
        // Top-level method
        apiKey = methodName;
      } else {
        // Instance method
        apiKey = `${currentType}.${methodName}`;
      }

      // Look up the return type
      if (api[apiKey] && api[apiKey].returns) {
        currentType = api[apiKey].returns;
      } else {
        // Method not found in API
        return null;
      }
    }
  }

  return currentType;
}

describe("Autocomplete chain inference", () => {
  it("should infer type for simple replicad method call", () => {
    const chain = "replicad.drawCircle(5)";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Drawing");
  });

  it("should infer type for chained method calls", () => {
    const chain = "replicad.drawCircle(5).sketchOnPlane()";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Sketches");
  });

  it("should infer type for multiple chained method calls", () => {
    const chain = "replicad.drawCircle(5).sketchOnPlane().extrude(10)";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Shape3D");
  });

  it("should infer type for chain with complex parameters", () => {
    const chain = "replicad.drawCircle(5).sketchOnPlane('XY', [0, 0, 0])";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Sketches");
  });

  it("should infer type starting from a variable", () => {
    const chain = "myDrawing.sketchOnPlane()";
    const variableTypes = { myDrawing: "Drawing" };
    const type = inferChainType(chain, mockApi, variableTypes);
    expect(type).toBe("Sketches");
  });

  it("should handle nested parentheses in parameters", () => {
    const chain = "replicad.drawCircle(Math.max(5, 10)).sketchOnPlane()";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Sketches");
  });

  it("should return null for unknown method", () => {
    const chain = "replicad.unknownMethod()";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe(null);
  });

  it("should return null for unknown variable", () => {
    const chain = "unknownVar.sketchOnPlane()";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe(null);
  });

  it("should handle very long chains", () => {
    const chain = "replicad.drawCircle(5).sketchOnPlane().extrude(10).fillet(2)";
    const type = inferChainType(chain, mockApi, {});
    expect(type).toBe("Shape3D");
  });
});
