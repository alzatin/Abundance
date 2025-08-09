import React, { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
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

    console.log("BackgroundModel: Loading model", fileName);

    const loadModel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const octokit = authorizedUserOcto || new Octokit();
        const result = await octokit.rest.repos.getContent({
          owner: GlobalVariables.currentUser || GlobalVariables.currentRepo?.owner,
          repo: GlobalVariables.currentRepoName || GlobalVariables.currentRepo?.repoName,
          path: fileName,
        });

        // Convert base64 to blob URL
        // Clean base64 string by removing newlines (GitHub API adds formatting newlines)
        const base64String = result.data.content.replace(/\s/g, '');
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
        
        const url = URL.createObjectURL(blob);
        console.log("BackgroundModel: Created blob URL successfully");
        setModelUrl(url);
      } catch (err) {
        console.error("Error loading background 3D model:", err);
        setError(`Failed to load background model: ${err.message}`);
      } finally {
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
  try {
    const { scene } = useGLTF(url);
    
    if (!scene) {
      console.warn("Background model scene is null");
      return null;
    }
    
    // Clone the scene to avoid conflicts with multiple instances
    const clonedScene = scene.clone();
    
    return (
      <primitive 
        object={clonedScene} 
        scale={[1, 1, 1]}
        position={[0, 0, 0]}
        // Render behind CAD models but still visible
        renderOrder={-1}
      />
    );
  } catch (error) {
    console.warn("Failed to load background model:", error);
    return null;
  }
}