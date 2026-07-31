import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom hook to capture high-resolution screenshots of only the mesh geometry.
 * Excludes grid, axes, background models, and other helper objects.
 * Must be used inside a Canvas component from @react-three/fiber.
 *
 * @returns {object} Object containing captureHighResScreenshot function
 *
 * Usage:
 *   const { captureHighResScreenshot } = useScreenshotCapture();
 *   captureHighResScreenshot(3840, 2160); // captures at 4K resolution
 */
export function useScreenshotCapture() {
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

      // Step 6: Download the screenshot
      fetch(dataURL)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `abundance-screenshot-${width}x${height}-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch((err) =>
          console.error("Error capturing high-res screenshot:", err),
        )
        .finally(() => {
          // Cleanup: Dispose of the temporary renderer to free GPU memory
          tempRenderer.dispose();
        });
    } catch (error) {
      console.error("Error in captureHighResScreenshot:", error);
    }
  };

  return { captureHighResScreenshot };
}
