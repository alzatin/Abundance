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
      console.log("BackgroundModel: Not loading model - fileName:", fileName, "showModel:", showModel);
      setModelUrl(null);
      return;
    }

    console.log("BackgroundModel: Loading model", fileName);

    const loadModel = async (retryCount = 0) => {
      setLoading(true);
      setError(null);
      
      try {
        const octokit = authorizedUserOcto || new Octokit();
        console.log("BackgroundModel: Fetching file content from GitHub (attempt", retryCount + 1, ")");
        
        // Use consistent owner/repo parameters with upload
        const owner = GlobalVariables.currentUser;
        const repo = GlobalVariables.currentRepoName;
        
        console.log("BackgroundModel: Using owner:", owner, "repo:", repo, "path:", fileName);
        
        const result = await octokit.rest.repos.getContent({
          owner: owner,
          repo: repo,
          path: fileName,
        });

        console.log("BackgroundModel: File response received:", {
          hasContent: !!result.data.content,
          contentLength: result.data.content?.length || 0,
          hasDownloadUrl: !!result.data.download_url,
          downloadUrl: result.data.download_url,
          size: result.data.size,
          type: result.data.type,
          encoding: result.data.encoding
        });
        
        // Log the full response structure for debugging
        console.log("BackgroundModel: Full API response data keys:", Object.keys(result.data));
        console.log("BackgroundModel: Full API response data:", result.data);

        let url;

        // For large files (>1MB), GitHub doesn't include content in the API response
        // Instead, we need to use the download_url or fetch via raw file URL
        if (!result.data.content || result.data.content.length === 0) {
          console.log("BackgroundModel: Empty content detected, checking for download options");
          
          if (result.data.download_url) {
            console.log("BackgroundModel: Large file detected, using download_url:", result.data.download_url);
            
            // Fetch the file directly using the download URL
            console.log("🎯 BACKGROUND MODEL: Starting fetch from download URL...");
            const response = await fetch(result.data.download_url);
            console.log("🎯 BACKGROUND MODEL: Fetch response received:", {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              headers: {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length')
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch file from download URL: ${response.status} ${response.statusText}`);
            }
            
            console.log("🎯 BACKGROUND MODEL: Converting response to arrayBuffer...");
            const arrayBuffer = await response.arrayBuffer();
            console.log("🎯 BACKGROUND MODEL: Downloaded file successfully - size:", arrayBuffer.byteLength);
            
            // Determine MIME type based on file extension
            const extension = fileName.toLowerCase().split('.').pop();
            let mimeType = "application/octet-stream";
            if (extension === "glb") {
              mimeType = "model/gltf-binary";
            } else if (extension === "gltf") {
              mimeType = "model/gltf+json";
            }
            
            console.log("Creating blob for background model, size:", arrayBuffer.byteLength);
            const blob = new Blob([arrayBuffer], { type: mimeType });
            url = URL.createObjectURL(blob);
            console.log("Background model blob URL created:", url);
          } else {
            // If no download_url, try constructing raw file URL as fallback
            console.log("BackgroundModel: No download_url, attempting raw file access");
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${fileName}`;
            console.log("BackgroundModel: Trying raw URL:", rawUrl);
            
            try {
              const response = await fetch(rawUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch file from raw URL: ${response.status} ${response.statusText}`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              console.log("BackgroundModel: Downloaded file via raw URL, size:", arrayBuffer.byteLength);
              
              // Determine MIME type based on file extension
              const extension = fileName.toLowerCase().split('.').pop();
              let mimeType = "application/octet-stream";
              if (extension === "glb") {
                mimeType = "model/gltf-binary";
              } else if (extension === "gltf") {
                mimeType = "model/gltf+json";
              }
              
              console.log("BackgroundModel: Creating blob with MIME type:", mimeType);
              const blob = new Blob([arrayBuffer], { type: mimeType });
              url = URL.createObjectURL(blob);
            } catch (rawError) {
              console.log("BackgroundModel: Raw URL access failed:", rawError.message);
              console.log("BackgroundModel: Will retry if attempts remain");
              throw new Error("Empty file content received from GitHub, no download URL available, and raw file access failed");
            }
          }
        } else {
          // Small files with base64 content (original logic)
          console.log("BackgroundModel: Small file with base64 content");
          
          // Convert base64 to blob URL
          // Clean base64 string by removing newlines (GitHub API adds formatting newlines)
          const base64String = result.data.content.replace(/\s/g, '');
          console.log("BackgroundModel: Cleaned base64 string length:", base64String.length);
          
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
          
          console.log("BackgroundModel: Creating blob with MIME type:", mimeType, "and size:", array.length);
          
          const blob = new Blob([new Uint8Array(array)], {
            type: mimeType,
          });
          
          url = URL.createObjectURL(blob);
        }
        console.log("Background model URL created successfully:", url);
        setModelUrl(url);
      } catch (err) {
        console.error("Error loading background 3D model (attempt", retryCount + 1, "):");
        console.error("Error message:", err.message);
        
        // Retry logic - GitHub might need a moment to make the file available
        if (retryCount < 3 && (
          err.message.includes("Empty file content received from GitHub") || 
          err.message.includes("Empty base64 content") ||
          err.status === 404 ||
          err.message.includes("raw file access failed")
        )) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`BackgroundModel: Retrying in ${delay}ms...`);
          setTimeout(() => {
            loadModel(retryCount + 1);
          }, delay);
          return; // Don't set error state yet, we're retrying
        }
        
        console.error("Error stack:", err.stack);
        console.error("Error details:", {
          fileName,
          owner: GlobalVariables.currentUser,
          repo: GlobalVariables.currentRepoName,
          retryCount
        });
        setError(`Failed to load background model after ${retryCount + 1} attempts: ${err.message}`);
        setLoading(false);
      } finally {
        // Only set loading to false if we're not retrying
        if (retryCount >= 3) {
          setLoading(false);
        }
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

  console.log("Rendering BackgroundModelMesh with URL:", modelUrl);
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
    console.log("BackgroundModelMesh loading model from URL:", url);
    
    setLoading(true);
    setError(null);
    setModel(null);
    
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        console.log("Background model loaded successfully");
        console.log("Model scene children:", gltf.scene.children.length);
        
        if (gltf.scene && gltf.scene.children.length > 0) {
          setModel(gltf);
          setError(null);
          console.log("Background model ready for rendering");
        } else {
          console.warn("Background model loaded but contains no geometry");
          setError(new Error("Model loaded but contains no visible geometry"));
        }
        setLoading(false);
      },
      (progress) => {
        // Progress callback - optional logging
      },
      (error) => {
        console.error("Background model loading failed:", error);
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
  
  console.log("Rendering background model with", model.scene.children.length, "children");
  
  // Clone the scene to avoid conflicts
  const clonedScene = model.scene.clone();
  
  // Position the model at origin and ensure it's visible
  clonedScene.position.set(0, 0, 0);
  clonedScene.rotation.set(0, 0, 0);
  clonedScene.visible = true;
  
  // Calculate bounding box and scale appropriately
  const box = new THREE.Box3().setFromObject(clonedScene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  // Center the model at origin
  clonedScene.position.sub(center);
  
  // Scale to reasonable size (target 500 units max dimension)
  const maxSize = Math.max(size.x, size.y, size.z);
  if (maxSize > 0) {
    const scaleFactor = 500 / maxSize;
    clonedScene.scale.setScalar(scaleFactor);
  }
  
  // Ensure all materials are visible
  clonedScene.traverse((child) => {
    child.visible = true;
    if (child.material) {
      child.material.transparent = false;
      child.material.opacity = 1.0;
      child.material.depthTest = true;
      child.material.depthWrite = true;
      // Keep original colors but ensure visibility
      if (child.material.color) {
        child.material.color.multiplyScalar(1.0); // Ensure not too dark
      }
    }
  });
  
  console.log("Background model positioned at:", clonedScene.position, "scale:", clonedScene.scale);

  return (
    <primitive 
      object={clonedScene}
      renderOrder={-1}
    />
  );
}