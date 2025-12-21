import { useNavigate } from "react-router-dom";

/**
 * Dialog to confirm navigation to an owned GitHub molecule project
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {function} onClose - Function to close the dialog
 * @param {string} owner - The owner of the GitHub molecule
 * @param {string} repoName - The repository name of the GitHub molecule
 * @param {string} moleculeName - The name of the molecule being navigated to
 */
function NavigateToMoleculeDialog({
  isOpen,
  onClose,
  owner,
  repoName,
  moleculeName,
}) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    onClose();
    navigate(`/${owner}/${repoName}`);
    // Reload the page to load the target project
    window.location.reload();
  };

  const handleStay = () => {
    onClose();
  };

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
      <h3 style={{ margin: "0 0 15px 0" }}>Navigate to Another Project?</h3>

      <p style={{ margin: "0 0 20px 0" }}>
        You are about to navigate to the project{" "}
        <strong>{moleculeName || repoName}</strong>.
      </p>

      <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
        This will leave your current project and take you to{" "}
        <strong>
          {owner}/{repoName}
        </strong>
        . Would you like to continue?
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
          onClick={handleStay}
          autoFocus
          style={{
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleNavigate}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Navigate to Project
        </button>
      </div>

      <a
        className="closeButton"
        onClick={handleStay}
        style={{ cursor: "pointer" }}
      >
        {"\u00D7"}
      </a>
    </dialog>
  );
}

export default NavigateToMoleculeDialog;
