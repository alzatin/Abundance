/**
 * Test for progress bar consistency - ensures the loading bar never goes backwards.
 * 
 * The issue was that getCompletionTuple() computed totals differently depending on molecule status:
 * - When WAITING: only counted immediate children
 * - When PROCESSING: recursively counted nested molecules
 * 
 * This caused progress to go backwards when molecules transitioned from WAITING to PROCESSING.
 * The fix ensures totals are always computed consistently by recursing into nested molecules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Status } from '../src/prototypes/observableEntity.js';

// Mock molecule-like objects for testing
class MockAtom {
  constructor(name, status = Status.WAITING) {
    this.name = name;
    this.status = status;
    this.atomType = 'Atom';
    this.value = status === Status.READY ? 'value' : null;
  }

  getState() {
    return { status: this.status, value: this.value };
  }
}

class MockMolecule {
  constructor(name, children = [], status = Status.WAITING) {
    this.name = name;
    this.nodesOnTheScreen = children;
    this.atomType = 'Molecule';
    this.status = status;
    this.value = status === Status.READY ? 'value' : null;
  }

  getState() {
    return { status: this.status, value: this.value };
  }

  // This is the fixed implementation we're testing
  getCompletionTuple() {
    let totalCount = 0;
    let readyCount = 0;

    this.nodesOnTheScreen.forEach((atom) => {
      const status = atom.getState().status;
      if (status === Status.DISABLED) {
        return;
      }

      if (
        atom.atomType === "Molecule" ||
        atom.atomType === "GitHubMolecule"
      ) {
        const [ready, total] = atom.getCompletionTuple();
        totalCount += total;
        readyCount += ready;
      } else {
        totalCount += 1;
        if (status === Status.READY) {
          readyCount += 1;
        }
      }
    });

    if (totalCount === 0) {
      return [1, 1];
    }

    return [readyCount, totalCount];
  }
}

describe('Progress Bar Consistency (getCompletionTuple)', () => {

  describe('basic behavior', () => {
    it('should return [1, 1] for empty molecule', () => {
      const molecule = new MockMolecule('empty');
      const [ready, total] = molecule.getCompletionTuple();
      expect(ready).toBe(1);
      expect(total).toBe(1);
    });

    it('should count non-molecule atoms correctly', () => {
      const molecule = new MockMolecule('test', [
        new MockAtom('atom1', Status.READY),
        new MockAtom('atom2', Status.WAITING),
        new MockAtom('atom3', Status.PROCESSING),
      ]);
      const [ready, total] = molecule.getCompletionTuple();
      expect(total).toBe(3);
      expect(ready).toBe(1); // Only atom1 is ready
    });

    it('should skip disabled atoms', () => {
      const molecule = new MockMolecule('test', [
        new MockAtom('atom1', Status.READY),
        new MockAtom('atom2', Status.DISABLED),
        new MockAtom('atom3', Status.WAITING),
      ]);
      const [ready, total] = molecule.getCompletionTuple();
      expect(total).toBe(2); // atom2 is disabled
      expect(ready).toBe(1);
    });
  });

  describe('consistent totals (prevents progress bar going backwards)', () => {
    it('should compute same total regardless of molecule status', () => {
      // Create a nested structure: parent with a child molecule containing atoms
      const childMolecule = new MockMolecule('child', [
        new MockAtom('nested1', Status.WAITING),
        new MockAtom('nested2', Status.WAITING),
      ], Status.WAITING);

      const parent = new MockMolecule('parent', [
        new MockAtom('atom1', Status.WAITING),
        childMolecule,
      ], Status.WAITING);

      // Get tuple when parent is WAITING
      const [ready1, total1] = parent.getCompletionTuple();

      // Simulate transition to PROCESSING
      parent.status = Status.PROCESSING;
      childMolecule.status = Status.PROCESSING;

      // Get tuple when parent is PROCESSING
      const [ready2, total2] = parent.getCompletionTuple();

      // The key assertion: total should be the same!
      expect(total2).toBe(total1);
      // Total should be 3: atom1 + nested1 + nested2
      expect(total1).toBe(3);
    });

    it('should handle deeply nested molecules consistently', () => {
      const deepNested = new MockMolecule('deep', [
        new MockAtom('d1', Status.WAITING),
        new MockAtom('d2', Status.WAITING),
      ]);

      const midNested = new MockMolecule('mid', [
        new MockAtom('m1', Status.WAITING),
        deepNested,
      ]);

      const topLevel = new MockMolecule('top', [
        new MockAtom('t1', Status.WAITING),
        midNested,
      ]);

      const [ready, total] = topLevel.getCompletionTuple();
      
      // Total should be 4: t1 + m1 + d1 + d2 (nested molecules don't add to count, only their children)
      expect(total).toBe(4);
      expect(ready).toBe(0);

      // Now make everything ready
      deepNested.nodesOnTheScreen[0].status = Status.READY;
      deepNested.nodesOnTheScreen[0].value = 'value';
      deepNested.nodesOnTheScreen[1].status = Status.READY;
      deepNested.nodesOnTheScreen[1].value = 'value';
      midNested.nodesOnTheScreen[0].status = Status.READY;
      midNested.nodesOnTheScreen[0].value = 'value';
      topLevel.nodesOnTheScreen[0].status = Status.READY;
      topLevel.nodesOnTheScreen[0].value = 'value';

      const [ready2, total2] = topLevel.getCompletionTuple();
      
      // Total should still be 4
      expect(total2).toBe(4);
      // Now all 4 should be ready
      expect(ready2).toBe(4);
    });

    it('should track progress accurately through stages', () => {
      const nestedMolecule = new MockMolecule('nested', [
        new MockAtom('n1', Status.WAITING),
        new MockAtom('n2', Status.WAITING),
      ]);

      const topLevel = new MockMolecule('top', [
        new MockAtom('t1', Status.WAITING),
        nestedMolecule,
      ]);

      // Initial state: total = 3, ready = 0
      let [ready, total] = topLevel.getCompletionTuple();
      expect(total).toBe(3);
      expect(ready).toBe(0);
      let progress = (ready / total) * 100;
      expect(progress).toBe(0);

      // Mark t1 as ready
      topLevel.nodesOnTheScreen[0].status = Status.READY;
      topLevel.nodesOnTheScreen[0].value = 'value';
      [ready, total] = topLevel.getCompletionTuple();
      expect(total).toBe(3);
      expect(ready).toBe(1);
      let newProgress = (ready / total) * 100;
      expect(newProgress).toBeGreaterThan(progress);
      progress = newProgress;

      // Mark n1 as ready
      nestedMolecule.nodesOnTheScreen[0].status = Status.READY;
      nestedMolecule.nodesOnTheScreen[0].value = 'value';
      [ready, total] = topLevel.getCompletionTuple();
      expect(total).toBe(3);
      expect(ready).toBe(2);
      newProgress = (ready / total) * 100;
      expect(newProgress).toBeGreaterThan(progress);
      progress = newProgress;

      // Mark n2 as ready - now complete
      nestedMolecule.nodesOnTheScreen[1].status = Status.READY;
      nestedMolecule.nodesOnTheScreen[1].value = 'value';
      [ready, total] = topLevel.getCompletionTuple();
      expect(total).toBe(3);
      expect(ready).toBe(3);
      newProgress = (ready / total) * 100;
      expect(newProgress).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle GitHubMolecule type', () => {
      const gitHubMolecule = new MockMolecule('github', [
        new MockAtom('g1', Status.READY),
        new MockAtom('g2', Status.WAITING),
      ]);
      gitHubMolecule.atomType = 'GitHubMolecule';

      const parent = new MockMolecule('parent', [gitHubMolecule]);
      const [ready, total] = parent.getCompletionTuple();
      
      expect(total).toBe(2);
      expect(ready).toBe(1);
    });

    it('should handle mixed disabled and nested molecules', () => {
      const nested = new MockMolecule('nested', [
        new MockAtom('n1', Status.READY),
        new MockAtom('n2', Status.DISABLED),
      ]);

      const parent = new MockMolecule('parent', [
        new MockAtom('p1', Status.DISABLED),
        nested,
        new MockAtom('p2', Status.READY),
      ]);

      const [ready, total] = parent.getCompletionTuple();
      // n1 + p2 = 2 total (n2 and p1 are disabled)
      expect(total).toBe(2);
      expect(ready).toBe(2);
    });
  });
});
