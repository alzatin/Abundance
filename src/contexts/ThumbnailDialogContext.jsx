import React, { createContext, useContext, useState } from "react";
import ThumbnailDialog from "../components/dialogs/ThumbnailDialog.jsx";

const ThumbnailDialogContext = createContext();

/**
 * ThumbnailDialogProvider
 * Manages the state and display of the thumbnail dialog
 */
export function ThumbnailDialogProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [projectName, setProjectName] = useState(null);
  const [onSetAsThumbnailCallback, setOnSetAsThumbnailCallback] =
    useState(null);

  const openDialog = (dataUrl, projectTitle = null, callback = null) => {
    setImageDataUrl(dataUrl);
    setProjectName(projectTitle);
    setOnSetAsThumbnailCallback(() => callback);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setImageDataUrl(null);
    setProjectName(null);
    setOnSetAsThumbnailCallback(null);
  };

  const value = {
    openDialog,
    closeDialog,
  };

  return (
    <ThumbnailDialogContext.Provider value={value}>
      {children}
      <ThumbnailDialog
        isOpen={isOpen}
        imageDataUrl={imageDataUrl}
        projectName={projectName}
        onClose={closeDialog}
        onSetAsThumbnail={onSetAsThumbnailCallback}
      />
    </ThumbnailDialogContext.Provider>
  );
}

/**
 * Hook to use the ThumbnailDialogContext
 */
export function useThumbnailDialog() {
  const context = useContext(ThumbnailDialogContext);
  if (!context) {
    throw new Error(
      "useThumbnailDialog must be used within a ThumbnailDialogProvider",
    );
  }
  return context;
}
