import React, { useMemo, useState } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { useNavigate } from "react-router-dom";

const buttonTextStyle = {
  fontSize: "12px",
  padding: "0 5px 0 5px",
  color: "#c4a3d5",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};

const normalizeRepo = (repo) => {
  if (!repo) return null;

  const owner = repo.owner?.login ?? repo.owner ?? null;
  const repoName = repo.name ?? repo.repoName ?? repo.repo ?? null;

  if (!owner || !repoName) return null;
  return { owner, repoName };
};

function ToggleRunCreate({
  buttons = [],
  containerClassName,
  setActiveAtom,
  targetRepo,
}) {
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();

  const previewOriginProject = useMemo(() => {
    const originProject = sessionStorage.getItem("previewOriginProject");
    if (!originProject) return null;

    try {
      return JSON.parse(originProject);
    } catch (error) {
      console.error("Error parsing origin project:", error);
      return null;
    }
  }, []);

  const resetActiveAtom = () => {
    if (setActiveAtom && GlobalVariables.topLevelMolecule) {
      setActiveAtom(GlobalVariables.topLevelMolecule);
    }
  };

  const resolveTargetRepo = (buttonTargetRepo) => {
    const repoCandidates = [
      buttonTargetRepo,
      targetRepo,
      GlobalVariables.currentRepo,
      GlobalVariables.currentAWSnode,
    ];

    for (const repoCandidate of repoCandidates) {
      const normalizedRepo = normalizeRepo(repoCandidate);
      if (normalizedRepo) return normalizedRepo;
    }

    return null;
  };

  // Preserve unsaved project edits when a transition leaves the editable view.
  const saveCurrentProjectState = (repo) => {
    if (!GlobalVariables.topLevelMolecule || !repo?.owner || !repo?.repoName) {
      return;
    }

    const projectState = GlobalVariables.topLevelMolecule.serialize();
    projectState.filetypeVersion = 1;
    const projectKey = `unsavedProject_${repo.owner}_${repo.repoName}`;
    localStorage.setItem(projectKey, JSON.stringify(projectState));
  };

  // Defer route changes until the current render cycle has completed.
  const navigateDeferred = (path, options) => {
    setTimeout(() => {
      navigate(path, options);
    }, 0);
  };

  const restorePreviewOriginProject = () => {
    if (!previewOriginProject?.owner || !previewOriginProject?.repoName) {
      if (sessionStorage.getItem("previewOriginProject")) {
        console.warn("Preview origin project is unavailable for restoration.");
      }
      return false;
    }

    GlobalVariables.currentAWSnode = {
      owner: previewOriginProject.owner,
      repoName: previewOriginProject.repoName,
    };
    sessionStorage.removeItem("previewOriginProject");
    navigateDeferred(
      `/${previewOriginProject.owner}/${previewOriginProject.repoName}`,
    );
    return true;
  };

  const handleButtonClick = (button) => (event) => {
    event.preventDefault();

    const repo = resolveTargetRepo(button.targetRepo);

    if (typeof button.beforeNavigate === "function") {
      button.beforeNavigate({ repo, resetActiveAtom, saveCurrentProjectState });
    }

    switch (button.action) {
      case "run":
        saveCurrentProjectState(repo);
        resetActiveAtom();
        if (repo) navigateDeferred(`/run/${repo.owner}/${repo.repoName}`);
        break;
      case "create":
        resetActiveAtom();
        if (repo) navigateDeferred(`/${repo.owner}/${repo.repoName}`);
        break;
      case "preview":
        if (repo) navigateDeferred(`/preview/${repo.owner}/${repo.repoName}`);
        break;
      case "browse":
        resetActiveAtom();
        saveCurrentProjectState(repo);
        navigateDeferred("/", { state: { fromRunMode: true } });
        break;
      case "preview-back":
        resetActiveAtom();
        if (restorePreviewOriginProject()) {
          break;
        }

        if (repo) navigateDeferred(`/run/${repo.owner}/${repo.repoName}`);
        break;
      default:
        break;
    }
  };

  const renderedButtons = buttons.map((button, index) => {
    const key =
      button.key ?? button.id ?? button.label ?? button.title ?? `button-${index}`;
    const label =
      button.label ??
      (button.action === "preview-back"
        ? previewOriginProject
          ? "Back to Project"
          : "Back to Run Mode"
        : null);
    const title =
      button.title ??
      (button.action === "preview-back"
        ? previewOriginProject
          ? "Back to Original Project"
          : "Back to Run Mode"
        : undefined);
    const iconRotation = button.iconRotation ?? 90;

    return (
      <label
        key={key}
        title={button.tooltipText ? undefined : title}
        className={button.wrapperClassName ?? "switch_run"}
      >
        <button
          id={button.id}
          onClick={handleButtonClick(button)}
          onMouseEnter={() => setHoveredButton(key)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {button.showIcon === false ? null : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: `rotate(${iconRotation}deg)`,
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
          )}
          {label ? <p style={button.textStyle ?? buttonTextStyle}>{label}</p> : null}
          {button.tooltipText && hoveredButton === key ? (
            <span className="runmode-tooltip">{button.tooltipText}</span>
          ) : null}
        </button>
      </label>
    );
  });

  if (!renderedButtons.length) return null;

  if (containerClassName) {
    return <div className={containerClassName}>{renderedButtons}</div>;
  }

  return renderedButtons;
}

export default ToggleRunCreate;
