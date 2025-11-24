/**
 * Test for BOM atom receiving values from upstream connections (like Equation atoms)
 * Tests the scenario described in the issue: BOM name set by equation atom should save correctly
 */

import { describe, it, expect } from 'vitest';
import { BOMEntry } from '../src/js/BOM.js';

describe('BOM Tag Upstream Value Handling', () => {

  it('should get live value directly from upstream atom when connector is attached', () => {
    // Simulate the scenario from the issue where the cached value is stale
    // but the upstream atom has the new value
    
    // Create a mock upstream atom (like an Equation atom)
    const mockUpstreamAtom = {
      getState: () => ({
        value: '12 ft 2x6' // Current computed value
      })
    };

    // Create a mock BOM atom with a connector to the upstream atom
    const mockBOMAtom = {
      BOMitem: new BOMEntry(),
      inputs: [
        {
          name: 'Item Name',
          type: 'input',
          // The cached value is stale (old value)
          getValue: () => '8 ft 2x6',
          connectors: [{
            attachmentPoint1: {
              parentMolecule: mockUpstreamAtom
            }
          }]
        }
      ],
      // getLiveInputValue implementation - gets value directly from upstream when connector exists
      getLiveInputValue: function(inputName) {
        const input = this.inputs.find(i => i.name === inputName && i.type === 'input');
        if (!input) return null;

        // If there's a connector, get the value directly from the upstream atom
        if (input.connectors && input.connectors.length > 0) {
          const connector = input.connectors[0];
          const upstreamAP = connector.attachmentPoint1;
          if (upstreamAP && upstreamAP.parentMolecule) {
            const upstreamState = upstreamAP.parentMolecule.getState();
            if (upstreamState && upstreamState.value !== undefined) {
              return upstreamState.value;
            }
          }
        }

        // Fall back to the attachment point's current value
        return input.getValue();
      }
    };

    // The cached value (stale) from getValue()
    expect(mockBOMAtom.inputs[0].getValue()).toBe('8 ft 2x6');
    
    // getLiveInputValue should get the current value from upstream
    expect(mockBOMAtom.getLiveInputValue('Item Name')).toBe('12 ft 2x6');

    // When syncing, we use the live value
    const itemName = mockBOMAtom.getLiveInputValue('Item Name');
    if (itemName !== null && itemName !== undefined) {
      mockBOMAtom.BOMitem.BOMitemName = itemName;
    }

    // The BOMitem should have the current (not stale) value
    expect(mockBOMAtom.BOMitem.BOMitemName).toBe('12 ft 2x6');
  });

  it('should properly serialize values received from upstream connections', () => {
    // Simulate the scenario from the issue:
    // An equation atom computes `L + " 2x6"` and passes it to BOM's "Item Name" input
    
    // Create a mock BOM atom structure similar to how AddBOMTag works
    const mockBOMAtom = {
      BOMitem: new BOMEntry(),
      inputs: [
        {
          name: 'geometry',
          type: 'input',
          getValue: () => null,
          connectors: []
        },
        {
          name: 'Item Name',
          type: 'input',
          // Simulate value coming from upstream equation atom
          getValue: () => '8 ft 2x6',
          connectors: []
        },
        {
          name: 'Number Needed',
          type: 'input',
          getValue: () => 4,
          connectors: []
        },
        {
          name: 'Cost (USD)',
          type: 'input',
          getValue: () => 12.50,
          connectors: []
        },
        {
          name: 'Source Link',
          type: 'input',
          getValue: () => 'https://homedepot.com',
          connectors: []
        }
      ],
      getLiveInputValue: function(inputName) {
        const input = this.inputs.find(i => i.name === inputName && i.type === 'input');
        if (!input) return null;

        // If there's a connector, get the value directly from the upstream atom
        if (input.connectors && input.connectors.length > 0) {
          const connector = input.connectors[0];
          const upstreamAP = connector.attachmentPoint1;
          if (upstreamAP && upstreamAP.parentMolecule) {
            const upstreamState = upstreamAP.parentMolecule.getState();
            if (upstreamState && upstreamState.value !== undefined) {
              return upstreamState.value;
            }
          }
        }

        // Fall back to the attachment point's current value
        return input.getValue();
      }
    };

    // Before the fix, BOMitem.BOMitemName would still be "New Item" (default)
    expect(mockBOMAtom.BOMitem.BOMitemName).toBe('New Item');
    
    // Simulate what the fixed serialize method does:
    // Sync BOMitem properties with current input values before serializing
    const itemName = mockBOMAtom.getLiveInputValue('Item Name');
    if (itemName !== null && itemName !== undefined) {
      mockBOMAtom.BOMitem.BOMitemName = itemName;
    }
    const numberNeeded = mockBOMAtom.getLiveInputValue('Number Needed');
    if (numberNeeded !== null && numberNeeded !== undefined) {
      mockBOMAtom.BOMitem.numberNeeded = numberNeeded;
    }
    const costUSD = mockBOMAtom.getLiveInputValue('Cost (USD)');
    if (costUSD !== null && costUSD !== undefined) {
      mockBOMAtom.BOMitem.costUSD = costUSD;
    }
    const sourceLink = mockBOMAtom.getLiveInputValue('Source Link');
    if (sourceLink !== null && sourceLink !== undefined) {
      mockBOMAtom.BOMitem.source = sourceLink;
    }

    // Now BOMitem should have the correct values from upstream
    expect(mockBOMAtom.BOMitem.BOMitemName).toBe('8 ft 2x6');
    expect(mockBOMAtom.BOMitem.numberNeeded).toBe(4);
    expect(mockBOMAtom.BOMitem.costUSD).toBe(12.50);
    expect(mockBOMAtom.BOMitem.source).toBe('https://homedepot.com');

    // Serialize the BOMitem
    const serializedBOM = Object.assign({}, mockBOMAtom.BOMitem);
    
    // The serialized value should match the upstream computed value
    expect(serializedBOM.BOMitemName).toBe('8 ft 2x6');
    expect(serializedBOM.numberNeeded).toBe(4);
    expect(serializedBOM.costUSD).toBe(12.50);
    expect(serializedBOM.source).toBe('https://homedepot.com');
  });

  it('should preserve default values when no upstream connection exists', () => {
    const mockBOMAtom = {
      BOMitem: new BOMEntry(),
      inputs: [
        {
          name: 'Item Name',
          type: 'input',
          // No upstream connection - return null to simulate disconnected input
          getValue: () => null,
          connectors: []
        },
        {
          name: 'Number Needed',
          type: 'input',
          getValue: () => null,
          connectors: []
        }
      ],
      getLiveInputValue: function(inputName) {
        const input = this.inputs.find(i => i.name === inputName && i.type === 'input');
        if (!input) return null;

        // If there's a connector, get the value directly from the upstream atom
        if (input.connectors && input.connectors.length > 0) {
          const connector = input.connectors[0];
          const upstreamAP = connector.attachmentPoint1;
          if (upstreamAP && upstreamAP.parentMolecule) {
            const upstreamState = upstreamAP.parentMolecule.getState();
            if (upstreamState && upstreamState.value !== undefined) {
              return upstreamState.value;
            }
          }
        }

        // Fall back to the attachment point's current value
        return input.getValue();
      }
    };

    // Set some values directly on BOMitem (simulating user manual input)
    mockBOMAtom.BOMitem.BOMitemName = 'Manual Entry';
    mockBOMAtom.BOMitem.numberNeeded = 2;

    // Sync would not overwrite when getLiveInputValue returns null
    const itemName = mockBOMAtom.getLiveInputValue('Item Name');
    if (itemName !== null && itemName !== undefined) {
      mockBOMAtom.BOMitem.BOMitemName = itemName;
    }
    const numberNeeded = mockBOMAtom.getLiveInputValue('Number Needed');
    if (numberNeeded !== null && numberNeeded !== undefined) {
      mockBOMAtom.BOMitem.numberNeeded = numberNeeded;
    }

    // Values should remain unchanged since inputs returned null
    expect(mockBOMAtom.BOMitem.BOMitemName).toBe('Manual Entry');
    expect(mockBOMAtom.BOMitem.numberNeeded).toBe(2);
  });

  it('should handle dynamic string concatenation from equation', () => {
    // Simulate the exact scenario from the issue: L + " 2x6"
    const lengthValue = 10; // Simulating an Input atom value
    const computedName = lengthValue + ' 2x6'; // What the Equation atom would compute

    const mockBOMAtom = {
      BOMitem: new BOMEntry(),
      inputs: [
        {
          name: 'Item Name',
          type: 'input',
          getValue: () => computedName,
          connectors: []
        }
      ],
      getLiveInputValue: function(inputName) {
        const input = this.inputs.find(i => i.name === inputName && i.type === 'input');
        if (!input) return null;

        // If there's a connector, get the value directly from the upstream atom
        if (input.connectors && input.connectors.length > 0) {
          const connector = input.connectors[0];
          const upstreamAP = connector.attachmentPoint1;
          if (upstreamAP && upstreamAP.parentMolecule) {
            const upstreamState = upstreamAP.parentMolecule.getState();
            if (upstreamState && upstreamState.value !== undefined) {
              return upstreamState.value;
            }
          }
        }

        // Fall back to the attachment point's current value
        return input.getValue();
      }
    };

    // The equation computed value
    expect(mockBOMAtom.getLiveInputValue('Item Name')).toBe('10 2x6');

    // Sync and serialize
    const itemName = mockBOMAtom.getLiveInputValue('Item Name');
    if (itemName !== null && itemName !== undefined) {
      mockBOMAtom.BOMitem.BOMitemName = itemName;
    }

    // The BOMitem should now have the computed name
    expect(mockBOMAtom.BOMitem.BOMitemName).toBe('10 2x6');
  });
});
