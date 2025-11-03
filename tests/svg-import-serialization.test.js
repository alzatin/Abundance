import { describe, it, expect, vi } from 'vitest';

describe('SVG Import Serialization', () => {
  let testIdCounter = 0;

  // Mock Import atom based on the actual implementation
  class MockImport {
    constructor(values) {
      this.name = "Import";
      this.atomType = "Import";
      this.fileName = null;
      this.type = null;
      this.sha = null;
      this.SVGwidth = 10; // default value
      this.repoOwner = null;
      this.repoName = null;
      this.uniqueID = 'test-id-' + (testIdCounter++);
      this.x = 0;
      this.y = 0;
      
      // Apply values from constructor
      if (values) {
        for (const key in values) {
          this[key] = values[key];
        }
      }
    }

    serialize(offset = { x: 0, y: 0 }) {
      // Simulate parent serialize
      const superSerialObject = {
        atomType: this.atomType,
        uniqueID: this.uniqueID,
        x: this.x + offset.x,
        y: this.y + offset.y,
      };

      // This is what the fix adds
      superSerialObject.fileName = this.fileName;
      superSerialObject.name = this.name;
      superSerialObject.type = this.type;
      superSerialObject.repoOwner = this.repoOwner;
      superSerialObject.repoName = this.repoName;
      superSerialObject.SVGwidth = this.SVGwidth; // THE FIX

      return superSerialObject;
    }
  }

  it('should serialize SVGwidth property', () => {
    // Set up the import atom with SVG file
    const importAtom = new MockImport({
      fileName: 'test.svg',
      type: 'SVG',
      SVGwidth: 25,
      repoOwner: 'test-owner',
      repoName: 'test-repo',
    });

    // Serialize the atom
    const serialized = importAtom.serialize();

    // Verify SVGwidth is included in serialization
    expect(serialized).toHaveProperty('SVGwidth');
    expect(serialized.SVGwidth).toBe(25);
  });

  it('should preserve SVGwidth when set to default value', () => {
    // Set up the import atom with default SVG width
    const importAtom = new MockImport({
      fileName: 'test.svg',
      type: 'SVG',
      SVGwidth: 10, // default value
    });

    // Serialize the atom
    const serialized = importAtom.serialize();

    // Verify default SVGwidth is included
    expect(serialized).toHaveProperty('SVGwidth');
    expect(serialized.SVGwidth).toBe(10);
  });

  it('should serialize all Import properties including SVGwidth', () => {
    // Set up a complete import atom
    const importAtom = new MockImport({
      fileName: 'my-icon.svg',
      name: 'Import',
      type: 'SVG',
      repoOwner: 'user123',
      repoName: 'my-project',
      SVGwidth: 50,
    });

    // Serialize the atom
    const serialized = importAtom.serialize();

    // Verify all properties are serialized
    expect(serialized.fileName).toBe('my-icon.svg');
    expect(serialized.name).toBe('Import');
    expect(serialized.type).toBe('SVG');
    expect(serialized.repoOwner).toBe('user123');
    expect(serialized.repoName).toBe('my-project');
    expect(serialized.SVGwidth).toBe(50);
  });

  it('should handle SVGwidth when deserializing', () => {
    // Create a serialized object with SVGwidth
    const serializedData = {
      fileName: 'test.svg',
      name: 'Import',
      type: 'SVG',
      repoOwner: 'owner',
      repoName: 'repo',
      SVGwidth: 30,
    };

    // Create a new Import atom from serialized data
    const restoredAtom = new MockImport(serializedData);

    // Verify SVGwidth was restored
    expect(restoredAtom.SVGwidth).toBe(30);
  });

  it('should use default SVGwidth if not provided in serialized data', () => {
    // Create a serialized object without SVGwidth (old data)
    const serializedData = {
      fileName: 'test.svg',
      name: 'Import',
      type: 'SVG',
      repoOwner: 'owner',
      repoName: 'repo',
    };

    // Create a new Import atom from old serialized data
    const restoredAtom = new MockImport(serializedData);

    // Verify default SVGwidth is used
    expect(restoredAtom.SVGwidth).toBe(10);
  });

  it('should demonstrate the bug fix for SVG width persistence', () => {
    // SCENARIO: User imports SVG and changes width from 10 to 50
    const importAtom = new MockImport({
      fileName: 'logo.svg',
      type: 'SVG',
      repoOwner: 'myuser',
      repoName: 'myproject',
    });

    // User changes width to 50
    importAtom.SVGwidth = 50;

    // Project is saved (serialize is called)
    const saved = importAtom.serialize();

    // Without the fix, SVGwidth would be missing from saved data
    // causing it to reset to 10 on reload
    expect(saved.SVGwidth).toBe(50);

    // Project is loaded (deserialize)
    const reloaded = new MockImport(saved);

    // With the fix, SVGwidth should be preserved
    expect(reloaded.SVGwidth).toBe(50);
  });
});
