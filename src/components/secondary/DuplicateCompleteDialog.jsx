import { useNavigate } from "react-router-dom";

function DuplicateCompleteDialog({
  isOpen,
  onClose,
  newProjectName,
  newProjectOwner,
  newProjectRepoName,
}) {
  const navigate = useNavigate();

  const handleNavigateToNew = () => {
    onClose();
    navigate(`/${newProjectOwner}/${newProjectRepoName}`);
    // Reload the page to load the new project
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
      <h3 style={{ margin: "0 0 15px 0" }}>Project Duplicated Successfully!</h3>
      
      <p style={{ margin: "0 0 20px 0" }}>
        Your project has been duplicated as <strong>{newProjectName}</strong>.
      </p>
      
      <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
        Would you like to open the new project or stay in the current one?
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
          style={{
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Stay Here
        </button>
        <button
          onClick={handleNavigateToNew}
          autoFocus
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Open New Project
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

export default DuplicateCompleteDialog;
