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
            
            console.log("🎯 BACKGROUND MODEL: Creating blob with MIME type:", mimeType);
            console.log("🎯 BACKGROUND MODEL: ArrayBuffer details before blob creation:", {
              byteLength: arrayBuffer.byteLength,
              constructor: arrayBuffer.constructor.name,
              isValidArrayBuffer: arrayBuffer instanceof ArrayBuffer
            });
            
            try {
              console.log("🎯 BACKGROUND MODEL: About to call new Blob([arrayBuffer], { type: mimeType })...");
              const blob = new Blob([arrayBuffer], { type: mimeType });
              console.log("🎯 BACKGROUND MODEL: ✅ Blob created successfully!");
              console.log("🎯 BACKGROUND MODEL: Blob details:", {
                size: blob.size,
                type: blob.type,
                constructor: blob.constructor.name,
                isValidBlob: blob instanceof Blob
              });
              
              console.log("🎯 BACKGROUND MODEL: About to create object URL...");
              url = URL.createObjectURL(blob);
              console.log("🎯 BACKGROUND MODEL: ✅ Object URL created successfully!");
              console.log("🎯 BACKGROUND MODEL: Object URL details:", {
                url: url,
                urlLength: url.length,
                urlType: typeof url,
                startsWithBlob: url.startsWith('blob:')
              });
              
            } catch (blobError) {
              console.error("🎯 BACKGROUND MODEL: ❌ BLOB CREATION ERROR!");
              console.error("🎯 BACKGROUND MODEL: Error type:", typeof blobError);
              console.error("🎯 BACKGROUND MODEL: Error constructor:", blobError?.constructor?.name);
              console.error("🎯 BACKGROUND MODEL: Error message:", blobError?.message);
              console.error("🎯 BACKGROUND MODEL: Error toString:", blobError?.toString ? blobError.toString() : 'No toString available');
              console.error("🎯 BACKGROUND MODEL: Full error object:", blobError);
              console.error("🎯 BACKGROUND MODEL: Error stack:", blobError?.stack);
              throw new Error(`Blob creation failed: ${blobError?.message || 'Unknown blob error'}`);
            }
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
        console.log("🎯 BACKGROUND MODEL: ✅ URL creation pipeline completed successfully!");
        console.log("🎯 BACKGROUND MODEL: Final URL:", url);
        console.log("🎯 BACKGROUND MODEL: About to set model URL in state...");
        
        try {
          setModelUrl(url);
          console.log("🎯 BACKGROUND MODEL: ✅ Model URL state updated successfully!");
          console.log("🎯 BACKGROUND MODEL: This should trigger BackgroundModelMesh component render");
        } catch (stateError) {
          console.error("🎯 BACKGROUND MODEL: ❌ STATE UPDATE ERROR!");
          console.error("🎯 BACKGROUND MODEL: State error:", stateError);
          throw new Error(`State update failed: ${stateError?.message || 'Unknown state error'}`);
        }
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
  if (!showModel) {
    console.log("🎯 BACKGROUND MODEL: Not rendering - showModel is false");
    return null;
  }
  
  if (!modelUrl) {
    console.log("🎯 BACKGROUND MODEL: Not rendering - modelUrl is null/undefined:", modelUrl);
    return null;
  }

  if (loading) {
    console.log("🎯 BACKGROUND MODEL: Not rendering - still loading");
    return null; // Could add a loading indicator here if desired
  }

  if (error) {
    console.warn("🎯 BACKGROUND MODEL: Not rendering - error state:", error);
    return null; // Silently fail to not interfere with CAD operations
  }

  console.log("🎯 BACKGROUND MODEL: ✅ All conditions met - rendering BackgroundModelMesh with URL:", modelUrl);
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
    console.log("🎯 GLTF LOADER: BackgroundModelMesh useEffect triggered with URL:", url);
    console.log("🎯 GLTF LOADER: URL type:", typeof url);
    console.log("🎯 GLTF LOADER: URL length:", url?.length || 0);
    
    setLoading(true);
    setError(null);
    setModel(null);
    
    console.log("🎯 GLTF LOADER: Creating GLTFLoader instance...");
    const loader = new GLTFLoader();
    console.log("🎯 GLTF LOADER: GLTFLoader created successfully");
    
    console.log("🎯 GLTF LOADER: Starting load operation...");
    
    try {
      loader.load(
        url,
        (gltf) => {
          console.log("🎯 GLTF LOADER: SUCCESS - Model loaded successfully!");
          console.log("🎯 GLTF LOADER: GLTF object structure:", {
            hasScene: !!gltf.scene,
            sceneType: gltf.scene?.type,
            sceneName: gltf.scene?.name,
            sceneChildren: gltf.scene?.children?.length || 0,
            animations: gltf.animations?.length || 0,
            cameras: gltf.cameras?.length || 0,
            scenes: gltf.scenes?.length || 0,
            asset: gltf.asset
          });
          
          // Log detailed scene hierarchy
          if (gltf.scene) {
            console.log("🎯 GLTF LOADER: Scene hierarchy:");
            gltf.scene.traverse((child, index) => {
              console.log(`🎯 GLTF LOADER:   Child ${index}:`, {
                name: child.name || "unnamed",
                type: child.type,
                visible: child.visible,
                hasGeometry: !!child.geometry,
                hasMaterial: !!child.material,
                position: child.position,
                scale: child.scale,
                rotation: child.rotation
              });
            });
          }
          
          // Ensure the scene has valid geometry
          if (gltf.scene && gltf.scene.children.length > 0) {
            console.log("🎯 GLTF LOADER: Scene validation passed - has", gltf.scene.children.length, "children");
            console.log("🎯 GLTF LOADER: Setting model in state...");
            setModel(gltf);
            setError(null);
            setLoading(false);
            console.log("🎯 GLTF LOADER: Model state updated successfully");
          } else {
            console.warn("🎯 GLTF LOADER: Scene validation failed - scene is empty");
            setError(new Error("Model loaded but contains no visible geometry"));
            setLoading(false);
          }
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentage = (progress.loaded / progress.total) * 100;
            console.log("🎯 GLTF LOADER: Loading progress:", Math.round(percentage) + "%", `(${progress.loaded}/${progress.total} bytes)`);
          } else {
            console.log("🎯 GLTF LOADER: Loading progress:", progress.loaded, "bytes loaded");
          }
        },
        (error) => {
          console.error("🎯 GLTF LOADER: ERROR - Model loading failed!");
          console.error("🎯 GLTF LOADER: Error type:", typeof error);
          console.error("🎯 GLTF LOADER: Error constructor:", error?.constructor?.name);
          console.error("🎯 GLTF LOADER: Error message:", error?.message || 'No message available');
          console.error("🎯 GLTF LOADER: Error toString:", error?.toString ? error.toString() : 'No toString available');
          console.error("🎯 GLTF LOADER: Full error object:", error);
          console.error("🎯 GLTF LOADER: Error stack:", error?.stack);
          
          // Create a proper error message
          let errorMessage = "Unknown error loading 3D model";
          if (error && error.message) {
            errorMessage = error.message;
          } else if (error && error.toString) {
            errorMessage = error.toString();
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          console.error("🎯 GLTF LOADER: Final error message:", errorMessage);
          setError(new Error(`GLTFLoader failed: ${errorMessage}`));
          setModel(null);
          setLoading(false);
        }
      );
    } catch (loaderError) {
      console.error("🎯 GLTF LOADER: ❌ LOADER SETUP ERROR!");
      console.error("🎯 GLTF LOADER: Loader setup error:", loaderError);
      setError(new Error(`GLTFLoader setup failed: ${loaderError?.message || 'Unknown loader setup error'}`));
      setLoading(false);
    }

    // Cleanup function
    return () => {
      console.log("🎯 GLTF LOADER: useEffect cleanup called");
      setLoading(false);
    };
  }, [url]);
  
  if (loading) {
    console.log("🎯 GLTF MESH: Still loading model...");
    return null;
  }
  
  if (error) {
    console.error("🎯 GLTF MESH: Render error:");
    console.error("🎯 GLTF MESH: Error message:", error?.message || 'No message');
    console.error("🎯 GLTF MESH: Error toString:", error?.toString ? error.toString() : 'No toString');
    console.error("🎯 GLTF MESH: Full error object:", error);
    return null;
  }
  
  if (!model || !model.scene) {
    console.log("🎯 GLTF MESH: Model not ready yet - model:", !!model, "scene:", !!model?.scene);
    return null;
  }
  
  console.log("🎯 GLTF MESH: Model is ready, proceeding with rendering...");
  console.log("🎯 GLTF MESH: Model details:", {
    children: model.scene.children.length,
    boundingBox: model.scene.children[0]?.geometry?.boundingBox || "No bounding box",
    position: model.scene.position,
    scale: model.scene.scale,
    visible: model.scene.visible,
    matrixWorld: model.scene.matrixWorld
  });
  
  // Clone the scene to avoid conflicts with multiple instances
  console.log("🎯 GLTF MESH: Cloning scene...");
  const clonedScene = model.scene.clone();
  console.log("🎯 GLTF MESH: Scene cloned successfully");
  
  // Make sure the model is positioned and scaled appropriately
  // Reset any transformations that might make it invisible
  console.log("🎯 GLTF MESH: Resetting transformations...");
  clonedScene.position.set(0, 0, 0);
  clonedScene.rotation.set(0, 0, 0);
  clonedScene.scale.set(1, 1, 1);
  clonedScene.visible = true;
  console.log("🎯 GLTF MESH: Transformations reset");
  
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
  const size = box.getSize(new THREE.Vector3());
  clonedScene.position.sub(center);
  
  // Scale the model to a reasonable size for the camera view
  // The camera is at [3000, 3000, 5000] so the model should be sized appropriately
  const maxSize = Math.max(size.x, size.y, size.z);
  if (maxSize > 0) {
    // Scale to roughly 1000 units if it's too big or too small
    const targetSize = 1000;
    const scaleFactor = targetSize / maxSize;
    clonedScene.scale.setScalar(scaleFactor);
    console.log("🎯 BACKGROUND MODEL: Scaled model - originalSize:", maxSize, "scaleFactor:", scaleFactor, "newScale:", clonedScene.scale);
  }
  
  console.log("🎯 BACKGROUND MODEL: Final model transform:", {
    position: clonedScene.position,
    scale: clonedScene.scale,
    originalBoundingBox: { min: box.min, max: box.max },
    originalSize: size,
    originalCenter: center
  });
  
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
  
  console.log("🎯 GLTF MESH: About to render primitive with final settings:");
  console.log("🎯 GLTF MESH: - Position:", clonedScene.position);
  console.log("🎯 GLTF MESH: - Scale:", clonedScene.scale);
  console.log("🎯 GLTF MESH: - Visible:", clonedScene.visible);
  console.log("🎯 GLTF MESH: - Child count:", clonedScene.children.length);
  console.log("🎯 GLTF MESH: - RenderOrder:", -1);

  // Add debugging to track if the primitive is actually rendered
  console.log("🎯 GLTF MESH: Creating primitive element...");
  console.log("🎯 GLTF MESH: clonedScene object type:", clonedScene.type);
  console.log("🎯 GLTF MESH: clonedScene children count:", clonedScene.children.length);
  
  // Log detailed information about materials and geometry for final check
  console.log("🎯 GLTF MESH: Final scene traverse before render:");
  clonedScene.traverse((child, index) => {
    console.log(`🎯 GLTF MESH FINAL: Child ${index}:`, {
      name: child.name || "unnamed",
      type: child.type,
      visible: child.visible,
      hasGeometry: !!child.geometry,
      hasMaterial: !!child.material,
      position: child.position?.toArray ? child.position.toArray() : child.position,
      scale: child.scale?.toArray ? child.scale.toArray() : child.scale,
      renderOrder: child.renderOrder,
      layers: child.layers?.mask,
      geometryType: child.geometry?.type,
      materialType: child.material?.type,
      materialColor: child.material?.color?.getHex ? child.material.color.getHex() : undefined
    });
  });
  
  console.log("🎯 GLTF MESH: Returning primitive component NOW");
  
  return (
    <primitive 
      object={clonedScene}
      // Render behind CAD models but still visible
      renderOrder={-1}
      onUpdate={(self) => {
        console.log("🎯 PRIMITIVE: onUpdate called with:", {
          type: self?.type,
          visible: self?.visible,
          position: self?.position,
          childrenCount: self?.children?.length || 0
        });
      }}
      ref={(ref) => {
        console.log("🎯 PRIMITIVE: ref callback called with:", !!ref ? "valid ref" : "null ref");
        if (ref) {
          console.log("🎯 PRIMITIVE: ref object details:", {
            type: ref.type,
            visible: ref.visible,
            position: ref.position?.toArray ? ref.position.toArray() : ref.position,
            children: ref.children?.length || 0,
            parent: !!ref.parent,
            scene: !!ref.scene
          });
        }
      }}
    />
  );
}