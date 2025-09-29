// Integration test for BOM assembly functionality  
import { describe, it, expect } from 'vitest';
import { bom, extractBomList } from '../src/worker/tags.ts';

describe('BOM Assembly Integration Test', () => {
  it('should demonstrate the complete workflow from issue to solution', () => {
    // Simulate the exact scenario described in the issue:
    // "BOM tags applied to assemblies don't work because they are only read from leaf geometry"
    
    // Create leaf components
    const screw = {
      id: "screw",
      geometry: "screw_geometry",
      tags: [],
      color: null,
      bom: [],
    };
    
    const bracket = {
      id: "bracket", 
      geometry: "bracket_geometry",
      tags: [],
      color: null,
      bom: [],
    };
    
    // Create assembly containing those components
    const mountingAssembly = {
      id: "mounting_assembly",
      geometry: [screw, bracket],
      tags: [],
      color: null,
      bom: [],
    };
    
    // THIS IS THE SCENARIO FROM THE ISSUE:
    // Apply BOM tag to the assembly (not to individual components)
    const assemblyBomEntry = {
      name: "Mounting Hardware Kit",
      material: "Steel/Aluminum",
      quantity: 1,
      cost: 15.99,
      source: "hardware-store"
    };
    
    // Before the fix: this would not work because BOM tags on assemblies were ignored
    // After the fix: this should apply the BOM to the first leaf (screw)
    const assemblyWithBom = bom(mountingAssembly, assemblyBomEntry);
    
    // Verify the fix works:
    
    // 1. The BOM should NOT be on the assembly itself (it goes to first leaf now)
    expect(assemblyWithBom.bom).not.toContain(assemblyBomEntry);
    
    // 2. The BOM should be on the first leaf (screw)
    expect(assemblyWithBom.geometry[0].bom).toContain(assemblyBomEntry);
    
    // 3. The BOM should NOT be on the second leaf (bracket)  
    expect(assemblyWithBom.geometry[1].bom).not.toContain(assemblyBomEntry);
    
    // 4. extractBomList should find the BOM (this is what was broken before)
    const extractedBom = extractBomList(assemblyWithBom);
    expect(extractedBom).toContain(assemblyBomEntry);
    expect(extractedBom).toHaveLength(1);
    
    // 5. Verify the specific requirement: "tag should be applied only to the first leaf"
    const firstLeaf = assemblyWithBom.geometry[0];
    const secondLeaf = assemblyWithBom.geometry[1];
    
    expect(firstLeaf.bom).toContain(assemblyBomEntry);
    expect(secondLeaf.bom).not.toContain(assemblyBomEntry);
  });
  
  it('should work with complex nested assembly hierarchies', () => {
    // Create a complex hierarchy: TopAssembly -> SubAssembly -> DeepSubAssembly -> Leaf
    
    const deepLeaf = {
      id: "deep_component",
      geometry: "deep_geometry", 
      tags: [],
      color: null,
      bom: [],
    };
    
    const deepSubAssembly = {
      id: "deep_sub",
      geometry: [deepLeaf],
      tags: [],
      color: null,
      bom: [],
    };
    
    const subAssembly = {
      id: "sub",
      geometry: [deepSubAssembly],
      tags: [],
      color: null,
      bom: [],
    };
    
    const topAssembly = {
      id: "top",
      geometry: [subAssembly],  
      tags: [],
      color: null,
      bom: [],
    };
    
    const bomEntry = {
      name: "Complex Assembly BOM",
      quantity: 1,
      cost: 100.0
    };
    
    // Apply BOM to top-level assembly
    const result = bom(topAssembly, bomEntry);
    
    // Should propagate all the way down to the deepest first leaf
    const extractedBom = extractBomList(result);
    expect(extractedBom).toContain(bomEntry);
    expect(extractedBom).toHaveLength(1);
    
    // Verify it's actually on the deep leaf
    const actualDeepLeaf = result.geometry[0].geometry[0].geometry[0];
    expect(actualDeepLeaf.bom).toContain(bomEntry);
  });
  
  it('should preserve existing leaf-level BOM functionality', () => {
    // Verify that applying BOM directly to leaves still works as before
    
    const leaf = {
      id: "leaf",
      geometry: "leaf_geometry",
      tags: [],
      color: null,
      bom: [],
    };
    
    const bomEntry = {
      name: "Direct Leaf BOM",
      quantity: 1,
      cost: 5.0
    };
    
    const result = bom(leaf, bomEntry);
    
    // Should apply directly to the leaf (existing behavior)
    expect(result.bom).toContain(bomEntry);
    
    const extractedBom = extractBomList(result);
    expect(extractedBom).toContain(bomEntry);
  });
});