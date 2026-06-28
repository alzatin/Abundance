import React, { useEffect, useState, useRef } from "react";
import ThreeContext from "../render/ThreeContext.jsx";
import ReplicadMesh from "../render/ReplicadMesh.jsx";
import NonReplicadMesh from "../render/NonReplicadMesh.jsx";
import WireframeMesh from "../render/WireframeMesh.jsx";
import GlobalVariables from "../../js/globalvariables.js";

import ToggleRunCreate from "../secondary/ToggleRunCreate.jsx";
import Molecule from "../../molecules/molecule.js";
import Connector from "../../prototypes/connector.js";
import RenderMenu from "../secondary/RenderMenu.jsx";
import BomMenu from "../secondary/BomMenu.jsx";
import ReadmePanel from "../secondary/ReadmePanel.jsx";
import { useNavigate, useParams } from "react-router-dom";
import {
  addOrDeletePorts,
  inputsReadyIgnoringFreeAP,
  initializeInputsFromSaved,
} from "../../js/alwaysOneFreeInput.js";

// Import contexts
import {
  useAuth,
  useAppState,
  useRendering,
  useFileImport,
} from "../../contexts/index.js";
import { useProgressBar } from "../secondary/ProgressBarManager.jsx";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

function EmptyMode({ processing, setProcessing }) {
  // Get URL parameters
  const {
    baseOwner = "",
    baseRepo = "",
    headOwner = "",
    headRepo = "",
  } = useParams();

  // Get context values
  const { authorizedUserOcto, userScopes, authRedirectHandler } = useAuth();
  const {
    activeAtom,
    redirectType,
    setRedirectType,
    setActiveAtom,
    setErrorNotification,
  } = useAppState();
  const {
    mesh,
    wireMesh,
    outdatedMesh,
    setOutdatedMesh,
    renderProgress,
    renderBarVisible,
    renderStage,
    gridParam,
    setGrid,
    axesParam,
    setAxes,
    wireParam,
    setWire,
    solidParam,
    setSolid,
  } = useRendering();
  const { uploadFile, deleteFile } = useFileImport();

  const navigate = useNavigate();

  // Make file import functions available globally for atoms
  useEffect(() => {
    GlobalVariables.uploadFile = uploadFile;
    GlobalVariables.deleteFile = deleteFile;
    return () => {
      GlobalVariables.uploadFile = null;
      GlobalVariables.deleteFile = null;
    };
  }, [uploadFile, deleteFile]);

  // Register render progress bar
  useProgressBar(
    "render-empty",
    renderBarVisible,
    renderProgress,
    renderStage || "Rendering",
    true,
  );

  const canvasRef = useRef(1000);
  const windowSize = useWindowSize();
  const [cameraZoom, setCameraZoom] = useState(1);

  const createPuppeteerDiv = () => {
    const existingDiv = document.getElementById(
      "molecule-fully-render-puppeteer",
    );
    if (!existingDiv) {
      const invisibleDiv = document.createElement("div");
      invisibleDiv.id = "molecule-fully-render-puppeteer";
      invisibleDiv.style.display = "none";
      document.body.appendChild(invisibleDiv);
    }
  };

  useEffect(() => {
    setCameraZoom(1);
  }, [GlobalVariables.currentAWSnode]);

  useEffect(() => {
    if (cameraZoom == 1 && mesh[0]) {
      const runModeZoom = mesh[0].cameraZoom * 2;
      setCameraZoom(runModeZoom);
    }
  }, [mesh]);

  useEffect(() => {
    if (renderProgress >= 100 && !renderBarVisible) {
      const timer = setTimeout(() => {
        createPuppeteerDiv();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [renderProgress, renderBarVisible]);

  useEffect(() => {
    if (wireMesh && mesh) {
      const timer = setTimeout(() => {
        createPuppeteerDiv();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [wireMesh, mesh]);

  useEffect(() => {
    const handler = (e) => {
      setErrorNotification(e.detail.message, e.detail.type || "error");
      setTimeout(() => setErrorNotification(null, "error"), 5000);
    };
    window.addEventListener("user-notification", handler);
    return () => window.removeEventListener("user-notification", handler);
  }, []);

  const [expandedMenu, setExpandedMenu] = useState(
    GlobalVariables.isMobile() ? "none" : "params",
  );

  // Function to create and enable a new empty molecule with Output, Tags and Assembly atoms for Pull Comparison
  async function createandEnableEmptyMolecule() {
    // Create and set up a new empty molecule
    GlobalVariables.topLevelMolecule = new Molecule({
      x: 0,
      y: 0,
      topLevel: true,
      atomType: "Molecule",
      name: "New Project",
      uniqueID: GlobalVariables.generateUniqueID(),
    });

    GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
    GlobalVariables.currentMolecule.selected = true;
    GlobalVariables.currentAWSnode = null;
    GlobalVariables.currentRepo = null;

    // Create and place an Output atom in the new molecule
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Output",
        atomType: "Output",
        uniqueID: GlobalVariables.generateUniqueID(),
      },
      true,
    );
    // Create and place an Assembly atom in the new molecule
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Assembly",
        atomType: "Assembly",
        uniqueID: GlobalVariables.generateUniqueID(),
      },
      true,
    );

    // Create and place Color atoms BEFORE Tag atoms (inverted order for processing)
    // Color Head (Green - index 7)
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Color Head",
        atomType: "Color",
        uniqueID: GlobalVariables.generateUniqueID(),
        selectedColorIndex: 7,
      },
      true,
    );

    // Color Base (Red - index 1)
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Color Base",
        atomType: "Color",
        uniqueID: GlobalVariables.generateUniqueID(),
        selectedColorIndex: 1,
      },
      true,
    );

    // Create and place a Tag atom in the new molecule (Head)
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Head",
        atomType: "Tag",
        uniqueID: GlobalVariables.generateUniqueID(),
        tags: ["Head"],
      },
      true,
    );

    // Create and place a Tag atom in the new molecule (Base)
    await GlobalVariables.topLevelMolecule.placeAtom(
      {
        parentMolecule: GlobalVariables.topLevelMolecule,
        x: 0.98,
        y: 0.5,
        parent: GlobalVariables.topLevelMolecule,
        name: "Base",
        atomType: "Tag",
        uniqueID: GlobalVariables.generateUniqueID(),
        tags: ["Base"],
      },
      true,
    );

    // Enable the new molecule and all its children
    GlobalVariables.currentMolecule.enable();
    GlobalVariables.currentMolecule.enableAllChildren();

    // Subscribe the molecule to its Output atom's status changes
    // This is critical: when Output transitions to READY, the molecule needs to be notified
    // so it can call onUpstreamChange() and update its own status to READY
    const outputAtom = GlobalVariables.topLevelMolecule.getOutputAtom();
    if (outputAtom) {
      outputAtom.subscribe(
        () => {
          GlobalVariables.topLevelMolecule.onUpstreamChange();
        },
        GlobalVariables.topLevelMolecule.uniqueID,
        false,
      );
    }
  }

  // Load Head and Base molecules from GitHub if owner and repo are provided in URL params
  function loadHeadAndBaseMoleculesFromGithub() {
    return GlobalVariables.currentMolecule
      .loadGithubMoleculeByName(
        {
          owner: baseOwner,
          repoName: baseRepo,
          privateRepo: false,
        },
        {},
        [],
        { x: 0, y: 0 },
        authorizedUserOcto,
        userScopes || [],
      )
      .then((githubMolecule) => {
        return GlobalVariables.currentMolecule.loadGithubMoleculeByName(
          {
            owner: headOwner,
            repoName: headRepo,
            privateRepo: false,
          },
          {},
          [],
          { x: 0, y: 0 },
          authorizedUserOcto,
          userScopes || [],
        );
      })
      .then((headGithubMolecule) => {
        return Promise.resolve();
      })
      .catch((err) => {
        setErrorNotification(
          `Failed to load GitHub molecules: ${err.message}`,
          "error",
        );
        throw err;
      });
  }

  useEffect(() => {
    GlobalVariables.canvas = canvasRef;
    GlobalVariables.c = canvasRef.current.getContext("2d");

    // Prepare empty molecule with Output atom and Assembly atom
    createandEnableEmptyMolecule()
      .then(() => {
        // Load Head and Base as Github molecules if owner and repo are provided in URL params
        return loadHeadAndBaseMoleculesFromGithub();
      })
      .then(() => {
        // Find the GitHub molecule we just loaded
        const baseRepoMolecule =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) =>
              atom.atomType === "GitHubMolecule" && atom.name === `${baseRepo}`,
          );

        const headRepoMolecule =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) =>
              atom.atomType === "GitHubMolecule" && atom.name === `${headRepo}`,
          );

        const outputAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Output",
          );

        const assemblyAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Assembly",
          );

        const headTagAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Tag" && atom.name === "Head",
          );

        const baseTagAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Tag" && atom.name === "Base",
          );

        const headColorAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Color" && atom.name === "Color Head",
          );

        const baseColorAtom =
          GlobalVariables.topLevelMolecule.nodesOnTheScreen.find(
            (atom) => atom.atomType === "Color" && atom.name === "Color Base",
          );

        if (baseRepoMolecule && baseRepoMolecule.output) {
          if (
            outputAtom &&
            assemblyAtom &&
            headRepoMolecule &&
            headTagAtom &&
            baseTagAtom &&
            headColorAtom &&
            baseColorAtom
          ) {
            // Inverted order: GitHub → Color → Tag → Assembly
            // Create connector: headRepoMolecule output → headColorAtom input
            new Connector({
              atomType: "Connector",
              attachmentPoint1: headRepoMolecule.output,
              attachmentPoint2: headColorAtom.inputs[0],
              parentMolecule: GlobalVariables.topLevelMolecule,
            });

            // Create connector: baseRepoMolecule output → baseColorAtom input
            new Connector({
              atomType: "Connector",
              attachmentPoint1: baseRepoMolecule.output,
              attachmentPoint2: baseColorAtom.inputs[0],
              parentMolecule: GlobalVariables.topLevelMolecule,
            });

            // Create connector: headColorAtom output → headTagAtom input
            new Connector({
              atomType: "Connector",
              attachmentPoint1: headColorAtom.output,
              attachmentPoint2: headTagAtom.inputs[0],
              parentMolecule: GlobalVariables.topLevelMolecule,
            });

            // Create connector: baseColorAtom output → baseTagAtom input
            new Connector({
              atomType: "Connector",
              attachmentPoint1: baseColorAtom.output,
              attachmentPoint2: baseTagAtom.inputs[0],
              parentMolecule: GlobalVariables.topLevelMolecule,
            });

            // Create connector: headTagAtom output → assemblyAtom (first available input)
            const headAssemblyInput =
              GlobalVariables.topLevelMolecule.findFirstAvailableGeometryInput(
                assemblyAtom,
              );
            if (headAssemblyInput) {
              new Connector({
                atomType: "Connector",
                attachmentPoint1: headTagAtom.output,
                attachmentPoint2: headAssemblyInput,
                parentMolecule: GlobalVariables.topLevelMolecule,
              });
            }
            addOrDeletePorts(assemblyAtom); // Ensure ports are updated after adding connectors

            // Create connector: baseTagAtom output → assemblyAtom (next available input)
            const baseAssemblyInput =
              GlobalVariables.topLevelMolecule.findFirstAvailableGeometryInput(
                assemblyAtom,
              );
            if (baseAssemblyInput) {
              new Connector({
                atomType: "Connector",
                attachmentPoint1: baseTagAtom.output,
                attachmentPoint2: baseAssemblyInput,
                parentMolecule: GlobalVariables.topLevelMolecule,
              });
            }

            // Create connector: assemblyAtom output → outputAtom input
            new Connector({
              atomType: "Connector",
              attachmentPoint1: assemblyAtom.output,
              attachmentPoint2: outputAtom.inputs[0],
              parentMolecule: GlobalVariables.topLevelMolecule,
            });
          } else {
            // All required atoms not found or missing inputs
          }
        }
        GlobalVariables.currentMolecule.enable();
        GlobalVariables.currentMolecule.enableAllChildren();
        setActiveAtom(GlobalVariables.currentMolecule);
      })
      .catch((err) => {
        setErrorNotification(
          `Failed to set up molecules: ${err.message}`,
          "error",
        );
      });
  }, [
    baseOwner,
    baseRepo,
    headOwner,
    headRepo,
    authorizedUserOcto,
    userScopes,
  ]);

  if (activeAtom) {
    activeAtom.onStatusChange = (status) => {
      if (status === "waiting") {
        setOutdatedMesh(true);
        setProcessing(true);
      }
    };
  }

  return (
    <>
      {/*
      <RunParams
        activeAtom={activeAtom}
        position={{ top: 30, left: screenWidth - 50 }}
        id={"atom-empty-params-panel"}
        contentCollapsed={expandedMenu !== "params"}
        setContentCollapsed={() => setExpandedMenu("params")}
        closeMenu={() => setExpandedMenu("none")}
        initialCollapsed={true}
        collapsedOffset={[-315, 0]}
        setReadMe={() => setExpandedMenu("readme")}
        setBillOfMaterials={() => setExpandedMenu("bom")}
      />
      */}
      <RenderMenu
        {...{
          activeAtom,
          gridParam,
          axesParam,
          wireParam,
          solidParam,
          setGrid,
          setAxes,
          setWire,
          setSolid,
          contentCollapsed: expandedMenu !== "render",
          setContentCollapsed: () => setExpandedMenu("render"),
          closeMenu: () => setExpandedMenu("none"),
          position: { top: 75, left: windowSize.width - 50 },
          collapsedOffset: [-315, -45],
        }}
        id={"atom-empty-render-panel"}
      />
      <BomMenu
        {...{
          activeAtom,
          id: "atom-empty-bom-panel",
          contentCollapsed: expandedMenu !== "bom",
          setContentCollapsed: () => setExpandedMenu("bom"),
          closeMenu: () => setExpandedMenu("none"),
          position: { top: 120, left: windowSize.width - 50 },
          collapsedOffset: [-315, -90],
        }}
      />
      <ReadmePanel
        readme={GlobalVariables.currentRepo?.readme || ""}
        id="atom-empty-readme-panel"
        position={{ top: 165, left: windowSize.width - 50 }}
        initialCollapsed={true}
        contentCollapsed={expandedMenu !== "readme"}
        setContentCollapsed={() => setExpandedMenu("readme")}
        closeMenu={() => setExpandedMenu("none")}
        collapsedOffset={[-315, -135]}
        activeAtom={activeAtom}
      />
      <div id="headerBarRun">
        <img
          className="thumnail-logo"
          src={
            import.meta.env.VITE_APP_PATH_FOR_PICS + "/imgs/abundance_logo.png"
          }
          onClick={() => navigate("/")}
          alt="logo"
        />
      </div>
      <canvas
        style={{ display: "none" }}
        ref={canvasRef}
        id="flow-canvas"
        tabIndex={0}
      ></canvas>
      <ToggleRunCreate {...{ run: true, isItOwned: false }} />
      <div className="runContainer">
        <div
          className="jscad-container"
          style={{
            width: windowSize.width,
            height: windowSize.height,
          }}
        >
          <section
            id="threeDView"
            style={{
              height: windowSize.height,
            }}
          >
            <ThreeContext
              {...{ cameraZoom, gridParam, axesParam, outdatedMesh }}
            >
              {wireParam && wireMesh ? <WireframeMesh mesh={wireMesh} /> : null}
              <NonReplicadMesh />
              <ReplicadMesh
                {...{
                  mesh,
                  isSolid: solidParam,
                  setOutdatedMesh,
                  setProcessing,
                }}
              />
            </ThreeContext>
          </section>
        </div>
      </div>
    </>
  );
}

export default EmptyMode;
