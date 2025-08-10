import React, { useState, useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { Octokit } from "https://esm.sh/octokit@2.0.19";
import GlobalVariables from "../../js/globalvariables.js";

/**
 * BackgroundModel component renders a 3D model (GLB/GLTF format) as background context
 * for CAD modeling. The model is loaded from GitHub repository.
 */
export default function BackgroundModel({ 
  fileName, 
  showModel, 
  authorizedUserOcto 
}) {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileName || !showModel) {
      setModelUrl(null);
      return;
    }

    const loadModel = async (retryCount = 0) => {
      setLoading(true);
      setError(null);
      
      try {
        const octokit = authorizedUserOcto || new Octokit();
        
        // Use consistent owner/repo parameters with upload
        const owner = GlobalVariables.currentUser;
        const repo = GlobalVariables.currentRepoName;
        
        const result = await octokit.rest.repos.getContent({
          owner: owner,
          repo: repo,
          path: fileName,
        });

        let url;

        // For large files (>1MB), GitHub doesn't include content in the API response
        // Instead, we need to use the download_url or fetch via raw file URL
        if (!result.data.content || result.data.content.length === 0) {
          
          if (result.data.download_url) {
            // Fetch the file directly using the download URL
            const response = await fetch(result.data.download_url);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch file from download URL: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Determine MIME type based on file extension
            const extension = fileName.toLowerCase().split('.').pop();
            let mimeType = "application/octet-stream";
            if (extension === "glb") {
              mimeType = "model/gltf-binary";
            } else if (extension === "gltf") {
              mimeType = "model/gltf+json";
            }
            
            const blob = new Blob([arrayBuffer], { type: mimeType });
            url = URL.createObjectURL(blob);
          } else {
            // If no download_url, try constructing raw file URL as fallback
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${fileName}`;
            
            try {
              const response = await fetch(rawUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch file from raw URL: ${response.status} ${response.statusText}`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              
              // Determine MIME type based on file extension
              const extension = fileName.toLowerCase().split('.').pop();
              let mimeType = "application/octet-stream";
              if (extension === "glb") {
                mimeType = "model/gltf-binary";
              } else if (extension === "gltf") {
                mimeType = "model/gltf+json";
              }
              
              const blob = new Blob([arrayBuffer], { type: mimeType });
              url = URL.createObjectURL(blob);
            } catch (rawError) {
              throw new Error("Empty file content received from GitHub, no download URL available, and raw file access failed");
            }
          }
        } else {
          // Small files with base64 content (original logic)
          
          // Convert base64 to blob URL
          // Clean base64 string by removing newlines (GitHub API adds formatting newlines)
          const base64String = result.data.content.replace(/\s/g, '');
          
          if (base64String.length === 0) {
            throw new Error("Empty base64 content after cleaning");
          }
          
          const binary = atob(base64String);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          
          // Determine MIME type based on file extension
          const extension = fileName.toLowerCase().split('.').pop();
          let mimeType = "application/octet-stream";
          if (extension === "glb") {
            mimeType = "model/gltf-binary";
          } else if (extension === "gltf") {
            mimeType = "model/gltf+json";
          }
          
          const blob = new Blob([new Uint8Array(array)], {
            type: mimeType,
          });
          
          url = URL.createObjectURL(blob);
        }
        setModelUrl(url);
        setLoading(false); // Clear loading state when successful
      } catch (err) {
        // Retry logic - GitHub might need a moment to make the file available
        if (retryCount < 3 && (
          err.message.includes("Empty file content received from GitHub") || 
          err.message.includes("Empty base64 content") ||
          err.status === 404 ||
          err.message.includes("raw file access failed")
        )) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          setTimeout(() => {
            loadModel(retryCount + 1);
          }, delay);
          return; // Don't set error state yet, we're retrying
        }
        
        setError(`Failed to load background model after ${retryCount + 1} attempts: ${err.message}`);
        setLoading(false);
      }
    };

    loadModel();
  }, [fileName, showModel, authorizedUserOcto]);

  // Cleanup function to revoke blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [modelUrl]);

  // Don't render anything if model shouldn't be shown or no URL
  if (!showModel || !modelUrl) {
    return null;
  }

  if (loading) {
    return null; // Could add a loading indicator here if desired
  }

  if (error) {
    console.warn("Background model error:", error);
    return null; // Silently fail to not interfere with CAD operations
  }

  return <BackgroundModelMesh url={modelUrl} />;
}

/**
 * Separate component for the actual 3D model rendering
 * This is separated to handle the useGLTF hook properly
 */
function BackgroundModelMesh({ url }) {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    setModel(null);
    
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        if (gltf.scene && gltf.scene.children.length > 0) {
          setModel(gltf);
          setError(null);
        } else {
          setError(new Error("Model loaded but contains no visible geometry"));
        }
        setLoading(false);
      },
      (progress) => {
        // Progress callback - optional logging
      },
      (error) => {
        setError(new Error(`GLTFLoader failed: ${error.message || 'Unknown error'}`));
        setModel(null);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      setLoading(false);
    };
  }, [url]);
  
  if (loading) {
    return null;
  }
  
  if (error) {
    console.error("Background model render error:", error);
    return null;
  }
  
  if (!model || !model.scene) {
    return null;
  }
  
  // Clone the scene to avoid conflicts
  const clonedScene = model.scene.clone();
  
  // Position the model at origin and ensure it's visible
  clonedScene.position.set(0, 0, 0);
  clonedScene.rotation.set(0, 0, 0);
  clonedScene.visible = true;
  
  // Calculate bounding box and center the model at origin
  const box = new THREE.Box3().setFromObject(clonedScene);
  const center = box.getCenter(new THREE.Vector3());
  
  // Center the model at origin
  clonedScene.position.sub(center);
  
  // Apply 90-degree rotation around X-axis
  clonedScene.rotation.x = Math.PI / 2;
  
  // After rotation, calculate new bounding box and position the model
  const rotatedBox = new THREE.Box3().setFromObject(clonedScene);
  const minZ = rotatedBox.min.z;
  
  // Move the model forward so its back sits at Z=0 (entirely in positive Z)
  clonedScene.position.z -= minZ;
  
  // Scale the model based on project units (assume model is in meters)
  let scaleFactor = 1;
  if (GlobalVariables.topLevelMolecule && GlobalVariables.topLevelMolecule.unitsKey) {
    const projectUnits = GlobalVariables.topLevelMolecule.unitsKey;
    if (projectUnits === "MM") {
      // Convert meters to millimeters
      scaleFactor = 1000;
    } else if (projectUnits === "Inches") {
      // Convert meters to inches (1 meter = 39.3701 inches)
      scaleFactor = 39.3701;
    }
    // For "Unitless", keep scale factor at 1
  }
  
  clonedScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
  
  // Ensure all materials are visible
  clonedScene.traverse((child) => {
    child.visible = true;
    if (child.material) {
      child.material.transparent = false;
      child.material.opacity = 1.0;
      child.material.depthTest = true;
      child.material.depthWrite = true;
    }
  });

  return (
    <primitive 
      object={clonedScene}
      renderOrder={-1}
    />
  );
}