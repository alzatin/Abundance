import React, { useState, useEffect } from "react";
import { Octokit } from "octokit";
import {
  HashRouter as Router,
  // BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import { wrap } from "comlink";
import GlobalVariables from "./js/globalvariables.js";
import LoginMode from "./components/main-routes/LoginMode.jsx";
import RunMode from "./components/main-routes/RunMode.jsx";
import CreateMode from "./components/main-routes/CreateMode.jsx";
import UserGuidePage from "./components/main-routes/UserGuidePage.jsx";
import cadWorker from "./worker/worker.ts?worker";
import RenderURL from "./worker/meshWorker.ts?url&worker";
import * as workerpool from "workerpool";

import { QueryClient, QueryClientProvider } from "react-query";
import Callback from "./components/main-routes/CallBack.jsx";

// Import contexts
import {
  RenderingProvider,
  AuthProvider,
  AppStateProvider,
  ProjectProvider,
  useRendering,
  useAuth,
  useAppState,
} from "./contexts/index.js";

import { TutorialProvider } from "./tutorial/TutorialManager";

/*Import style scripts*/
import "./styles/maslowCreate.css";
import "./styles/menuIcons.css";
import "./styles/login.css";
import "./styles/codemirror.css";
import "./styles/readme.css";

const queryClient = new QueryClient();
/**
 * The octokit instance which allows authenticated interaction with GitHub.
 * @type {object}
 */

const pool = workerpool.pool(RenderURL  , {
    maxWorkers: 1,
    workerOpts: {
        // By default, Vite uses a module worker in dev mode, which can cause your application to fail. Therefore, we need to use a module worker in dev mode and a classic worker in prod mode.
        type: import.meta.env.PROD ? undefined : "module"
    }
});

const cad = wrap(new cadWorker());

/**
 * Inner app component that has access to all contexts
 */
function AppContent() {
  const {
    setMesh,
    setWireMesh,
    setOutdatedMesh,
    renderProgress,
    setRenderProgress,
    setRenderBarVisible,
    setTopLevelWireMesh,
    setPlane,
    setGeometryType,
  } = useRendering();

  const {
    setIsLoggedIn,
    isAuthorized,
    setIsAuthorized,
    setAuthorizedUserOcto,
    authRedirectHandler,
  } = useAuth();

  const {
    activeAtom,
    setActiveAtom,
    shortCutsOn,
    setRedirectType,
    errorNotification,
    setErrorNotification,
  } = useAppState();

  const navigate = useNavigate();

  const [size, setSize] = useState(5);

  useEffect(() => {
    cad.createMesh(size).then((m) => {
      setMesh(m);
      setWireMesh(m);
    });
  }, [size, setMesh, setWireMesh]);

  useEffect(() => {
    const element = document.querySelector("html");
    const storedClass = localStorage.getItem("displayTheme");

    if (element && storedClass) {
      element.className = storedClass;
    }
  }, []);

  useEffect(() => {
    setRenderProgress(0);
    setRenderBarVisible(true);
    let interval = setInterval(() => {
      const molecule = GlobalVariables.topLevelMolecule;
      if (molecule) {
        console.log("Molecule state:", molecule.getState().status);
        const [ready, total] = molecule.getCompletionTuple();
        // Update your UI with progress here
        //console.log(`Molecule progress: ${ready} / ${total}`);
        const progress = Math.floor((ready / total) * 100);
        setRenderProgress(progress);
        if (molecule.getState().status === "ready") {
          clearInterval(interval);
        }
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(interval);
  }, [
    GlobalVariables.topLevelMolecule,
    setRenderProgress,
    setRenderBarVisible,
  ]);

  useEffect(() => {
    if (renderProgress >= 100) {
      const timeout = setTimeout(() => {
        setRenderBarVisible(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [renderProgress, setRenderBarVisible]);

  /* Creates an element to check with Puppeteer if the molecule is fully loaded*/
  const createPuppeteerDiv = () => {
    // Check if the div already exists
    const existingDiv = document.getElementById(
      "molecule-fully-render-puppeteer"
    );
    if (!existingDiv) {
      // If it doesn't exist, create it
      const invisibleDiv = document.createElement("div");
      invisibleDiv.id = "molecule-fully-render-puppeteer";
      invisibleDiv.style.display = "none";
      document.body.appendChild(invisibleDiv);
    }
  };

  useEffect(() => {
    localStorage.setItem("shortcuts", shortCutsOn);
  }, [shortCutsOn]);

  /* Track in-flight rendering tasks, for the foreground and background*/
  const inFlightMeshRender = React.useRef(undefined);
  const targetMesh = React.useRef(undefined);
  const backgroundMesh = React.useRef(undefined);

  function makeMesh() {
    setOutdatedMesh(true);
    pool.proxy().then((worker) => {
      // No-op condition
      if (!targetMesh.current || JSON.stringify(targetMesh.current) === JSON.stringify(inFlightMeshRender.current?.value)) {
        console.log("no-op because target is already in-flight or undefined");
        return;
      }
      console.log('dispatching mesh generation for: ', targetMesh.current);
      const genTask = worker.generateDisplayMesh(
        targetMesh.current,
        GlobalVariables.topLevelMolecule.getContext()
      );
      inFlightMeshRender.current = {task: genTask, value: targetMesh.current};
      genTask
      .then((m) => {
        console.log("received mesh for : ", m.id);
        const mesh = m.mesh;
        const id = m.id;
        inFlightMeshRender.current = undefined;
        if (JSON.stringify(id) !== JSON.stringify(targetMesh.current)) {
          console.log("discarding outdated mesh for: ", id);
          return;
        }
        setMesh(mesh);
        setOutdatedMesh(false);
        /*Set plane and geometry type for ThreeContext*/
        setPlane(id?.plane);
        setGeometryType(id?.dimension);
      })
      .catch((e) => {
        console.error("Can't display Mesh " + e);
        activeAtom.setError("Can't display Mesh " + e);
      })
      .finally(() => {
        createPuppeteerDiv();
      })
    });
  }

  useEffect(() => {
    GlobalVariables.resetView = () => {
      setOutdatedMesh(true);
      targetMesh.current = undefined;
      setMesh([]);
      setWireMesh([]);
    };
    GlobalVariables.writeToDisplay = (moleculeValue, context, backgroundMolecule = false) => {
      if (!moleculeValue) {
        moleculeValue = {geometry: []}; // use a non-null structure which still generates the default mesh
      }
      if (backgroundMolecule) {
        if (backgroundMesh.current && JSON.stringify(backgroundMesh.current.id) === JSON.stringify(moleculeValue)) {
          console.log("skipping background mesh generation because the target is already set");
          setWireMesh(backgroundMesh.current.mesh)
        } else {
          // New background is required
          backgroundMesh.current = {id: moleculeValue, mesh: undefined};
          console.log('dispatching background mesh generation for: ', moleculeValue);
          pool.proxy().then((worker) => {
            worker.generateDisplayMesh(moleculeValue, context)
              .then((m) => {
                // TODO: this should have additional checks
                backgroundMesh.current.mesh = m.mesh;
                setWireMesh(m.mesh);
                setOutdatedMesh(false);
              });
          });
        }
      }

      else {
        targetMesh.current = moleculeValue;
        makeMesh();
      }
    }

    GlobalVariables.cad = cad;
    GlobalVariables.pool = pool;
  }, [
    activeAtom,
    setMesh,
    setWireMesh,
    setOutdatedMesh,
    setRenderProgress,
    setTopLevelWireMesh,
  ]);

  /**
   * Load a project from the repository
   * @param {*} project   The project to load as an AWS node
   * @param {*} authorizedUser The authorized user for the request
   * @returns
   */
  const loadProject = function (project, authorizedUser) {
    GlobalVariables.recentMoleculeRepresentation = [];
    GlobalVariables.undoOperationHistory = [];
    GlobalVariables.totalAtomCount = 0;
    GlobalVariables.numberOfAtomsToLoad = 0;
    GlobalVariables.startTime = new Date().getTime();

    if (authorizedUser) {
      var octokit = authorizedUser;
    } else {
      var octokit = new Octokit();
    }
    // Sets the current repo information from node data
    octokit
      .request("GET /repos/{owner}/{repo}", {
        owner: project.owner,
        repo: project.repoName,
      })
      .then(async (response) => {
        GlobalVariables.loadedRepo = response.data;
        GlobalVariables.currentRepo = response.data;
        GlobalVariables.currentRepoName = project.repoName;
      });

    return octokit
      .request("GET /repos/{owner}/{repo}/contents/project.abundance", {
        owner: project.owner,
        repo: project.repoName,
      })
      .then(async (response) => {
        let rawFileContent;
        // Handle large files (>1MB) using download_url
        if (!response.data.content || response.data.content.length === 0) {
          const fileResponse = await fetch(response.data.download_url);
          rawFileContent = await fileResponse.text();
        } else {
          // Handle small files using base64 content with UTF-8 encoding
          rawFileContent = GlobalVariables.fromBinaryStr(
            atob(response.data.content)
          );
        }

        let rawFile = JSON.parse(rawFileContent);

        // Reset ID counter to avoid collisions with existing IDs
        GlobalVariables.resetIdCounter(rawFile);

        if (rawFile.filetypeVersion == 1) {
          GlobalVariables.topLevelMolecule.deserialize(rawFile);
        } else {
          // For older file versions, try to deserialize directly for now
          GlobalVariables.topLevelMolecule.deserialize(rawFile);
        }
        GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
        GlobalVariables.currentMolecule.selected = true;
        setActiveAtom(GlobalVariables.currentMolecule);
      })
      .catch((e) => {
        // If error is about bad credentials, trigger re-authentication
        if (
          e?.status === 401 ||
          (typeof e?.message === "string" &&
            e.message.toLowerCase().includes("bad credentials"))
        ) {
          // alert("Session expired or bad credentials. Please re-authenticate.");
          //
          // Redirect to /callback or trigger your OAuth flow here
          console.warn("Authentication error, redirecting to re-authenticate.");
          authRedirectHandler({
            authType: "reauth",
            currentProjectRep: undefined,
            returnTo: `/`,
          });
          return;
        }
        setErrorNotification("Can't load/find project: " + (e.message || e));
        setTimeout(() => setErrorNotification(null), 5000);
        // Navigate back to projects page after error
        navigate("/");
        throw new Error("Can't load/find project " + e);
      });
  };

  return (
    <main>
      {/* Error notification */}
      {errorNotification && (
        <div className="error-notification">{errorNotification}</div>
      )}
      <Routes>
        <Route
          exact
          path=""
          element={
            <ProjectProvider cad={cad} loadProject={loadProject}>
              <LoginMode />
            </ProjectProvider>
          }
        />
        <Route
          path="/callback"
          element={
            <Callback
              isAuthorized={isAuthorized}
              setIsAuthorized={setIsAuthorized}
              setIsLoggedIn={setIsLoggedIn}
              setAuthorizedUserOcto={setAuthorizedUserOcto}
              setRedirectType={setRedirectType}
            />
          }
        />
        <Route
          path="/user-guide"
          element={<UserGuidePage />}
        />
        <Route
          path="/run/:owner/:repoName"
          element={
            <ProjectProvider cad={cad} loadProject={loadProject}>
              <RunMode />
            </ProjectProvider>
          }
        />
        <Route
          path="/:owner/:repoName"
          element={
            <ProjectProvider cad={cad} loadProject={loadProject}>
              <CreateMode />
            </ProjectProvider>
          }
        />
      </Routes>
    </main>
  );
}

export default function ReplicadApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppStateProvider>
          <TutorialProvider>
            <RenderingProvider>
              <AppContent />
            </RenderingProvider>
          </TutorialProvider>
        </AppStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
