import React, { useState } from "react";
import "./ThumbnailDialog.css";

/**
 * ThumbnailDialog Component
 * Displays a screenshot preview and allows user to set it as the default project thumbnail
 */
export default function ThumbnailDialog({
  isOpen,
  imageDataUrl,
  onClose,
  onSetAsThumbnail,
  projectName,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSetAsThumbnail = async () => {
    setIsLoading(true);
    try {
      if (onSetAsThumbnail) {
        await onSetAsThumbnail(imageDataUrl);
      }
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="thumbnail-dialog-overlay">
      <div className="thumbnail-dialog">
        <div className="thumbnail-dialog-header">
          <h2>Set Project Thumbnail</h2>
          <button
            className="thumbnail-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="thumbnail-dialog-content">
          <div className="thumbnail-preview-container">
            <img
              src={imageDataUrl}
              alt="Screenshot preview"
              className="thumbnail-preview-image"
            />
          </div>

          <div className="thumbnail-dialog-message">
            <p>
              Use this screenshot as the default thumbnail for{" "}
              <strong>{projectName || "this project"}</strong>?
            </p>
          </div>
        </div>

        <div className="thumbnail-dialog-footer">
          <button
            className="thumbnail-dialog-btn thumbnail-dialog-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="thumbnail-dialog-btn thumbnail-dialog-btn-confirm"
            onClick={handleSetAsThumbnail}
            disabled={isLoading}
          >
            {isLoading ? "Setting..." : "Set as Thumbnail"}
          </button>
        </div>
      </div>
    </div>
  );
}
