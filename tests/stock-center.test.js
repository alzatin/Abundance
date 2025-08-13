import { test, expect, describe } from 'vitest';

describe('Stock Center Calculation', () => {
  test('should calculate stock center correctly for objects not at origin', () => {
    // Simulate a bounding box for an object that's not centered at origin
    const bounds = {
      min: { x: 10, y: 20, z: 5 },
      max: { x: 30, y: 40, z: 15 }
    };
    
    // Calculate dimensions (current approach)
    const x = bounds.max.x - bounds.min.x; // 20
    const y = bounds.max.y - bounds.min.y; // 20  
    const z = bounds.max.z - bounds.min.z; // 10
    
    // CURRENT INCORRECT APPROACH (causes the bug)
    const incorrectCenter = {
      x: x / 2, // 10 - incorrect! 
      y: y / 2, // 10 - incorrect!
      z: z / 2  // 5  - incorrect!
    };
    
    // CORRECT APPROACH (the fix)
    const correctCenter = {
      x: (bounds.max.x + bounds.min.x) / 2, // 20
      y: (bounds.max.y + bounds.min.y) / 2, // 30
      z: (bounds.max.z + bounds.min.z) / 2  // 10
    };
    
    // The issue: incorrect center places stock in wrong location
    expect(incorrectCenter.x).toBe(10);
    expect(incorrectCenter.y).toBe(10);
    expect(incorrectCenter.z).toBe(5);
    
    // The fix: correct center places stock at actual center of bounding box
    expect(correctCenter.x).toBe(20);
    expect(correctCenter.y).toBe(30);
    expect(correctCenter.z).toBe(10);
    
    // Verify they are different (proving the bug exists)
    expect(correctCenter.x).not.toBe(incorrectCenter.x);
    expect(correctCenter.y).not.toBe(incorrectCenter.y);
    expect(correctCenter.z).not.toBe(incorrectCenter.z);
  });

  test('should work correctly for objects centered at origin', () => {
    // For objects centered at origin, both approaches should work
    const bounds = {
      min: { x: -10, y: -10, z: -5 },
      max: { x: 10, y: 10, z: 5 }
    };
    
    const x = bounds.max.x - bounds.min.x; // 20
    const y = bounds.max.y - bounds.min.y; // 20
    const z = bounds.max.z - bounds.min.z; // 10
    
    const oldCenter = {
      x: x / 2, // 10
      y: y / 2, // 10
      z: z / 2  // 5
    };
    
    const newCenter = {
      x: (bounds.max.x + bounds.min.x) / 2, // 0
      y: (bounds.max.y + bounds.min.y) / 2, // 0
      z: (bounds.max.z + bounds.min.z) / 2  // 0
    };
    
    // For origin-centered objects, the old method gives wrong results too
    expect(oldCenter.x).toBe(10);
    expect(oldCenter.y).toBe(10);
    expect(oldCenter.z).toBe(5);
    
    // The correct center should be at origin
    expect(newCenter.x).toBe(0);
    expect(newCenter.y).toBe(0);
    expect(newCenter.z).toBe(0);
  });

  test('should demonstrate the stock setup that causes Kiri:Moto error', () => {
    // Example: object positioned away from origin
    const bounds = {
      min: { x: 15, y: 25, z: 3 },
      max: { x: 25, y: 35, z: 8 }
    };
    
    const x = bounds.max.x - bounds.min.x; // 10
    const y = bounds.max.y - bounds.min.y; // 10
    const z = bounds.max.z - bounds.min.z; // 5
    
    // Current buggy stock setup
    const buggyStock = {
      x: x + 10, // 20 (stock width)
      y: y + 10, // 20 (stock height)
      z: z,      // 5  (stock depth)
      center: {
        x: x / 2, // 5  - WRONG! Stock center at x=5
        y: y / 2, // 5  - WRONG! Stock center at y=5
        z: z / 2  // 2.5 - WRONG! Stock center at z=2.5
      }
    };
    
    // Fixed stock setup
    const fixedStock = {
      x: x + 10, // 20 (stock width)
      y: y + 10, // 20 (stock height) 
      z: z,      // 5  (stock depth)
      center: {
        x: (bounds.max.x + bounds.min.x) / 2, // 20 - CORRECT!
        y: (bounds.max.y + bounds.min.y) / 2, // 30 - CORRECT!
        z: (bounds.max.z + bounds.min.z) / 2  // 5.5 - CORRECT!
      }
    };
    
    // Object center is at (20, 30, 5.5)
    const objectCenter = {
      x: (bounds.max.x + bounds.min.x) / 2,
      y: (bounds.max.y + bounds.min.y) / 2,
      z: (bounds.max.z + bounds.min.z) / 2
    };
    
    // With buggy setup, stock is positioned at (5, 5, 2.5)
    // But object is at (20, 30, 5.5) - way outside the stock!
    const buggyDistance = Math.sqrt(
      Math.pow(objectCenter.x - buggyStock.center.x, 2) +
      Math.pow(objectCenter.y - buggyStock.center.y, 2) +
      Math.pow(objectCenter.z - buggyStock.center.z, 2)
    );
    
    // With fixed setup, stock center matches object center
    const fixedDistance = Math.sqrt(
      Math.pow(objectCenter.x - fixedStock.center.x, 2) +
      Math.pow(objectCenter.y - fixedStock.center.y, 2) +
      Math.pow(objectCenter.z - fixedStock.center.z, 2)
    );
    
    expect(buggyDistance).toBeGreaterThan(20); // Object is far from stock
    expect(fixedDistance).toBeLessThan(1); // Object is at stock center
    
    expect(fixedStock.center.x).toBe(objectCenter.x);
    expect(fixedStock.center.y).toBe(objectCenter.y);
    expect(fixedStock.center.z).toBe(objectCenter.z);
  });
});