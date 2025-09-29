// Test for BOM tags at assembly level
import { describe, it, expect } from 'vitest';
import { bom, extractBomList } from '../src/worker/tags.ts';

describe('BOM Assembly Tags', () => {
  
  it('should apply BOM tag to first leaf when applied to assembly', () => {
    // Create leaf geometries
    const leaf1 = {
      id: "leaf1",
      geometry: "circle_geometry", // string indicates leaf
      tags: [],
      color: null,
      bom: [],
    };
    
    const leaf2 = {
      id: "leaf2", 
      geometry: "rectangle_geometry", // string indicates leaf
      tags: [],
      color: null,
      bom: [],
    };
    
    // Create assembly with multiple leaf children
    const assembly = {
      id: "assembly1",
      geometry: [leaf1, leaf2], // array indicates assembly
      tags: [],
      color: null,
      bom: [],
    };
    
    const bomEntry = {
      name: "Assembly Part",
      material: "Steel",
      quantity: 1,
      cost: 25.0
    };
    
    // Apply BOM tag to assembly - this should propagate to first leaf
    const result = bom(assembly, bomEntry);
    
    // The assembly itself should NOT have the BOM entry (it goes to first leaf)
    expect(result.bom).not.toContain(bomEntry);
    
    // The first leaf should have the BOM entry
    expect(result.geometry[0].bom).toContain(bomEntry);
    
    // The second leaf should NOT have the BOM entry
    expect(result.geometry[1].bom).not.toContain(bomEntry);
    
    // When extracting BOM list, it should find the entry on the first leaf
    const extractedBom = extractBomList(result);
    expect(extractedBom).toContain(bomEntry);
    expect(extractedBom).toHaveLength(1);
  });
  
  it('should not double-count BOM when applied to both assembly and leaf', () => {
    const bomEntry = {
      name: "Part A",
      material: "Aluminum", 
      quantity: 1,
      cost: 10.0
    };
    
    // Create leaf with BOM already applied
    const leafWithBom = {
      id: "leaf1",
      geometry: "circle_geometry",
      tags: [],
      color: null,
      bom: [bomEntry],
    };
    
    // Create assembly containing that leaf
    const assembly = {
      id: "assembly1",
      geometry: [leafWithBom],
      tags: [],
      color: null, 
      bom: [],
    };
    
    // Apply same BOM to assembly (this will add it to the first leaf again)
    const result = bom(assembly, bomEntry);
    
    const extractedBom = extractBomList(result);
    
    // Should find TWO instances of the BOM entry (one original + one from assembly)
    const partAEntries = extractedBom.filter(item => item.name === "Part A");
    expect(partAEntries).toHaveLength(2);
  });
  
  it('should handle nested assemblies correctly', () => {
    const bomEntry = {
      name: "Nested Part",
      material: "Plastic",
      quantity: 2,
      cost: 5.0
    };
    
    // Create deep leaf
    const deepLeaf = {
      id: "deepLeaf",
      geometry: "triangle_geometry",
      tags: [],
      color: null,
      bom: [],
    };
    
    // Create intermediate assembly
    const subAssembly = {
      id: "subAssembly", 
      geometry: [deepLeaf],
      tags: [],
      color: null,
      bom: [],
    };
    
    // Create top-level assembly
    const topAssembly = {
      id: "topAssembly",
      geometry: [subAssembly],
      tags: [],
      color: null,
      bom: [],
    };
    
    // Apply BOM to top assembly - should propagate to deepest first leaf
    const result = bom(topAssembly, bomEntry);
    
    const extractedBom = extractBomList(result); 
    expect(extractedBom).toContain(bomEntry);
    expect(extractedBom).toHaveLength(1);
  });
  
  it('should work with assemblies that have no leaves', () => {
    // Edge case: empty assembly
    const emptyAssembly = {
      id: "empty",
      geometry: [],
      tags: [],
      color: null,
      bom: [],
    };
    
    const bomEntry = {
      name: "Empty Part",
      material: "None",
      quantity: 0,
      cost: 0
    };
    
    const result = bom(emptyAssembly, bomEntry);
    
    // Should NOT add BOM to assembly since there are no leaves
    expect(result.bom).not.toContain(bomEntry);
    
    // extractBomList should return empty since no leaves
    const extractedBom = extractBomList(result);
    expect(extractedBom).toEqual([]);
  });
});