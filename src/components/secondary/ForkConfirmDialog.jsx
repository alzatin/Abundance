import { useEffect } from "react";

function ForkConfirmDialog({ isOpen, onClose, onConfirm, projectName, projectOwner }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  // Add document-level keyboard event listener with priority
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        handleKeyPress(e);
      }
    };

    // Add listener with capture phase to get priority
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      open={isOpen}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "20px",
        minWidth: "400px",
      }}
      className="share-dialog"
    >
      <h3 style={{ margin: "0 0 15px 0" }}>Fork Project</h3>

      <p style={{ margin: "10px 0", lineHeight: "1.5" }}>
        Are you sure you want to fork <strong>{projectName}</strong> by{" "}
        <strong>{projectOwner}</strong>?
      </p>

      <p style={{ margin: "10px 0", fontSize: "14px", color: "#666" }}>
        This will create a copy of the project in your account.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          autoFocus
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "var(--abundance-color-brightPurple)",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Fork
        </button>
      </div>

      <a
        className="closeButton"
        onClick={onClose}
        style={{ cursor: "pointer" }}
      >
        {"\u00D7"}
      </a>
    </dialog>
  );
}

export default ForkConfirmDialog;
