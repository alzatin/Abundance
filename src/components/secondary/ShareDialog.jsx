import GlobalVariables from "../../js/globalvariables.js";
import { saveAs } from "file-saver";

function ShareDialog({
  shareDialog,
  setShareDialog,
  dialogContent,
  activeAtom,
}) {
  /* Makes a POST request to the API to update the ranking of the current molecule */
  const addRanking = () => {
    const apiUpdateUrl =
      "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/update-item";
    fetch(apiUpdateUrl, {
      method: "POST",
      body: JSON.stringify({
        owner: GlobalVariables.currentRepo.owner.login,
        repoName: GlobalVariables.currentRepo.name,
        attributeUpdates: { ranking: 1 },
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const handleExport = (exportType) => {
    const exportID = GlobalVariables.generateUniqueID();
    GlobalVariables.cad
      .visExport(
        exportID,
        GlobalVariables.topLevelMolecule.uniqueID,
        exportType
      )
      .then((result) => {
        let resolution = 72;
        GlobalVariables.cad
          .downExport(
            exportID,
            exportType,
            resolution,
            GlobalVariables.topLevelMolecule.unitsKey
          )
          .then((result) => {
            saveAs(
              result,
              GlobalVariables.currentMolecule.name +
                "." +
                exportType.toLowerCase()
            );

            addRanking();
          })
          .catch("Error downloading export file");
      })
      .catch("Error creating export geometry");
  };

  // SVG for copy icon

  const CopyIcon = (
    <svg
      width="28"
      height="28"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: "pointer", marginLeft: 8, verticalAlign: "middle" }}
    >
      <rect
        x="5"
        y="7"
        width="9"
        height="9"
        rx="2"
        stroke="#f7eff9ff"
        strokeWidth="1.5"
      />
      <rect
        x="7"
        y="4"
        width="9"
        height="9"
        rx="2"
        stroke="#f7eff9ff"
        strokeWidth="1.5"
      />
    </svg>
  );
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
  };
  const shareUrl =
    window.location.origin +
    "/run/" +
    GlobalVariables.currentRepo.owner.login +
    "/" +
    GlobalVariables.currentRepo.name;

  return (
    <>
      <dialog
        open={shareDialog}
        style={{
          display: "flex",
          alignItems: "center",
        }}
        className="share-dialog"
      >
        {dialogContent == "share" ? (
          <div
            style={{ display: "flex", margin: "10px", alignItems: "center" }}
          >
            <p style={{ margin: "0", flexBasis: "30%" }}>Share this project:</p>
            <a
              style={{ margin: "16px", flexBasis: "50%" }}
              href={
                window.location.origin +
                "/run/" +
                GlobalVariables.currentRepo.owner.login +
                "/" +
                GlobalVariables.currentRepo.name
              }
              target="_blank"
            >
              {shareUrl}
            </a>
            <span title="Copy to clipboard" onClick={handleCopy}>
              {CopyIcon}
            </span>
          </div>
        ) : dialogContent == "export" ? (
          <div
            style={{
              display: "flex",
              margin: "10px",
              alignItems: "center",
            }}
          >
            <p style={{ margin: "0", flexBasis: "40%" }}>Export as:</p>
            <button autoFocus onClick={() => handleExport("STL")}>
              {" "}
              STL
            </button>
            <button autoFocus onClick={() => handleExport("STEP")}>
              {" "}
              STEP
            </button>
            <button autoFocus onClick={() => handleExport("SVG")}>
              {" "}
              SVG
            </button>
          </div>
        ) : null}

        <a className="closeButton" onClick={() => setShareDialog(false)}>
          {"\u00D7"}
        </a>
      </dialog>
    </>
  );
}

export default ShareDialog;
