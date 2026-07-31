import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom hook to capture high-resolution screenshots of only the mesh geometry.
 * Excludes grid, axes, background models, and other helper objects.
 * Must be used inside a Canvas component from @react-three/fiber.
 *
 * @param {function} onCaptureCallback - Callback function called when screenshot is captured. Receives { dataUrl, projectName }
 * @returns {object} Object containing captureHighResScreenshot function
 *
 * Usage:
 *   const { captureHighResScreenshot } = useScreenshotCapture(onScreenshotCallback);
 *   captureHighResScreenshot(3840, 2160); // captures at 4K resolution
 */
export function useScreenshotCapture(onCaptureCallback) {
  const { scene, camera } = useThree();

  const captureHighResScreenshot = (width = 3840, height = 2160) => {
    try {
      // Step 1: Save visibility state and hide UI helper objects by name
      const visibilityState = new Map();
      const objectsToHide = ["grid"]; // Named objects to exclude from screenshot
      const typesToHide = ["AxesHelper", "GizmoHelper", "BackgroundModel"]; // Types of objects to exclude

      scene.traverse((obj) => {
        visibilityState.set(obj, obj.visible);
        // Hide objects by name
        if (objectsToHide.includes(obj.name)) {
          obj.visible = false;
        }

        // Hide objects by type
        if (typesToHide.includes(obj.type)) {
          obj.visible = false;
        }
      });

      // Step 2: Create a temporary renderer with high resolution
      const tempRenderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true,
      });
      tempRenderer.setSize(width, height);
      tempRenderer.setPixelRatio(1); // Disable automatic scaling for consistent resolution
      tempRenderer.setClearColor(0xf5f5f5); // Match ThreeContext background

      // Step 3: Render the scene with the temporary renderer
      tempRenderer.render(scene, camera);

      // Step 4: Restore visibility state of all objects
      visibilityState.forEach((visible, obj) => {
        obj.visible = visible;
      });

      // Step 5: Capture the temporary canvas
      const canvas = tempRenderer.domElement;
      const dataURL = canvas.toDataURL("image/png", 0.95); // High quality

      // Step 6: Cleanup and trigger dialog via callback
      tempRenderer.dispose();
      
      // Call the callback with the screenshot data
      if (onCaptureCallback) {
        onCaptureCallback(dataURL);
      }
    } catch (error) {
      console.error("Error in captureHighResScreenshot:", error);
      return null;
    }
  };

  return { captureHighResScreenshot };
}
