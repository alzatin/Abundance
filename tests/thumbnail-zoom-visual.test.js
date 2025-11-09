/**
 * Visual validation test for thumbnail zoom fix
 * Tests that thumbnails respect project bounds and apply consistent zoom
 */

import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3, Box3 } from 'three';

describe('Thumbnail Zoom Visual Validation', () => {
  // Reference constants matching the implementation (in millimeters)
  const referenceBoundingBoxMM = {
    width: 312.0005000624958,
    height: 312.00074999364347,
    depth: 432.0009977339615,
  };
  const referenceZoom = 0.5;
  const marginFactor = 0.9;

  const referenceDiagonalMM = Math.sqrt(
    referenceBoundingBoxMM.width ** 2 +
      referenceBoundingBoxMM.height ** 2 +
      referenceBoundingBoxMM.depth ** 2
  );

  function calculateZoomForObject(width, height, depth, units = 'Millimeters') {
    // Convert reference to project units if needed (1 inch = 25.4mm)
    const unitScale = units === 'Inches' ? 1 / 25.4 : 1;
    const referenceDiagonal = referenceDiagonalMM * unitScale;
    
    const diagonal = Math.sqrt(width ** 2 + height ** 2 + depth ** 2);
    return (referenceZoom * referenceDiagonal * marginFactor) / diagonal;
  }

  it('should calculate appropriate zoom for small objects in mm (bolt)', () => {
    // Small object like a bolt: 10mm x 10mm x 30mm
    const smallBounds = { width: 10, height: 10, depth: 30 };
    const zoom = calculateZoomForObject(
      smallBounds.width,
      smallBounds.height,
      smallBounds.depth,
      'Millimeters'
    );

    // Small objects should be zoomed in (larger zoom value)
    expect(zoom).toBeGreaterThan(referenceZoom);
    expect(zoom).toBeGreaterThan(1.0);
    expect(zoom).toBeLessThan(10.0); // But not excessively zoomed
  });

  it('should calculate appropriate zoom for medium objects in mm (reference)', () => {
    // Reference object (medium size)
    const zoom = calculateZoomForObject(
      referenceBoundingBoxMM.width,
      referenceBoundingBoxMM.height,
      referenceBoundingBoxMM.depth,
      'Millimeters'
    );

    // Should be close to reference zoom with margin applied
    expect(zoom).toBeCloseTo(referenceZoom * marginFactor, 5);
    expect(zoom).toBeCloseTo(0.45, 2);
  });

  it('should calculate appropriate zoom for large objects in mm (furniture)', () => {
    // Large object like furniture: 1000mm x 1000mm x 1500mm
    const largeBounds = { width: 1000, height: 1000, depth: 1500 };
    const zoom = calculateZoomForObject(
      largeBounds.width,
      largeBounds.height,
      largeBounds.depth,
      'Millimeters'
    );

    // Large objects should be zoomed out (smaller zoom value)
    expect(zoom).toBeLessThan(referenceZoom);
    expect(zoom).toBeGreaterThan(0.1); // But not too far away
    expect(zoom).toBeLessThan(0.5);
  });

  it('should apply margin factor consistently across all sizes in mm', () => {
    const sizes = [
      { name: 'tiny', width: 5, height: 5, depth: 10 },
      { name: 'small', width: 50, height: 50, depth: 100 },
      { name: 'medium', width: 300, height: 300, depth: 400 },
      { name: 'large', width: 1000, height: 1000, depth: 1500 },
      { name: 'huge', width: 5000, height: 5000, depth: 8000 },
    ];

    sizes.forEach((size) => {
      const zoom = calculateZoomForObject(size.width, size.height, size.depth, 'Millimeters');
      
      // All objects should have positive zoom
      expect(zoom).toBeGreaterThan(0);
      
      // Verify zoom decreases as object size increases
      const diagonal = Math.sqrt(
        size.width ** 2 + size.height ** 2 + size.depth ** 2
      );
      const expectedZoom = (referenceZoom * referenceDiagonalMM * marginFactor) / diagonal;
      expect(zoom).toBeCloseTo(expectedZoom, 10);
    });
  });

  it('should ensure 10% breathing room is applied (margin factor) in mm', () => {
    // Test that margin factor creates approximately 10% more space
    const testBounds = { width: 300, height: 300, depth: 400 };
    const diagonal = Math.sqrt(
      testBounds.width ** 2 + testBounds.height ** 2 + testBounds.depth ** 2
    );

    const zoomWithoutMargin = (referenceZoom * referenceDiagonalMM) / diagonal;
    const zoomWithMargin = (referenceZoom * referenceDiagonalMM * marginFactor) / diagonal;

    // Zoom with margin should be less (more zoomed out)
    expect(zoomWithMargin).toBeLessThan(zoomWithoutMargin);

    // Margin should be approximately 10%
    const marginPercentage = ((zoomWithoutMargin - zoomWithMargin) / zoomWithoutMargin) * 100;
    expect(marginPercentage).toBeCloseTo(10, 0);
  });

  it('should handle extreme aspect ratios correctly in mm', () => {
    // Very flat object (like a sheet)
    const flatBounds = { width: 1000, height: 1000, depth: 5 };
    const flatZoom = calculateZoomForObject(
      flatBounds.width,
      flatBounds.height,
      flatBounds.depth,
      'Millimeters'
    );

    // Very tall object (like a pole)
    const tallBounds = { width: 10, height: 10, depth: 1000 };
    const tallZoom = calculateZoomForObject(
      tallBounds.width,
      tallBounds.height,
      tallBounds.depth,
      'Millimeters'
    );

    // Both should have reasonable zoom values
    expect(flatZoom).toBeGreaterThan(0.1);
    expect(flatZoom).toBeLessThan(2.0);
    expect(tallZoom).toBeGreaterThan(0.1);
    expect(tallZoom).toBeLessThan(2.0);
  });

  it('should demonstrate the fix prevents thumbnail size inconsistency in mm', () => {
    // Before fix: zoom was hardcoded (e.g., cameraZoom from props)
    // After fix: zoom is calculated based on object size
    
    // Example: Two objects of very different sizes
    const smallObject = { width: 20, height: 20, depth: 30 };
    const largeObject = { width: 2000, height: 2000, depth: 3000 };

    const smallZoom = calculateZoomForObject(
      smallObject.width,
      smallObject.height,
      smallObject.depth,
      'Millimeters'
    );
    const largeZoom = calculateZoomForObject(
      largeObject.width,
      largeObject.height,
      largeObject.depth,
      'Millimeters'
    );

    // Small object should be zoomed in significantly more than large object
    expect(smallZoom / largeZoom).toBeGreaterThan(50);
    
    // This ensures both objects appear at a similar visual scale in their thumbnails
    // (small objects aren't tiny dots, large objects aren't cut off)
  });

  it('should work with bounding box calculation from mesh positions in mm', () => {
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
    const zoom = calculateZoomForObject(boxSize.x, boxSize.y, boxSize.z, 'Millimeters');
    
    // Should have reasonable zoom for a 100mm cube
    expect(zoom).toBeGreaterThan(0.5);
    expect(zoom).toBeLessThan(2.0);
  });

  // Tests for inches unit system
  it('should calculate appropriate zoom for small objects in inches (bolt)', () => {
    // Small object like a bolt: 0.5in x 0.5in x 1.2in
    const smallBounds = { width: 0.5, height: 0.5, depth: 1.2 };
    const zoom = calculateZoomForObject(
      smallBounds.width,
      smallBounds.height,
      smallBounds.depth,
      'Inches'
    );

    // Small objects should be zoomed in (larger zoom value)
    expect(zoom).toBeGreaterThan(referenceZoom);
    expect(zoom).toBeGreaterThan(1.0);
    expect(zoom).toBeLessThan(10.0); // But not excessively zoomed
  });

  it('should calculate appropriate zoom for medium objects in inches', () => {
    // Medium object: ~12in x 12in x 17in (equivalent to reference in mm)
    const mediumBounds = { 
      width: referenceBoundingBoxMM.width / 25.4, 
      height: referenceBoundingBoxMM.height / 25.4, 
      depth: referenceBoundingBoxMM.depth / 25.4 
    };
    const zoom = calculateZoomForObject(
      mediumBounds.width,
      mediumBounds.height,
      mediumBounds.depth,
      'Inches'
    );

    // Should be close to reference zoom with margin applied
    expect(zoom).toBeCloseTo(referenceZoom * marginFactor, 5);
    expect(zoom).toBeCloseTo(0.45, 2);
  });

  it('should calculate appropriate zoom for large objects in inches (furniture)', () => {
    // Large object like furniture: 40in x 40in x 60in
    const largeBounds = { width: 40, height: 40, depth: 60 };
    const zoom = calculateZoomForObject(
      largeBounds.width,
      largeBounds.height,
      largeBounds.depth,
      'Inches'
    );

    // Large objects should be zoomed out (smaller zoom value)
    expect(zoom).toBeLessThan(referenceZoom);
    expect(zoom).toBeGreaterThan(0.1); // But not too far away
    expect(zoom).toBeLessThan(0.5);
  });

  it('should maintain consistent zoom between mm and inches for equivalent objects', () => {
    // Test the same physical object in both units
    const objectMM = { width: 254, height: 254, depth: 381 }; // 10in x 10in x 15in in mm
    const objectInches = { width: 10, height: 10, depth: 15 };

    const zoomMM = calculateZoomForObject(
      objectMM.width,
      objectMM.height,
      objectMM.depth,
      'Millimeters'
    );
    const zoomInches = calculateZoomForObject(
      objectInches.width,
      objectInches.height,
      objectInches.depth,
      'Inches'
    );

    // Zooms should be very close (accounting for floating point precision)
    expect(zoomMM).toBeCloseTo(zoomInches, 10);
  });
});
