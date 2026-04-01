import React, { createContext, useContext, useState } from "react";
import GlobalVariables from "../js/globalvariables.js";
import { useAuth } from "./AuthContext.jsx";
import { useAppState } from "./AppStateContext.jsx";

const FileImportContext = createContext();

/**
 * Context provider for file import/upload operations.
 * Centralizes file upload and delete logic for Import atoms.
 */
export function FileImportProvider({ children }) {
  const { authorizedUserOcto } = useAuth();
  const { setNotification } = useAppState();

  /**
   * Upload a file to the current GitHub repository
   * @param {File} file - The file to upload
   * @param {Object} activeAtom - The atom requesting the upload
   * @param {Function} onSave - Callback to trigger project save after upload
   */
  const uploadFile = async function (file, activeAtom) {
    var reader = new FileReader();

    reader.onload = function (e) {
      const base64result = e.target.result.split(",")[1];

      (async () => {
        try {
          const existingFiles = await authorizedUserOcto.rest.repos.getContent({
            owner: GlobalVariables.currentAWSnode.owner,
            repo: GlobalVariables.currentAWSnode.repoName,
            path: "",
          });

          let fileName = file.name;
          const fileExtension = fileName.substring(fileName.lastIndexOf("."));
          const baseName = fileName.substring(0, fileName.lastIndexOf("."));
          let uniqueFileName = fileName;
          let counter = 1;

          // Incrementally rename the file until a unique name is found
          while (
            existingFiles.data.some(
              (existingFile) => existingFile.name === uniqueFileName,
            )
          ) {
            uniqueFileName = `${baseName}_copy${counter}${fileExtension}`;
            counter++;
          }

          if (uniqueFileName !== fileName) {
            console.warn(`File already exists. Renaming to: ${uniqueFileName}`);
          }
          const result = await Promise.race([
            authorizedUserOcto.rest.repos.createOrUpdateFileContents({
              owner: GlobalVariables.currentAWSnode.owner,
              repo: GlobalVariables.currentAWSnode.repoName,
              path: uniqueFileName,
              message: "Import File",
              content: base64result,
            }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("File upload timed out")),
                60000,
              ),
            ),
          ]);
          console.log("File uploaded successfully:", result);

          // Create a renamed File object so the atom can process it directly
          // without re-fetching from GitHub (avoids propagation-delay 404s)
          const renamedFile = new File([file], uniqueFileName, { type: file.type });
          activeAtom.updateFile(
            renamedFile,
            result.data.content.sha,
          );

          // Show upload notification
          //setNotification(`File uploaded: ${uniqueFileName}`);
          setNotification(`File uploaded: ${uniqueFileName}`, "notice");
          setTimeout(() => setNotification(null, "notice"), 3000);
        } catch (error) {
          setNotification(
            `Failed to Upload File: Corrupt or exceeded size limit`,
            "error",
          );
          setTimeout(() => setNotification(null, "error"), 3000);
          console.error("Error during file upload:", error);
        }
      })();
    };

    reader.onerror = function (error) {
      console.error("Error reading file:", error);
      setNotification("Failed to read the file. Please try again.", "error");
      setTimeout(() => setNotification(null, "error"), 3000);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Delete a file from the current GitHub repository
   * @param {string} fileName - Name of the file to delete
   * @param {string} fileSha - SHA hash of the file to delete
   */
  const deleteFile = async function (fileName, fileSha) {
    // If fileName is null or undefined, there's no file to delete
    if (fileName == null) {
      return;
    }

    try {
      await authorizedUserOcto.rest.repos.deleteFile({
        owner: GlobalVariables.currentAWSnode.owner,
        repo: GlobalVariables.currentAWSnode.repoName,
        path: fileName,
        message: "Deleted node",
        sha: fileSha,
      });
      console.log("File deleted successfully:", fileName);

      // Show delete notification
      setNotification(`File deleted: ${fileName}`, "warning");
      setTimeout(() => setNotification(null, "warning"), 3000);
    } catch (error) {
      console.error("Error deleting file:", error);
      setNotification(
        `Failed to delete file: ${fileName}. The file will remain in your repository.`,
        "error",
      );
      setTimeout(() => setNotification(null, "error"), 5000);
    }
  };

  /**
   * Trigger file upload input for the Import atom
   * @param {string} fileType - File extension to accept (e.g., "svg", "stl", "step")
   * @param {Function} onFileSelected - Callback when file is selected
   */
  const triggerFileUpload = (fileType, onFileSelected) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "." + fileType.toLowerCase();
    input.style.display = "none";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file && onFileSelected) {
        onFileSelected(file);
      }
      // Clean up
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  };

  /**
   * Fetch a file from the current GitHub repository using authenticated Octokit
   */
  const fetchFileContent = async (owner, repo, path) => {
    return authorizedUserOcto.rest.repos.getContent({ owner, repo, path });
  };

  const value = {
    uploadFile,
    deleteFile,
    triggerFileUpload,
    fetchFileContent,
  };

  return (
    <FileImportContext.Provider value={value}>
      {children}
    </FileImportContext.Provider>
  );
}

/**
 * Hook to use the FileImportContext
 */
export function useFileImport() {
  const context = useContext(FileImportContext);
  if (!context) {
    throw new Error("useFileImport must be used within a FileImportProvider");
  }
  return context;
}
