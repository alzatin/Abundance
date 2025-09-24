import React, { useState } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { Link } from "react-router-dom";

function ToggleRunCreate({ run, isItOwned, setActiveAtom }) {
  const [runModeon, setRunMode] = useState(run);
  const [showTooltip, setShowTooltip] = useState(false);
  const handleChange = () => {
    // set ActiveAtom to toplevel when switching modes
    if (setActiveAtom) {
      setActiveAtom(GlobalVariables.topLevelMolecule);
    }
    setRunMode(!runModeon);
  };
  if (GlobalVariables.currentRepo) {
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
                ? `/run/${GlobalVariables.currentRepo.owner.login}/${GlobalVariables.currentRepo.name}`
                : "/run"
            }
            onClick={handleChange}
            style={{ position: "absolute" }}
          >
            <label className="switch runmode-tooltip-container">
              <button
                title="Switch to Run Mode"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: "rotate(-90deg)",
                    alignSelf: "center",
                    display: "block",
                  }}
                >
                  <polyline
                    points="5,7 9,13 13,7"
                    fill="none"
                    stroke="#c4a3d5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {showTooltip && (
                  <span className="runmode-tooltip">RUN MODE</span>
                )}
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
                ? `/${GlobalVariables.currentRepo.owner.login}/${GlobalVariables.currentRepo.name}`
                : "/"
            }
            onClick={handleChange}
          >
            <label title="Create/Run Mode" className="switch_run">
              <button>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: "rotate(90deg)",
                    alignSelf: "center",
                    display: "block",
                  }}
                >
                  <polyline
                    points="5,7 9,13 13,7"
                    fill="none"
                    stroke="#c4a3d5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
