import * as THREE from "three";
import {
  syncFaces,
  syncLines,
  syncLinesFromFaces,
} from "replicad-threejs-helper";

/**
 * Generate a high-resolution PNG from mesh data returned by the worker
 * @param {Array} meshArray - Array of mesh objects from worker with { faces, edges, color, cameraZoom }
 * @param {number} width - Output width in pixels (default: 1000)
 * @param {number} height - Output height in pixels (default: 1000)
 * @returns {Promise<string>} Base64-encoded PNG data URL
 */
export async function generateMeshPNG(meshArray, width = 1000, height = 1000) {
  if (!meshArray || !Array.isArray(meshArray) || meshArray.length === 0) {
    console.warn("No mesh data provided for PNG generation");
    return null;
  }

  try {
    // Create a temporary scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background

    // Convert mesh data to Three.js objects using replicad-threejs-helper
    let cameraZoom = 1;
    const meshGroup = new THREE.Group();

    for (const m of meshArray) {
      // Store camera zoom from first mesh (they should all be the same)
      if (m.cameraZoom) cameraZoom = m.cameraZoom;

      // Skip point-only geometries for PNG generation
      if (m.point) continue;

      // Create geometry from mesh data
      const geometry = new THREE.BufferGeometry();

      // Use replicad-threejs-helper to populate geometry
      if (m.faces) {
        syncFaces(geometry, m.faces);
      }

      // Create material with proper color
      const material = new THREE.MeshStandardMaterial({
        color: m.color || "#888888",
        side: THREE.DoubleSide,
        metalness: 0.3,
        roughness: 0.7,
      });

      // Create mesh and add to group
      const mesh = new THREE.Mesh(geometry, material);
      meshGroup.add(mesh);

      // Add wireframe edges if they exist
      if (m.edges) {
        const edgeGeometry = new THREE.BufferGeometry();
        syncLines(edgeGeometry, m.edges);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: "#000000",
          linewidth: 1,
          transparent: true,
          opacity: 0.3,
        });
        const wireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        meshGroup.add(wireframe);
      }
    }

    scene.add(meshGroup);

    // Calculate camera position from bounding box
    const boundingBox = new THREE.Box3().setFromObject(meshGroup);
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) * 2.2; // Add padding

    // Create perspective camera positioned to view the mesh
    // Use near/far planes calculated from bounding box to prevent clipping
    const distance = maxDim * 1.5;
    const near = Math.max(0.1, distance - maxDim * 2);
    const far = distance + maxDim * 2;

    const camera = new THREE.PerspectiveCamera(
      75, // fov
      width / height,
      near,
      far,
    );

    // Position camera to look at the mesh center
    // 30-degree elevation from the XY horizon plane
    // tan(30°) ≈ 0.577, so vertical distance ≈ horizontal distance * 0.577
    camera.position.set(
      center.x + maxDim * 0.8,
      center.y + maxDim * 0.2,
      center.z + maxDim * 0.26,
    );
    camera.lookAt(center);

    // Calculate appropriate zoom to frame the mesh properly
    // This ensures consistent sizing compared to useScreenshotCapture
    const vFOV = (camera.fov * Math.PI) / 180; // Convert to radians
    const requiredDistance = Math.abs(maxDim / 2 / Math.tan(vFOV / 2));
    const actualDistance = camera.position.distanceTo(center);
    camera.zoom = actualDistance / requiredDistance;

    camera.updateProjectionMatrix();

    // Add lighting to match ThreeContext
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Directional light comes from the same direction as the camera
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.copy(camera.position);
    directionalLight.target.position.copy(center);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Create renderer with high quality settings
    const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true, // For proper depth precision
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.render(scene, camera);

    // Capture PNG
    const canvas = renderer.domElement;
    const dataURL = canvas.toDataURL("image/png", 0.7); // Match quality from useScreenshotCapture

    // Cleanup
    renderer.dispose();
    meshGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    return dataURL;
  } catch (error) {
    console.error("Error generating mesh PNG:", error);
    return null;
  }
}

/**
 * Extract base64 PNG data from a data URL (removes "data:image/png;base64," prefix)
 * @param {string} dataURL - Data URL from canvas.toDataURL()
 * @returns {string} Base64-encoded PNG data
 */
export function extractBase64FromDataURL(dataURL) {
  if (!dataURL || !dataURL.startsWith("data:")) {
    return dataURL;
  }
  return dataURL.split(",")[1];
}
