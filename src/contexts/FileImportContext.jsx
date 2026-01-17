import React, { createContext, useContext, useState } from "react";
import GlobalVariables from "../js/globalvariables.js";
import { useAuth } from "./AuthContext.jsx";

const FileImportContext = createContext();

/**
 * Context provider for file import/upload operations.
 * Centralizes file upload and delete logic for Import atoms.
 */
export function FileImportProvider({ children }) {
  const { authorizedUserOcto } = useAuth();
  const [importNotification, setImportNotification] = useState(null);

  /**
   * Upload a file to the current GitHub repository
   * @param {File} file - The file to upload
   * @param {Object} activeAtom - The atom requesting the upload
   * @param {Function} onSave - Callback to trigger project save after upload
   */
  const uploadFile = async function (file, activeAtom, onSave) {
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
              (existingFile) => existingFile.name === uniqueFileName
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
                60000
              )
            ),
          ]);
          console.log("File uploaded successfully:", result);

          activeAtom.updateFile(
            { name: uniqueFileName },
            result.data.content.sha
          );
          
          if (onSave) {
            onSave();
          }

          // Show upload notification
          setImportNotification(`File uploaded: ${uniqueFileName}`);
          setTimeout(() => setImportNotification(null), 3000);
        } catch (error) {
          setImportNotification(
            `Failed to Upload File: Corrupt or exceeded size limit`
          );
          setTimeout(() => setImportNotification(null), 3000);
          console.error("Error during file upload:", error);
        }
      })();
    };

    reader.onerror = function (error) {
      console.error("Error reading file:", error);
      alert("Failed to read the file. Please try again.");
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
      setImportNotification(`File deleted: ${fileName}`);
      setTimeout(() => setImportNotification(null), 3000);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        `Failed to delete file: ${fileName}. The file will remain in your repository.`
      );
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

  const value = {
    uploadFile,
    deleteFile,
    triggerFileUpload,
    importNotification,
    setImportNotification,
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
