import React, { useState } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { Link } from "react-router-dom";
import globalvariables from "../../js/globalvariables.js";

function ToggleRunCreate({ run, isItOwned }) {
  const [runModeon, setRunMode] = useState(run);

  const handleChange = () => {
    setRunMode(!runModeon);
  };
  if (globalvariables.currentRepo) {
    if (!runModeon) {
      return (
        <>
          <Link
            key={
              GlobalVariables.currentRepo
                ? GlobalVariables.currentRepo.id
                : null
            }
            to={
              GlobalVariables.currentRepo
                ? `/run/${GlobalVariables.currentRepo.owner}/${GlobalVariables.currentRepo.repoName}`
                : "/run"
            }
            onClick={handleChange}
            style={{ position: "absolute" }}
          >
            <label title="Create/Run Mode" className="switch">
              <button
                style={{
                  width: "100px",
                  backgroundColor: "#3F4243",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <p id="runMode_button">Run Mode</p>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 9 5"
                  xmlns="http://www.w3.org/2000/svg"
                  className="leva-c-cHvNmv"
                  style={{
                    transform: "rotate(-90deg)",
                    alignSelf: "center",
                    fill: "#c4a3d5",
                  }}
                >
                  <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
                </svg>
              </button>
            </label>
          </Link>
        </>
      );
    } else {
      return (
        <>
          <Link
            key={GlobalVariables.currentRepo.id}
            to={
              isItOwned
                ? `/${GlobalVariables.currentRepo.owner}/${GlobalVariables.currentRepo.repoName}`
                : `/`
            }
            onClick={handleChange}
          >
            <label title="Create/Run Mode" className="switch_run">
              <button
                style={{
                  width: "100px",
                  backgroundColor: "#3F4243",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 9 5"
                  xmlns="http://www.w3.org/2000/svg"
                  className="leva-c-cHvNmv"
                  style={{
                    transform: "rotate(90deg)",
                    alignSelf: "center",
                    fill: "#c4a3d5",
                  }}
                >
                  <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
                </svg>
                <p
                  style={{
                    fontSize: "12px",
                    padding: "0 5px 0 5px",
                    color: "#c4a3d5",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  }}
                >
                  {isItOwned ? "Create Mode" : "Browse Projects"}
                </p>
              </button>
            </label>
          </Link>
        </>
      );
    }
  }
}

export default ToggleRunCreate;
