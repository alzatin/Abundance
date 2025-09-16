import React, { memo, useEffect, useRef, useState } from "react";
import ThreeContext from "../render/ThreeContext.jsx";
import ReplicadMesh from "../render/ReplicadMesh.jsx";
import WireframeMesh from "../render/WireframeMesh.jsx";
import globalvariables from "../../js/globalvariables.js";
import { useRendering, useAuth, useAppState } from "../../contexts/index.js";

export default memo(function LowerHalf({ windowSize }) {
  const {
    mesh,
    wireMesh,
    outdatedMesh,
    setOutdatedMesh,
    gridParam,
    axesParam,
    wireParam,
    solidParam,
    backgroundUsdzFile,
    showBackgroundModel,
  } = useRendering();
  const { authorizedUserOcto } = useAuth();
  const { activeAtom } = useAppState();

  const [cameraZoom, setCameraZoom] = useState(1);

  useEffect(() => {
    /*Reset the camera zoom to 1 when a new molecule is loaded*/
    setCameraZoom(1);
  }, [globalvariables.topLevelMolecule]);

  useEffect(() => {
    if (cameraZoom == 1 && mesh[0]) {
      setCameraZoom(mesh[0].cameraZoom);
      console.log("cameraZoom", cameraZoom);
    }
  }, [mesh]);

  return (
    <>
      <div
        className="jscad-container"
        style={{
          width: windowSize.width * 1,
          height: windowSize.height * 0.6,
        }}
      >
        <section
          id="threeDView"
          style={{
            width: windowSize.width * 1,
            height: windowSize.height * 0.6,
          }}
        >
          {wireMesh ? (
            <ThreeContext
              {...{
                cameraZoom,
              }}
            >
              {wireParam ? <WireframeMesh /> : null}
              <ReplicadMesh isSolid={solidParam} />
            </ThreeContext>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "2em",
              }}
            >
              Loading...
            </div>
          )}
        </section>
      </div>
      <div id="bottom_bar"></div>
    </>
  );
});
