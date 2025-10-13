import { describe, it, expect } from "vitest";

// Helper function to validate project name
const validateProjectName = (name) => {
  const errors = [];
  
  if (!name || name.trim() === "") {
    errors.push("Project name cannot be empty");
    return errors;
  }
  
  // Check for spaces
  if (name.includes(" ")) {
    errors.push("Project name cannot contain spaces (use hyphens instead)");
  }
  
  // Check for invalid characters (GitHub allows alphanumeric and hyphens)
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    errors.push("Project name can only contain letters, numbers, dots, underscores, and hyphens");
  }
  
  // Check if starts/ends with hyphen
  if (name.startsWith("-") || name.endsWith("-")) {
    errors.push("Project name cannot start or end with a hyphen");
  }
  
  // Check length
  if (name.length > 100) {
    errors.push("Project name must be 100 characters or less");
  }
  
  return errors;
};

// Helper function to validate and sanitize topics
const validateTopics = (topics) => {
  const errors = [];
  const sanitized = [];
  
  topics.forEach((topic) => {
    const topicValue = topic.value || topic;
    
    // Convert to lowercase (GitHub requirement)
    const lowerTopic = topicValue.toLowerCase();
    
    // Check for spaces
    if (lowerTopic.includes(" ")) {
      errors.push(`Tag "${topicValue}" contains spaces (they will be removed)`);
    }
    
    // Remove spaces and special characters, keep only letters, numbers, and hyphens
    const cleaned = lowerTopic.replace(/[^a-z0-9-]/g, "");
    
    // Check if starts with hyphen
    if (cleaned.startsWith("-")) {
      errors.push(`Tag "${topicValue}" cannot start with a hyphen`);
      return;
    }
    
    // Check length
    if (cleaned.length > 50) {
      errors.push(`Tag "${topicValue}" is too long (max 50 characters)`);
      return;
    }
    
    // Check if anything remains after cleaning
    if (cleaned.length === 0) {
      errors.push(`Tag "${topicValue}" contains only invalid characters`);
      return;
    }
    
    if (cleaned !== topicValue) {
      errors.push(`Tag "${topicValue}" will be changed to "${cleaned}"`);
    }
    
    sanitized.push(cleaned);
  });
  
  return { errors, sanitized };
};

describe("Project Name Validation", () => {
  it("should accept valid project names", () => {
    expect(validateProjectName("my-project")).toHaveLength(0);
    expect(validateProjectName("MyProject123")).toHaveLength(0);
    expect(validateProjectName("project_name")).toHaveLength(0);
    expect(validateProjectName("project.name")).toHaveLength(0);
  });

  it("should reject empty project names", () => {
    const errors = validateProjectName("");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("empty");
  });

  it("should reject project names with spaces", () => {
    const errors = validateProjectName("my project");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes("spaces"))).toBe(true);
  });

  it("should reject project names with special characters", () => {
    const errors = validateProjectName("my@project");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes("letters, numbers"))).toBe(true);
  });

  it("should reject project names starting or ending with hyphen", () => {
    const startErrors = validateProjectName("-myproject");
    expect(startErrors.some(e => e.includes("start or end"))).toBe(true);
    
    const endErrors = validateProjectName("myproject-");
    expect(endErrors.some(e => e.includes("start or end"))).toBe(true);
  });

  it("should reject project names longer than 100 characters", () => {
    const longName = "a".repeat(101);
    const errors = validateProjectName(longName);
    expect(errors.some(e => e.includes("100 characters"))).toBe(true);
  });
});

describe("Topic Validation", () => {
  it("should accept valid topics", () => {
    const result = validateTopics(["3d-printing", "cad", "opensource"]);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized).toEqual(["3d-printing", "cad", "opensource"]);
  });

  it("should convert uppercase topics to lowercase", () => {
    const result = validateTopics(["MyTopic", "CAD"]);
    expect(result.sanitized).toEqual(["mytopic", "cad"]);
  });

  it("should remove spaces from topics", () => {
    const result = validateTopics(["my topic", "3d printing"]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.sanitized).toEqual(["mytopic", "3dprinting"]);
  });

  it("should remove special characters from topics", () => {
    const result = validateTopics(["3d@printing", "cad!"]);
    expect(result.sanitized).toEqual(["3dprinting", "cad"]);
  });

  it("should reject topics starting with hyphen", () => {
    const result = validateTopics(["-mytopic"]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes("cannot start with"))).toBe(true);
    expect(result.sanitized).toHaveLength(0);
  });

  it("should reject topics longer than 50 characters", () => {
    const longTopic = "a".repeat(51);
    const result = validateTopics([longTopic]);
    expect(result.errors.some(e => e.includes("too long"))).toBe(true);
    expect(result.sanitized).toHaveLength(0);
  });

  it("should reject topics with only special characters", () => {
    const result = validateTopics(["@@@", "!!!"]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes("invalid characters"))).toBe(true);
    expect(result.sanitized).toHaveLength(0);
  });

  it("should handle topics with mixed casing and sanitization", () => {
    const result = validateTopics(["3D Printing!", "CAD-Design"]);
    expect(result.sanitized).toEqual(["3dprinting", "cad-design"]);
  });

  it("should report when topics will be changed", () => {
    const result = validateTopics(["My Topic"]);
    expect(result.errors.some(e => e.includes("will be changed"))).toBe(true);
  });
});

describe("Topic Validation with object format", () => {
  it("should handle topics as objects with value property", () => {
    const result = validateTopics([
      { value: "3d-printing" },
      { value: "CAD Design" }
    ]);
    expect(result.sanitized).toEqual(["3d-printing", "caddesign"]);
  });
});
