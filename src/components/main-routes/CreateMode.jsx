import React, { useEffect, useState, useRef, use } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import ToggleRunCreate from "../secondary/ToggleRunCreate.jsx";
import TopMenu from "../secondary/TopMenu.jsx";
import FlowCanvas from "./flowCanvas.jsx";
import LowerHalf from "./lowerHalf.jsx";
import CodeWindow from "../secondary/codeWindow.jsx";
import {
  BrowserRouter as Router,
  useParams,
  useNavigate,
} from "react-router-dom";
import NewProjectPopUp from "../secondary/NewProjectPopUp.jsx";
import { Link } from "react-router-dom";

import ParamsMenu from "../secondary/ParamsMenu.jsx";
import RenderMenu from "../secondary/RenderMenu.jsx";
import BomMenu from "../secondary/BomMenu.jsx";
import GitSearchMenu from "../secondary/GitSearchMenu.jsx";
import RenderProgressBar from "../secondary/RenderProgressBar.jsx";
import { useTutorial } from "../../tutorial/TutorialManager";
import { TutorialOverlay } from "../../tutorial/TutorialOverlay";
import { useProgressBar } from "../secondary/ProgressBarManager.jsx";

// Import contexts
import {
  useAuth,
  useAppState,
  useRendering,
  useProject,
  useFileImport,
} from "../../contexts/index.js";
/**
 * Create mode component appears displays flow canvas, renderer and sidebar when
 * a user has been authorized access to a project.
 * @prop {object} authorizedUserOcto - authorized octokit instance
 * @prop {setstate} setRunMode - setState function for runMode
 * @prop {boolean} RunMode - Determines if Run mode is on or off
 */
