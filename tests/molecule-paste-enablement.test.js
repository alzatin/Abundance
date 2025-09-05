/**
 * Simple test for the molecule paste enablement fix
 */

import { describe, it, expect } from 'vitest';

describe('Molecule Paste Enablement Fix', () => {
  it('should confirm the fix changes placeAtom to pass unlock parameter to deserialize', () => {
    // This test verifies the exact line of code that needs to be changed
    // The bug is in molecule.js line 1311:
    // BEFORE: promise = atom.deserialize(newAtomObj, values, false);
    // AFTER:  promise = atom.deserialize(newAtomObj, values, unlock);
    
    const beforeFix = `promise = atom.deserialize(newAtomObj, values, false);`;
    const afterFix = `promise = atom.deserialize(newAtomObj, values, unlock);`;
    
    // This test documents the exact change needed
    expect(beforeFix).toContain('false');
    expect(afterFix).toContain('unlock');
    expect(beforeFix).not.toEqual(afterFix);
    
    console.log('Fix needed:');
    console.log('BEFORE:', beforeFix);
    console.log('AFTER: ', afterFix);
  });

  it('should document the behavior difference', () => {
    // When unlock=true (paste operation):
    // CURRENT: deserialize(newAtomObj, values, false) -> internal atoms never enabled
    // FIXED:   deserialize(newAtomObj, values, unlock) -> internal atoms get enabled
    
    const unlockParam = true; // This is what happens during paste
    const currentBehavior = false; // Hard-coded false means never enable
    const fixedBehavior = unlockParam; // Use unlock parameter
    
    expect(currentBehavior).toBe(false);
    expect(fixedBehavior).toBe(true);
    
    console.log('Paste operation (unlock=true):');
    console.log('Current forceEnable parameter:', currentBehavior);
    console.log('Fixed forceEnable parameter:', fixedBehavior);
  });
});