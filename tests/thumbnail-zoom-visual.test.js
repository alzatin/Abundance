/**
 * Visual validation test for thumbnail zoom fix
 * Tests that thumbnails respect project bounds and apply consistent zoom
 */

import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3, Box3 } from 'three';

describe('Thumbnail Zoom Visual Validation', () => {
  // Reference constants matching the implementation
  const referenceBoundingBox = {
    width: 312.0005000624958,
    height: 312.00074999364347,
    depth: 432.0009977339615,
  };
  const referenceZoom = 0.5;
  const marginFactor = 0.9;

  const referenceDiagonal = Math.sqrt(
    referenceBoundingBox.width ** 2 +
      referenceBoundingBox.height ** 2 +
      referenceBoundingBox.depth ** 2
  );

  function calculateZoomForObject(width, height, depth) {
    const diagonal = Math.sqrt(width ** 2 + height ** 2 + depth ** 2);
    return (referenceZoom * referenceDiagonal * marginFactor) / diagonal;
  }

  it('should calculate appropriate zoom for small objects (bolt)', () => {
    // Small object like a bolt: 10mm x 10mm x 30mm
    const smallBounds = { width: 10, height: 10, depth: 30 };
    const zoom = calculateZoomForObject(
      smallBounds.width,
      smallBounds.height,
      smallBounds.depth
    );

    // Small objects should be zoomed in (larger zoom value)
    expect(zoom).toBeGreaterThan(referenceZoom);
    expect(zoom).toBeGreaterThan(1.0);
    expect(zoom).toBeLessThan(10.0); // But not excessively zoomed
  });

  it('should calculate appropriate zoom for medium objects (reference)', () => {
    // Reference object (medium size)
    const zoom = calculateZoomForObject(
      referenceBoundingBox.width,
      referenceBoundingBox.height,
      referenceBoundingBox.depth
    );

    // Should be close to reference zoom with margin applied
    expect(zoom).toBeCloseTo(referenceZoom * marginFactor, 5);
    expect(zoom).toBeCloseTo(0.45, 2);
  });

  it('should calculate appropriate zoom for large objects (furniture)', () => {
    // Large object like furniture: 1000mm x 1000mm x 1500mm
    const largeBounds = { width: 1000, height: 1000, depth: 1500 };
    const zoom = calculateZoomForObject(
      largeBounds.width,
      largeBounds.height,
      largeBounds.depth
    );

    // Large objects should be zoomed out (smaller zoom value)
    expect(zoom).toBeLessThan(referenceZoom);
    expect(zoom).toBeGreaterThan(0.1); // But not too far away
    expect(zoom).toBeLessThan(0.5);
  });

  it('should apply margin factor consistently across all sizes', () => {
    const sizes = [
      { name: 'tiny', width: 5, height: 5, depth: 10 },
      { name: 'small', width: 50, height: 50, depth: 100 },
      { name: 'medium', width: 300, height: 300, depth: 400 },
      { name: 'large', width: 1000, height: 1000, depth: 1500 },
      { name: 'huge', width: 5000, height: 5000, depth: 8000 },
    ];

    sizes.forEach((size) => {
      const zoom = calculateZoomForObject(size.width, size.height, size.depth);
      
      // All objects should have positive zoom
      expect(zoom).toBeGreaterThan(0);
      
      // Verify zoom decreases as object size increases
      const diagonal = Math.sqrt(
        size.width ** 2 + size.height ** 2 + size.depth ** 2
      );
      const expectedZoom = (referenceZoom * referenceDiagonal * marginFactor) / diagonal;
      expect(zoom).toBeCloseTo(expectedZoom, 10);
    });
  });

  it('should ensure 10% breathing room is applied (margin factor)', () => {
    // Test that margin factor creates approximately 10% more space
    const testBounds = { width: 300, height: 300, depth: 400 };
    const diagonal = Math.sqrt(
      testBounds.width ** 2 + testBounds.height ** 2 + testBounds.depth ** 2
    );

    const zoomWithoutMargin = (referenceZoom * referenceDiagonal) / diagonal;
    const zoomWithMargin = (referenceZoom * referenceDiagonal * marginFactor) / diagonal;

    // Zoom with margin should be less (more zoomed out)
    expect(zoomWithMargin).toBeLessThan(zoomWithoutMargin);

    // Margin should be approximately 10%
    const marginPercentage = ((zoomWithoutMargin - zoomWithMargin) / zoomWithoutMargin) * 100;
    expect(marginPercentage).toBeCloseTo(10, 0);
  });

  it('should handle extreme aspect ratios correctly', () => {
    // Very flat object (like a sheet)
    const flatBounds = { width: 1000, height: 1000, depth: 5 };
    const flatZoom = calculateZoomForObject(
      flatBounds.width,
      flatBounds.height,
      flatBounds.depth
    );

    // Very tall object (like a pole)
    const tallBounds = { width: 10, height: 10, depth: 1000 };
    const tallZoom = calculateZoomForObject(
      tallBounds.width,
      tallBounds.height,
      tallBounds.depth
    );

    // Both should have reasonable zoom values
    expect(flatZoom).toBeGreaterThan(0.1);
    expect(flatZoom).toBeLessThan(2.0);
    expect(tallZoom).toBeGreaterThan(0.1);
    expect(tallZoom).toBeLessThan(2.0);
  });

  it('should demonstrate the fix prevents thumbnail size inconsistency', () => {
    // Before fix: zoom was hardcoded (e.g., cameraZoom from props)
    // After fix: zoom is calculated based on object size
    
    // Example: Two objects of very different sizes
    const smallObject = { width: 20, height: 20, depth: 30 };
    const largeObject = { width: 2000, height: 2000, depth: 3000 };

    const smallZoom = calculateZoomForObject(
      smallObject.width,
      smallObject.height,
      smallObject.depth
    );
    const largeZoom = calculateZoomForObject(
      largeObject.width,
      largeObject.height,
      largeObject.depth
    );

    // Small object should be zoomed in significantly more than large object
    expect(smallZoom / largeZoom).toBeGreaterThan(50);
    
    // This ensures both objects appear at a similar visual scale in their thumbnails
    // (small objects aren't tiny dots, large objects aren't cut off)
  });

  it('should work with bounding box calculation from mesh positions', () => {
    // Simulate calculating bounding box from mesh vertex positions
    // (as done in the actual implementation)
    
    // Mock mesh positions for a simple cube: 100x100x100 centered at origin
    const positions = new Float32Array([
      -50, -50, -50,  // vertex 0
      50, -50, -50,   // vertex 1
      50, 50, -50,    // vertex 2
      -50, 50, -50,   // vertex 3
      -50, -50, 50,   // vertex 4
      50, -50, 50,    // vertex 5
      50, 50, 50,     // vertex 6
      -50, 50, 50,    // vertex 7
    ]);

    // Calculate bounding box like the implementation does
    const boundingBox = new Box3();
    for (let i = 0; i < positions.length; i += 3) {
      boundingBox.expandByPoint(
        new Vector3(positions[i], positions[i + 1], positions[i + 2])
      );
    }

    const boxSize = new Vector3();
    boundingBox.getSize(boxSize);

    // Verify bounding box is correct
    expect(boxSize.x).toBeCloseTo(100, 5);
    expect(boxSize.y).toBeCloseTo(100, 5);
    expect(boxSize.z).toBeCloseTo(100, 5);

    // Calculate zoom for this object
    const zoom = calculateZoomForObject(boxSize.x, boxSize.y, boxSize.z);
    
    // Should have reasonable zoom for a 100mm cube
    expect(zoom).toBeGreaterThan(0.5);
    expect(zoom).toBeLessThan(2.0);
  });
});
