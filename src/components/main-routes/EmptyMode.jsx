import React, { useEffect, useState, useRef } from "react";
import ThreeContext from "../render/ThreeContext.jsx";
import ReplicadMesh from "../render/ReplicadMesh.jsx";
import NonReplicadMesh from "../render/NonReplicadMesh.jsx";
import WireframeMesh from "../render/WireframeMesh.jsx";
import GlobalVariables from "../../js/globalvariables.js";

import ToggleRunCreate from "../secondary/ToggleRunCreate.jsx";
import Molecule from "../../molecules/molecule.js";
import RunParams from "../secondary/RunParams.jsx";
import RenderMenu from "../secondary/RenderMenu.jsx";
import BomMenu from "../secondary/BomMenu.jsx";
import ReadmePanel from "../secondary/ReadmePanel.jsx";
import { useNavigate } from "react-router-dom";

// Import contexts
import {
  useAuth,
  useAppState,
  useRendering,
  useProject,
  useFileImport,
} from "../../contexts/index.js";
import { useTutorial } from "../../tutorial/TutorialManager";
import { TutorialOverlay } from "../../tutorial/TutorialOverlay";
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
  // Get context values
  const { authorizedUserOcto, authRedirectHandler } = useAuth();
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

  const { next, isActive } = useTutorial();

  const canvasRef = useRef(500);
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

  useEffect(() => {
    GlobalVariables.canvas = canvasRef;
    GlobalVariables.c = canvasRef.current.getContext("2d");

    // Create and set up a new empty molecule
    console.log("[EmptyMode] Creating new empty molecule");
    GlobalVariables.topLevelMolecule = new Molecule({
      x: 0,
      y: 0,
      topLevel: true,
      atomType: "Molecule",
      name: "New Project",
    });

    GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
    GlobalVariables.currentMolecule.selected = true;
    GlobalVariables.currentAWSnode = null;
    GlobalVariables.currentRepo = null;

    setActiveAtom(GlobalVariables.currentMolecule);
    console.log("[EmptyMode] Empty molecule created and set as current");
  }, []);

  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;

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
          position: { top: 75, left: screenWidth - 50 },
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
          position: { top: 120, left: screenWidth - 50 },
          collapsedOffset: [-315, -90],
        }}
      />
      <ReadmePanel
        readme={GlobalVariables.currentRepo?.readme || ""}
        id="atom-empty-readme-panel"
        position={{ top: 165, left: screenWidth - 50 }}
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
