import React, { useEffect, useState, useRef } from "react";
import ThreeContext from "../render/ThreeContext.jsx";
import ReplicadMesh from "../render/ReplicadMesh.jsx";
import NonReplicadMesh from "../render/NonReplicadMesh.jsx";
import WireframeMesh from "../render/WireframeMesh.jsx";
import GlobalVariables from "../../js/globalvariables.js";

import ToggleRunCreate from "../secondary/ToggleRunCreate.jsx";
import Molecule from "../../molecules/molecule.js";
import PullModeMenu from "../secondary/PullModeMenu.jsx";
import { useNavigate, useParams } from "react-router-dom";

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

/**
 * Fetches a project's serialized data from GitHub
 * Tries master branch first, falls back to main
 */
function fetchGithubProjectSerialzed(owner, repo) {
  const fetchUrl = (branch) =>
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/project.abundance`;

  return fetch(fetchUrl("master"))
    .then((res) => {
      if (!res.ok) throw new Error("Master branch not found");
      return res.json();
    })
    .catch(() =>
      fetch(fetchUrl("main")).then((res) => {
        if (!res.ok) throw new Error("Main branch not found");
        return res.json();
      }),
    )
    .then((project) => {
      return project;
    });
}

/**
 * Creates a serialized template for pull request comparison
 * Merges baseProject and headProject into a single 3-shape assembly
 * - Shape 1: Removing (red)
 * - Shape 2: Adding (green)
 * - Shape 3: Intersection (neutral gray)
 */
function createPullModeTemplate(baseProject, headProject) {
  // Generate unique IDs for scaffolding atoms
  const outputId = GlobalVariables.generateUniqueID();
  const assemblyId = GlobalVariables.generateUniqueID();
  const colorHeadId = GlobalVariables.generateUniqueID();
  const colorBaseId = GlobalVariables.generateUniqueID();
  const tagHeadId = GlobalVariables.generateUniqueID();
  const tagBaseId = GlobalVariables.generateUniqueID();
  const intersectId = GlobalVariables.generateUniqueID();
  const colorIntersectId = GlobalVariables.generateUniqueID();

  // Extract GitHub molecules from their projects
  // The fetched project IS the serialized molecule (not nested under topLevelMolecule)
  const baseGithubMolecule = { ...baseProject } || {};
  const headGithubMolecule = { ...headProject } || {};

  // Generate NEW unique IDs for the GitHub molecules to avoid conflicts
  const baseGithubId = GlobalVariables.generateUniqueID();
  const headGithubId = GlobalVariables.generateUniqueID();

  // Assign new IDs to the molecules
  baseGithubMolecule.uniqueID = baseGithubId;
  headGithubMolecule.uniqueID = headGithubId;

  // SAFETY CHECK: Make sure both GitHub molecules exist
  if (!baseGithubId || !headGithubId) {
    throw new Error(
      `Failed to extract GitHub molecules. Base ID: ${baseGithubId}, Head ID: ${headGithubId}`,
    );
  }

  // Build scaffolding atoms
  const scaffoldingAtoms = [
    {
      atomType: "Output",
      uniqueID: outputId,
      name: "Output",
      x: 0.98,
      y: 0.5,
      ioValues: [
        {
          name: "number or geometry",
          ioValue: "__GEOMETRY_INPUT__",
        },
      ],
    },
    {
      atomType: "Assembly",
      uniqueID: assemblyId,
      name: "Assembly",
      x: 0.85,
      y: 0.5,
      selectedColorIndex: 0,
      // Pre-populate inputs so connectors can reference them during deserialization
      ioValues: [
        {
          name: "Shape 1",
          ioValue: "__GEOMETRY_INPUT__",
        },
        {
          name: "Shape 2",
          ioValue: "__GEOMETRY_INPUT__",
        },
        {
          name: "Shape 3",
          ioValue: "__GEOMETRY_INPUT__",
        },
      ],
    },
    {
      atomType: "Color",
      uniqueID: colorHeadId,
      name: "Color Adding",
      x: 0.7,
      y: 0.6,
      selectedColorIndex: 7, // Grey
    },
    {
      atomType: "Color",
      uniqueID: colorBaseId,
      name: "Color Removing",
      x: 0.7,
      y: 0.4,
      selectedColorIndex: 23, // Red
    },
    {
      atomType: "Tag",
      uniqueID: tagHeadId,
      name: "Adding",
      x: 0.55,
      y: 0.6,
      tags: ["Adding"],
    },
    {
      atomType: "Tag",
      uniqueID: tagBaseId,
      name: "Removing",
      x: 0.55,
      y: 0.4,
      tags: ["Removing"],
    },
    {
      atomType: "Intersection",
      uniqueID: intersectId,
      name: "Intersection",
      x: 0.4,
      y: 0.5,
    },
    {
      atomType: "Color",
      uniqueID: colorIntersectId,
      name: "Color Intersect",
      x: 0.25,
      y: 0.5,
      selectedColorIndex: 19, // Grey
    },
  ];

  // Build connectors with explicit IDs (no dynamic finding)
  const connectors = [
    // Adding: GitHub → Color Adding
    {
      ap1ID: headGithubId,
      ap2ID: colorHeadId,
      ap2Name: "geometry",
    },
    // Adding: Color Adding → Tag Adding
    {
      ap1ID: colorHeadId,
      ap2ID: tagHeadId,
      ap2Name: "geometry",
    },
    // Adding: Tag Adding → Assembly (Shape 2)
    {
      ap1ID: tagHeadId,
      ap2ID: assemblyId,
      ap2Name: "Shape 2",
    },
    // Adding: Tag Adding → Intersect (retain - geometry1)
    {
      ap1ID: tagHeadId,
      ap2ID: intersectId,
      ap2Name: "geometry1",
    },

    // Removing: GitHub → Color Removing
    {
      ap1ID: baseGithubId,
      ap2ID: colorBaseId,
      ap2Name: "geometry",
    },
    // Removing: Color Removing → Tag Removing
    {
      ap1ID: colorBaseId,
      ap2ID: tagBaseId,
      ap2Name: "geometry",
    },
    // Removing: Tag Removing → Assembly (Shape 1)
    {
      ap1ID: tagBaseId,
      ap2ID: assemblyId,
      ap2Name: "Shape 1",
    },
    // Removing: Tag Removing → Intersect (remove - geometry2)
    {
      ap1ID: tagBaseId,
      ap2ID: intersectId,
      ap2Name: "geometry2",
    },

    // Intersect: Intersection → Color Intersect
    {
      ap1ID: intersectId,
      ap2ID: colorIntersectId,
      ap2Name: "geometry",
    },
    // Intersect: Color Intersect → Assembly (Shape 3)
    {
      ap1ID: colorIntersectId,
      ap2ID: assemblyId,
      ap2Name: "Shape 3",
    },

    // Output: Assembly → Output
    {
      ap1ID: assemblyId,
      ap2ID: outputId,
      ap2Name: "number or geometry",
    },
  ];

  // Build complete molecule structure
  const templateProject = {
    fileTypeVersion: 1,
    topLevelMolecule: {
      atomType: "Molecule",
      uniqueID: GlobalVariables.generateUniqueID(),
      name: "Pull Request Comparison",
      x: 0,
      y: 0,
      topLevel: true,
      allAtoms: [...scaffoldingAtoms, baseGithubMolecule, headGithubMolecule],
      allConnectors: connectors,
    },
  };

  return templateProject;
}

function PullMode({ setProcessing }) {
  // Get URL parameters
  const {
    baseOwner = "",
    baseRepo = "",
    headOwner = "",
    headRepo = "",
  } = useParams();

  // Get context values
  const { authorizedUserOcto, userScopes } = useAuth();
  const { activeAtom, setActiveAtom, setErrorNotification } = useAppState();
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

  // Disable output wire and top level wireframe for pull mode
  useEffect(() => {
    setWire(false);
  }, [setWire]);

  const [expandedMenu, setExpandedMenu] = useState(
    GlobalVariables.isMobile() ? "none" : "pullmode",
  );

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
    const handler = (e) => {
      setErrorNotification(e.detail.message, e.detail.type || "error");
      setTimeout(() => setErrorNotification(null, "error"), 5000);
    };
    window.addEventListener("user-notification", handler);
    return () => window.removeEventListener("user-notification", handler);
  }, []);

  useEffect(() => {
    GlobalVariables.canvas = canvasRef;
    GlobalVariables.c = canvasRef.current.getContext("2d");

    // Create blank molecule
    GlobalVariables.topLevelMolecule = new Molecule({
      x: 0,
      y: 0,
      topLevel: true,
      atomType: "Molecule",
      name: "Pull Request Comparison",
      uniqueID: GlobalVariables.generateUniqueID(),
    });
    GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
    GlobalVariables.currentMolecule.selected = true;
    GlobalVariables.currentAWSnode = null;
    GlobalVariables.currentRepo = null;

    // Fetch both GitHub projects and create template
    Promise.all([
      fetchGithubProjectSerialzed(baseOwner, baseRepo),
      fetchGithubProjectSerialzed(headOwner, headRepo),
    ])
      .then(([baseProject, headProject]) => {
        // Create template with GitHub molecules embedded
        const templateProject = createPullModeTemplate(
          baseProject,
          headProject,
        );

        // Deserialize entire template into the workspace
        const deserializeResult = GlobalVariables.topLevelMolecule.deserialize(
          templateProject.topLevelMolecule,
        );
        return Promise.resolve(deserializeResult);
      })
      .then(() => {
        // Enable all molecules
        GlobalVariables.currentMolecule.enable();
        GlobalVariables.currentMolecule.enableAllChildren();
        setActiveAtom(GlobalVariables.currentMolecule);
      })
      .catch((err) => {
        setErrorNotification(
          `Failed to set up pull mode: ${err.message}`,
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

  const createPullRequest = async () => {
    if (!authorizedUserOcto) {
      setErrorNotification(
        "You must be logged in to create a pull request.",
        "error",
      );
      return;
    }

    const baseSvgPath =
      "https://raw.githubusercontent.com/" +
      baseOwner +
      "/" +
      baseRepo +
      "/master/project.svg?sanitize=true";
    const headSvgPath =
      "https://raw.githubusercontent.com/" +
      headOwner +
      "/" +
      headRepo +
      "/master/project.svg?sanitize=true";
    try {
      const response = await authorizedUserOcto.request(
        "POST /repos/{owner}/{repo}/pulls",
        {
          owner: baseOwner,
          repo: baseRepo,
          title: `Compare ${headRepo} changes`,
          body: `This pull request compares changes from ${headOwner}/${headRepo} to ${baseOwner}/${baseRepo}.

## Comparison

| Adding | Removing |
|--------|----------|
| ![Adding](${headSvgPath}) | ![Removing](${baseSvgPath}) |
`,
          head: `${headOwner}:main`,
          base: "main",
        },
      );
      alert(`Pull request created: ${response.data.html_url}`);
    } catch (error) {
      console.error("Error creating pull request:", error);
      alert(`Error creating pull request: ${error.message}`);
    }
  };

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
      <PullModeMenu
        activeAtom={activeAtom}
        position={{ top: 30, left: 300 }}
        id={"pullmode-menu-panel"}
        contentCollapsed={expandedMenu !== "pullmode"}
        setContentCollapsed={() => setExpandedMenu("pullmode")}
        closeMenu={() => setExpandedMenu("none")}
        collapsedOffset={[-280, 0]}
        baseRepo={`${baseOwner}/${baseRepo}`}
        headRepo={`${headOwner}/${headRepo}`}
        createPullRequest={createPullRequest}
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

export default PullMode;