function CreateMode() {
  // Get context values
  const { authorizedUserOcto, authRedirectHandler } = useAuth();
  const {
    activeAtom,
    setActiveAtom,
    shortCutsOn,
    exportPopUp,
    setExportPopUp,
    redirectType,
  } = useAppState();
  const {
    setMesh,
    setWireMesh,
    renderProgress,
    renderBarVisible,
    backgroundUsdzFile,
    setBackgroundUsdzFile,
    backgroundUsdzSha,
    setBackgroundUsdzSha,
    showBackgroundModel,
    setShowBackgroundModel,
    userUploadedFile,
    setUserUploadedFile,
    solidParam,
    setSolid,
    showTopLevelWireframe,
    setShowTopLevelWireframe,
  } = useRendering();

  const {
    cad,
    loadProject,
    searchGithubMolecules,
    saveProject: saveProjectFromContext,
  } = useProject();
  const { uploadFile, deleteFile, importNotification } = useFileImport();
  const meshRef = useRef();

  // Make meshRef, file import functions, and save function available globally
  useEffect(() => {
    GlobalVariables.meshRef = meshRef;
    GlobalVariables.uploadFile = uploadFile;
    GlobalVariables.deleteFile = deleteFile;
    // Make a simple save wrapper available that doesn't require state management
    GlobalVariables.saveProject = () => {
      saveProject(() => {}, "Upload Save");
    };
    return () => {
      GlobalVariables.meshRef = null;
      GlobalVariables.uploadFile = null;
      GlobalVariables.deleteFile = null;
      GlobalVariables.saveProject = null;
    };
  }, [uploadFile, deleteFile]);

  const navigate = useNavigate();

  /** State for error notification */
  const [errorNotification, setErrorNotification] = useState(null);

  // Wrapper function that calls saveProject with CreateMode-specific parameters
  const saveProject = (setSaveProgress, typeSave, forceSave = false) => {
    return saveProjectFromContext(
      setSaveProgress,
      typeSave,
      forceSave,
      meshRef,
      setErrorNotification
    );
  };

  // Register render progress bar
  useProgressBar(
    "render",
    renderBarVisible,
    renderProgress,
    "Rendering",
    false
  );

  /** State for save progress bar */
  const [saveState, setSaveState] = useState(0);
  const [savePopUp, setSavePopUp] = useState(false);

  const [settingsPopUp, setSettingsPopUp] = useState(false);
  // Ref to always have latest settingsPopUp value in event handlers
  const settingsPopUpRef = useRef(settingsPopUp);

  useEffect(() => {
    settingsPopUpRef.current = settingsPopUp;
  }, [settingsPopUp]);

  // Ref to always have latest exportPopUp value in event handlers
  const exportPopUpRef = useRef(exportPopUp);
  useEffect(() => {
    exportPopUpRef.current = exportPopUp;
  }, [exportPopUp]);

  const [duplicateDialog, setDuplicateDialog] = useState(false);
  // Ref to always have latest duplicateDialog value in event handlers
  const duplicateDialogRef = useRef(duplicateDialog);
  useEffect(() => {
    duplicateDialogRef.current = duplicateDialog;
  }, [duplicateDialog]);

  /** State for top level molecule */
  const [currentMoleculeTop, setTop] = useState(false);

  // Refs for rendering state to avoid stale closures in keyboard shortcuts
  const solidParamRef = useRef(solidParam);
  useEffect(() => {
    solidParamRef.current = solidParam;
  }, [solidParam]);

  const showTopLevelWireframeRef = useRef(showTopLevelWireframe);
  useEffect(() => {
    showTopLevelWireframeRef.current = showTopLevelWireframe;
  }, [showTopLevelWireframe]);

  /** State for menu content collapsing */
  // Which menu is expanded: "params", "render", "bom", or "none"
  const [expandedMenu, setExpandedMenu] = useState(
    GlobalVariables.isMobile() ? "none" : "params"
  );

  /**
   * Object containing letters and values used for keyboard shortcuts
   * @type {object?}
   */
  var shortCuts = {
    a: "Assembly",
    b: "Molecule",
    c: "Copy",
    e: "Extrude",
    g: "GitHubMolecule",
    i: "Input",
    j: "Move",
    r: "Rotate",
    m: "Move-to-Molecule",
    s: "Save",
    v: "Paste",
    x: "Equation",
    z: "Undo",
    "(ALT)": "GitSearch",
    "(CTRL+SHIFT)+U": "Go-Up",
    "(CTRL+SHIFT)+W": "Wireframe",
    "(CTRL+SHIFT)+A": "Show-Top-Level-Mesh",
  };

  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      let height;
      if (window.visualViewport) {
        height = window.visualViewport.height;
      } else if (GlobalVariables.isMobile()) {
        height = window.screen.height;
      } else {
        height = window.innerHeight;
      }
      setWindowSize({
        width: window.innerWidth,
        height,
      });
    }
    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []); // Empty array ensures that effect is only run on mount

  /** Checks if activeAtom is topLevel to render goUp button */
  useEffect(() => {
    if (activeAtom && activeAtom.atomType == "Molecule") {
      setTop(!activeAtom.topLevel);
    }
  }, [activeAtom]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  // Attach keyup event listener
  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const expandedMenuRef = useRef(expandedMenu);
  useEffect(() => {
    expandedMenuRef.current = expandedMenu;
  }, [expandedMenu]);

  /**
   * Handles keydown events for keyboard shortcuts.
   * @param {KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    //Save project with Ctrl+S or Cmd+S (should work even when code is active)
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      setSavePopUp(true);
      saveProject(setSaveState, "User Save");
    }

    //Copy /paste listeners
    if (e.key == "Control" || e.key == "Meta") {
      GlobalVariables.ctrlDown = true;
    }
    // Prevent forwarding if code atom is active, we don't want to interfere with code editing
    if (!document.getElementById("code-window").classList.contains("code-off"))
      return;
    // Use ref to always get latest value
    if (settingsPopUpRef.current) return; // Do not trigger shortcuts if settings popup is open
    if (exportPopUpRef.current) return; // Do not trigger shortcuts if export popup is open
    if (duplicateDialogRef.current) return; // Do not trigger shortcuts if duplicate dialog is open

    // CTRL+SHIFT+I: Go up a level
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "U") {
      e.preventDefault();
      GlobalVariables.currentMolecule.goToParentMolecule();
      setActiveAtom(GlobalVariables.currentMolecule);

      return;
    }

    // CTRL+SHIFT+W: Toggle wireframe on/off
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "W") {
      e.preventDefault();
      setSolid(!solidParamRef.current);
      return;
    }

    // CTRL+SHIFT+A: Toggle top level wireframe on/off
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
      e.preventDefault();
      setShowTopLevelWireframe(!showTopLevelWireframeRef.current);
      return;
    }

    if (
      (e.key === "Alt" || e.key === "AltGraph") &&
      !GlobalVariables.ctrlDown
    ) {
      // Trigger GitSearch Panel when Option/Alt is pressed
      setExpandedMenu(
        expandedMenuRef.current === "git-search" ? "params" : "git-search"
      );
    } else {
      if (expandedMenuRef.current === "git-search") {
        forwardKeyToGitPanel(e);
      }
      if (expandedMenuRef.current !== "git-search") {
        forwardKeyToPanel(e);
      }
    }
    /*
    // Example: Toggle shortcut display with Ctrl+/
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      setShortCuts((prev) => !prev);
    }
    // Add more shortcuts as needed
    // Example: Focus code window with Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      const codeWindow = document.getElementById("codeWindowInput");
      if (codeWindow) codeWindow.focus();
    }*/
    // Forward key to panel if needed
  };
  /**
   * Handles keyup events for keyboard shortcuts.
   * @param {KeyboardEvent} e
   */
  const handleKeyUp = (e) => {
    // Reset ctrlDown flag when Control or Meta key is released
    if (e.key === "Control" || e.key === "Meta") {
      GlobalVariables.ctrlDown = false;
    }
  };

  const panelRef = useRef();
  const gitRef = useRef();

  // When you want to trigger the panel keydown:
  const forwardKeyToPanel = (event) => {
    if (panelRef.current && panelRef.current.triggerPanelKeyDown) {
      panelRef.current.triggerPanelKeyDown(event);
    }
  };
  const forwardKeyToGitPanel = (event) => {
    if (gitRef.current && gitRef.current.triggerPanelKeyDown) {
      gitRef.current.triggerPanelKeyDown(event);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    //Set autosave interval
    const myInterval = setInterval(() => {
      setSavePopUp(true);
      saveProject(setSaveState, "Auto Save");
    }, 300000);

    //Clearing the interval
    return () => clearInterval(myInterval);
  }, []);

  /**
   * Scan repository for background 3D model files when project loads
   */
  const scanForBackgroundModels = async () => {
    if (!authorizedUserOcto) {
      return;
    }

    if (
      !GlobalVariables.currentAWSnode.owner ||
      !GlobalVariables.currentAWSnode.repoName
    ) {
      return;
    }

    try {
      const files = await authorizedUserOcto.rest.repos.getContent({
        owner: GlobalVariables.currentAWSnode.owner,
        repo: GlobalVariables.currentAWSnode.repoName,
        path: "",
      });

      // Look for GLB or GLTF files
      const backgroundFiles = files.data.filter(
        (file) =>
          file.type === "file" &&
          (file.name.toLowerCase().endsWith(".glb") ||
            file.name.toLowerCase().endsWith(".gltf"))
      );

      if (backgroundFiles.length > 0) {
        // Use the first background model file found
        const firstFile = backgroundFiles[0];

        // Only set if we don't already have a background file set OR if user hasn't uploaded a file
        // This prevents overriding user uploads
        if (!backgroundUsdzFile && !userUploadedFile) {
          setBackgroundUsdzFile(firstFile.name);
          setBackgroundUsdzSha(firstFile.sha);
          // Don't auto-enable the display, let user choose
          setShowBackgroundModel(false);
        } else {
          // If user uploaded a file, ensure it stays enabled
          if (userUploadedFile && backgroundUsdzFile) {
            setShowBackgroundModel(true);
          }
        }
      }
    } catch (error) {
      console.error("Error scanning for background models:", error);
    }
  };

  // Scan for background models when component mounts or project changes
  useEffect(() => {
    if (
      authorizedUserOcto &&
      GlobalVariables.currentAWSnode?.owner &&
      GlobalVariables.currentAWSnode?.repoName
    ) {
      scanForBackgroundModels();
    }
  }, [authorizedUserOcto, GlobalVariables.currentAWSnode]);

  // Reset background model state when project changes to ensure clean state
  useEffect(() => {
    setBackgroundUsdzFile(null);
    setBackgroundUsdzSha(null);
    setShowBackgroundModel(false);
    setUserUploadedFile(false);
  }, [GlobalVariables.currentAWSnode]);

  /**
   * Upload a 3D background file (GLB/GLTF) to GitHub
   */
  const uploadBackground3D = async function (file) {
    // Set userUploadedFile flag immediately to prevent auto-detection from interfering
    setUserUploadedFile(true);

    try {
      // Read file as base64
      const base64result = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          resolve(e.target.result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Use "background" as filename with original extension
      const fileExtension = file.name.substring(file.name.lastIndexOf("."));
      const backgroundFileName = `background${fileExtension}`;

      const result =
        await authorizedUserOcto.rest.repos.createOrUpdateFileContents({
          owner: GlobalVariables.currentAWSnode.owner,
          repo: GlobalVariables.currentAWSnode.repoName,
          path: backgroundFileName,
          message: "Upload background 3D model",
          content: base64result,
          ...(backgroundUsdzSha ? { sha: backgroundUsdzSha } : {}),
        });

      setBackgroundUsdzFile(backgroundFileName);
      setBackgroundUsdzSha(result.data.content.sha);
      setShowBackgroundModel(true);

      saveProject(setSaveState, "Background 3D Model Upload Save");
      setImportNotification(
        `Background 3D model uploaded: ${backgroundFileName}`
      );
      setTimeout(() => setImportNotification(null), 3000);
    } catch (error) {
      console.error("Error uploading 3D model:", error);
      // Reset userUploadedFile flag on error
      setUserUploadedFile(false);
      setImportNotification("Failed to Upload 3D Model");
      setTimeout(() => setImportNotification(null), 3000);
    }
  };

  /**
   * Delete background 3D model file from GitHub
   */
  const deleteBackground3D = async function () {
    if (!backgroundUsdzFile || !backgroundUsdzSha) {
      return;
    }

    try {
      await authorizedUserOcto.rest.repos.deleteFile({
        owner: GlobalVariables.currentAWSnode.owner,
        repo: GlobalVariables.currentAWSnode.repoName,
        path: backgroundUsdzFile,
        message: "Deleted background 3D model",
        sha: backgroundUsdzSha,
      });

      setBackgroundUsdzFile(null);
      setBackgroundUsdzSha(null);
      setShowBackgroundModel(false);
      setUserUploadedFile(false); // Reset user upload flag

      setImportNotification(`Background 3D model deleted`);
      setTimeout(() => setImportNotification(null), 3000);
    } catch (error) {
      console.error("Error deleting background 3D model file:", error);
      alert(
        `Failed to delete 3D model file. The file will remain in your repository.`
      );
    }
  };

  const { start, isActive } = useTutorial();
  const screenHeight = window.innerHeight;
  if (authorizedUserOcto) {
    if (
      GlobalVariables.currentAWSnode &&
      GlobalVariables.currentAWSnode.owner === GlobalVariables.currentUser
    ) {
      return (
        <>
          {isActive ? <TutorialOverlay /> : null}
          <ParamsMenu
            position={{ top: screenHeight / 2 - 10, left: 10 }}
            id={"atom-create-params-panel"}
            contentCollapsed={expandedMenu !== "params"}
            setContentCollapsed={() => setExpandedMenu("params")}
            panelRef={panelRef}
            closeMenu={() => setExpandedMenu("none")}
            initialCollapsed={true}
            collapsedOffset={[45, 0]}
          />
          <RenderMenu
            {...{
              contentCollapsed: expandedMenu !== "render",
              setContentCollapsed: () => setExpandedMenu("render"),
              position: { top: screenHeight / 2 + 35, left: 10 },
              collapsedOffset: [45, -45],
              closeMenu: () => setExpandedMenu("none"),
            }}
            id={"atom-create-render-panel"}
          />
          <BomMenu
            {...{
              id: "atom-bom-panel",
              contentCollapsed: expandedMenu !== "bom",
              setContentCollapsed: () => setExpandedMenu("bom"),
              closeMenu: () => setExpandedMenu("none"),
              position: { top: screenHeight / 2 + 80, left: 10 },
              collapsedOffset: [45, -90],
            }}
          />
          <GitSearchMenu
            {...{
              activeAtom,
              id: "atom-git-search-panel",
              contentCollapsed: expandedMenu !== "git-search",
              setContentCollapsed: () => setExpandedMenu("git-search"),
              closeMenu: () => setExpandedMenu("none"),
              setParamsMenuExpanded: () => setExpandedMenu("params"),
              position: { top: screenHeight / 2 + 125, left: 10 },
              collapsedOffset: [45, -135],
              gitRef: gitRef,
              setErrorNotification: setErrorNotification,
            }}
          />
          <div id="headerBar">
            <img
              className="thumnail-logo"
              src={
                import.meta.env.VITE_APP_PATH_FOR_PICS +
                "/imgs/abundance_logo.png"
              }
              alt="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
          </div>

          {exportPopUp ? (
            <div
              className="login-popup"
              id="exporting-popup-back"
              style={{
                padding: "0",
                border: "10px solid #3e3d3d",
              }}
            >
              <div>
                {" "}
                {GlobalVariables.currentRepo ? (
                  <Link
                    to={`/${GlobalVariables.currentAWSnode.owner}/${GlobalVariables.currentAWSnode.repoName}`}
                  >
                    <button className="closeButton">
                      <img></img>
                    </button>
                  </Link>
                ) : null}
              </div>

              <NewProjectPopUp
                {...{ setExportPopUp, exporting: true, authorizedUserOcto }}
              />
            </div>
          ) : null}
          <ToggleRunCreate run={false} setActiveAtom={setActiveAtom} />
          {shortCutsOn ? (
            <div id="shortcutDiv" className="noselect">
              <li style={{ fontSize: "14px" }}>(CTRL +)</li>
              {Object.entries(shortCuts).map(([key, value]) => {
                return (
                  <li key={key} className="shortcut">
                    {key} : {value}
                  </li>
                );
              })}
            </div>
          ) : null}
          <TopMenu
            {...{
              savePopUp,
              setSavePopUp,
              saveProject,
              saveState,
              setSaveState,
              currentMoleculeTop,
              settingsPopUp,
              setSettingsPopUp,
              duplicateDialog,
              setDuplicateDialog,
            }}
          />

          <CodeWindow {...{ activeAtom }} />
          <input
            type="file"
            id="fileLoaderInput"
            style={{ display: "none" }}
            onChange={(value) => {
              let file = value.target.files[0];
              if (file) {
                uploadFile(file, activeAtom, () =>
                  saveProject(setSaveState, "Upload Save")
                );
              }
            }}
          />
          <input
            type="button"
            id="fileDeleteInput"
            style={{ display: "none" }}
            onClick={() => {
              deleteFile(activeAtom.fileName, activeAtom.sha);
            }}
          />
          <input
            type="file"
            id="backgroundUsdzInput"
            style={{ display: "none" }}
            accept=".glb,.gltf"
            onChange={(event) => {
              let file = event.target.files[0];
              if (file) {
                uploadBackground3D(file);
              }
            }}
          />
          <input
            type="button"
            id="backgroundUsdzDeleteInput"
            style={{ display: "none" }}
            onClick={() => {
              deleteBackground3D();
            }}
          />
          <FlowCanvas
            {...{
              activeAtom,
              authorizedUserOcto,
              loadProject,
              setActiveAtom,
              setSavePopUp,
              setSaveState,
              setTop,
              shortCuts,
              setMesh,
              cad,
              setWireMesh,
              importNotification,
              errorNotification,
              setErrorNotification,
              setExpandedMenu,
              windowSize,
              redirectType,
              saveProject,
            }}
          />
          <div className="parent flex-parent" id="lowerHalf">
            <LowerHalf windowSize={windowSize} ref={meshRef} />
          </div>
        </>
      );
    } else {
      // Fallback: navigate to run mode if repo is still missing
      const { owner, repoName } = useParams();
      console.log("No repository found, redirecting to run mode");
      navigate(`/run/${owner}/${repoName}`);
    }
  } else {
    /** get repository from github by the id in the url */
    console.warn("You are not logged in");
    const { owner, repoName } = useParams();
    //try reauthenticating
    authRedirectHandler({
      redirectType: "reauth",
      returnTo: `/${owner && repoName ? `${owner}/${repoName}` : ""}`,
    });
  }
}

export default CreateMode;
