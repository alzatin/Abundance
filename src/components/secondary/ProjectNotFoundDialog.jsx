import React from "react";

/**
 * Dialog component that displays when a user tries to open a project that was not found on GitHub
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Callback when user closes the dialog
 * @param {function} onRetry - Callback when user clicks "Try Again"
 * @param {string} projectName - Name of the project that wasn't found
 */
function ProjectNotFoundDialog({ isOpen, onClose, onRetry, projectName }) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Project Not Found</h3>
        </div>
        <div className="popup-body">
          <p>
            The project <strong>"{projectName}"</strong> could not be found on
            GitHub. It may have been deleted or made private by the owner.
          </p>
          <p>Would you like to try loading it again?</p>
        </div>
        <div className="popup-footer">
          <button
            className="popup-button popup-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="popup-button popup-button-primary"
            onClick={() => {
              onRetry();
              onClose();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectNotFoundDialog;
