import React, { useState, useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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
            const response = await fetch(result.data.download_url);
            if (!response.ok) {
              throw new Error(`Failed to fetch file from download URL: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log("BackgroundModel: Downloaded file, size:", arrayBuffer.byteLength);
            
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
        console.log("BackgroundModel: Created blob URL successfully:", url);
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
    console.log("BackgroundModelMesh: Starting to load model from URL:", url);
    setLoading(true);
    setError(null);
    setModel(null);
    
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        console.log("BackgroundModelMesh: Model loaded successfully:", {
          scene: gltf.scene,
          animations: gltf.animations?.length || 0,
          cameras: gltf.cameras?.length || 0,
          scenes: gltf.scenes?.length || 0
        });
        
        // Ensure the scene has valid geometry
        if (gltf.scene && gltf.scene.children.length > 0) {
          console.log("BackgroundModelMesh: Scene has", gltf.scene.children.length, "children");
          setModel(gltf);
          setError(null);
          setLoading(false);
        } else {
          console.warn("BackgroundModelMesh: Model loaded but scene is empty");
          setError(new Error("Model loaded but contains no visible geometry"));
          setLoading(false);
        }
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percentage = (progress.loaded / progress.total) * 100;
          console.log("BackgroundModelMesh: Loading progress:", Math.round(percentage) + "%");
        } else {
          console.log("BackgroundModelMesh: Loading progress:", progress.loaded, "bytes loaded");
        }
      },
      (error) => {
        console.error("BackgroundModelMesh: Error loading model:");
        console.error("Error type:", typeof error);
        console.error("Error message:", error?.message || 'No message available');
        console.error("Error toString:", error?.toString ? error.toString() : 'No toString available');
        console.error("Full error object:", error);
        
        // Create a proper error message
        let errorMessage = "Unknown error loading 3D model";
        if (error && error.message) {
          errorMessage = error.message;
        } else if (error && error.toString) {
          errorMessage = error.toString();
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError(new Error(`GLTFLoader failed: ${errorMessage}`));
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
    console.log("BackgroundModelMesh: Still loading model...");
    return null;
  }
  
  if (error) {
    console.error("BackgroundModelMesh: Render error:");
    console.error("Error message:", error?.message || 'No message');
    console.error("Error toString:", error?.toString ? error.toString() : 'No toString');
    console.error("Full error object:", error);
    return null;
  }
  
  if (!model || !model.scene) {
    console.log("BackgroundModelMesh: Model not ready yet - model:", !!model, "scene:", !!model?.scene);
    return null;
  }
  
  console.log("BackgroundModelMesh: Rendering model with scene:", {
    children: model.scene.children.length,
    boundingBox: model.scene.children[0]?.geometry?.boundingBox || "No bounding box",
    position: model.scene.position,
    scale: model.scene.scale,
    visible: model.scene.visible,
    matrixWorld: model.scene.matrixWorld
  });
  
  // Clone the scene to avoid conflicts with multiple instances
  const clonedScene = model.scene.clone();
  
  // Make sure the model is positioned and scaled appropriately
  // Reset any transformations that might make it invisible
  clonedScene.position.set(0, 0, 0);
  clonedScene.rotation.set(0, 0, 0);
  clonedScene.scale.set(1, 1, 1);
  clonedScene.visible = true;
  
  // Calculate bounding box to understand the model's actual size and position
  const box = new THREE.Box3().setFromObject(clonedScene);
  console.log("🎯 BACKGROUND MODEL: Bounding box:", {
    min: box.min,
    max: box.max,
    size: box.getSize(new THREE.Vector3()),
    center: box.getCenter(new THREE.Vector3())
  });
  
  // Position the model at the origin for debugging
  const center = box.getCenter(new THREE.Vector3());
  clonedScene.position.sub(center);
  console.log("🎯 BACKGROUND MODEL: Centered model at origin, new position:", clonedScene.position);
  
  // Ensure all child objects are visible
  clonedScene.traverse((child) => {
    child.visible = true;
    
    if (child.material) {
      child.material.transparent = false;
      child.material.opacity = 1.0;
      child.material.depthTest = true;
      child.material.depthWrite = true;
      
      // Set a bright color to make sure the model is visible
      if (child.material.color) {
        child.material.color.setHex(0xff0000); // Bright red for debugging
      }
      
      console.log("🎯 BACKGROUND MODEL: Setting material properties for child:", child.name || "unnamed", {
        type: child.material.type,
        transparent: child.material.transparent,
        opacity: child.material.opacity,
        color: child.material.color?.getHex()
      });
    }
  });
  
  console.log("BackgroundModelMesh: About to render primitive with:", {
    position: clonedScene.position,
    scale: clonedScene.scale,
    visible: clonedScene.visible,
    childCount: clonedScene.children.length
  });

  // Add debugging to track if the primitive is actually rendered
  console.log("🎯 BACKGROUND MODEL: Rendering primitive element");
  console.log("🎯 BACKGROUND MODEL: clonedScene object:", clonedScene);
  console.log("🎯 BACKGROUND MODEL: clonedScene.type:", clonedScene.type);
  console.log("🎯 BACKGROUND MODEL: clonedScene.children:", clonedScene.children);
  
  // Log detailed information about materials and geometry
  clonedScene.traverse((child) => {
    console.log("🎯 BACKGROUND MODEL CHILD:", {
      name: child.name || "unnamed",
      type: child.type,
      visible: child.visible,
      hasGeometry: !!child.geometry,
      hasMaterial: !!child.material,
      position: child.position,
      scale: child.scale,
      renderOrder: child.renderOrder,
      layers: child.layers
    });
    
    if (child.material) {
      console.log("🎯 BACKGROUND MODEL MATERIAL:", {
        type: child.material.type,
        transparent: child.material.transparent,
        opacity: child.material.opacity,
        visible: child.material.visible,
        side: child.material.side,
        depthTest: child.material.depthTest,
        depthWrite: child.material.depthWrite
      });
    }
    
    if (child.geometry) {
      console.log("🎯 BACKGROUND MODEL GEOMETRY:", {
        type: child.geometry.type,
        verticesCount: child.geometry.attributes?.position?.count || 0,
        boundingBox: child.geometry.boundingBox,
        boundingSphere: child.geometry.boundingSphere
      });
    }
  });
  
  return (
    <primitive 
      object={clonedScene}
      // Render behind CAD models but still visible
      renderOrder={-1}
      onUpdate={(self) => {
        console.log("🎯 BACKGROUND MODEL: Primitive onUpdate called:", self);
      }}
      ref={(ref) => {
        console.log("🎯 BACKGROUND MODEL: Primitive ref callback:", ref);
        if (ref) {
          console.log("🎯 BACKGROUND MODEL: Primitive ref object:", {
            type: ref.type,
            visible: ref.visible,
            position: ref.position,
            children: ref.children?.length || 0
          });
        }
      }}
    />
  );
}