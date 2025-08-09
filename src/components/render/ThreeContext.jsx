import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Wireframe,
  Grid,
  OrthographicCamera,
} from "@react-three/drei";
import * as THREE from "three";
import Controls from "./ThreeControls.jsx";
import BackgroundModel from "./BackgroundModel.jsx";
import globalvariables from "../../js/globalvariables.js";

// We change the default orientation - threejs tends to use Y are the height,
// while replicad uses Z. This is mostly a representation default.

THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export default function ext({ children, ...props }) {
  const dpr = Math.min(window.devicePixelRatio, 2);

  let cameraZoom = props.cameraZoom;
  let backColor = props.outdatedMesh ? "#ababab" : "#f5f5f5";

  const cameraRef = useRef();
  const [gridScale, setGridScale] = useState(10 / cameraZoom);

  const [cellSection, setCellSection] = useState(100);
  const [axesScale, setAxesScale] = useState(0.3);

  // Extract background model props
  const {
    backgroundUsdzFile,
    showBackgroundModel,
    authorizedUserOcto,
    ...otherProps
  } = props;

  useEffect(() => {
    if (gridScale < 10) {
      setCellSection(1);
    } else if (gridScale < 100) {
      setCellSection(10);
    } else if (gridScale < 1000) {
      setCellSection(100);
    }
    setAxesScale(gridScale / 2);
  }, [gridScale, cameraZoom]);

  let previousZoomLevel = cameraZoom;
  window.addEventListener("wheel", (e) => {
    if (cameraRef.current) {
      // Check if the zoom level change is greater than 5 points
      if (Math.abs(cameraRef.current.zoom - previousZoomLevel) > 3) {
        previousZoomLevel = cameraRef.current.zoom; // Update the previous zoom level
        setGridScale(50 / cameraRef.current.zoom);
      }
    }
  });

  return (
    <Suspense fallback={null}>
      <Canvas
        id="threeCanvas"
        style={{
          backgroundColor: backColor,
        }}
        dpr={dpr}
        frameloop="always"
        shadows={true}
        onCreated={({ scene, camera, gl }) => {
          console.log("🎯 THREECONTEXT: Canvas created with scene:", scene);
          console.log("🎯 THREECONTEXT: Camera:", {
            type: camera.type,
            position: camera.position,
            rotation: camera.rotation,
            zoom: camera.zoom,
            near: camera.near,
            far: camera.far,
            up: camera.up
          });
          console.log("🎯 THREECONTEXT: Renderer:", gl);
          console.log("🎯 THREECONTEXT: Scene children count:", scene.children.length);
          
          // Add a periodic check to log scene contents
          const checkScene = () => {
            console.log("🎯 THREECONTEXT: Scene check - children count:", scene.children.length);
            scene.children.forEach((child, index) => {
              console.log(`🎯 THREECONTEXT: Child ${index}:`, {
                type: child.type,
                name: child.name || "unnamed",
                visible: child.visible,
                position: child.position,
                scale: child.scale,
                renderOrder: child.renderOrder,
                childrenCount: child.children?.length || 0
              });
              
              // If this child has children, show detailed info about them
              if (child.children && child.children.length > 0) {
                console.log(`🎯 THREECONTEXT: ${child.type} Child ${index} has ${child.children.length} nested children:`);
                child.children.forEach((nestedChild, nestedIndex) => {
                  console.log(`🎯 THREECONTEXT:   Nested Child ${nestedIndex}:`, {
                    type: nestedChild.type,
                    name: nestedChild.name || "unnamed",
                    visible: nestedChild.visible,
                    position: nestedChild.position,
                    scale: nestedChild.scale,
                    renderOrder: nestedChild.renderOrder,
                    hasGeometry: !!nestedChild.geometry,
                    hasMaterial: !!nestedChild.material,
                    materialType: nestedChild.material?.type,
                    materialVisible: nestedChild.material?.visible,
                    materialOpacity: nestedChild.material?.opacity,
                    materialTransparent: nestedChild.material?.transparent
                  });
                  
                  // Show even deeper nesting if it exists
                  if (nestedChild.children && nestedChild.children.length > 0) {
                    console.log(`🎯 THREECONTEXT:   Nested child has ${nestedChild.children.length} sub-children`);
                    nestedChild.children.forEach((subChild, subIndex) => {
                      console.log(`🎯 THREECONTEXT:     Sub-child ${subIndex}:`, {
                        type: subChild.type,
                        name: subChild.name || "unnamed",
                        visible: subChild.visible,
                        hasGeometry: !!subChild.geometry,
                        hasMaterial: !!subChild.material,
                        geometryType: subChild.geometry?.type,
                        vertexCount: subChild.geometry?.attributes?.position?.count || 0,
                        materialType: subChild.material?.type,
                        materialOpacity: subChild.material?.opacity
                      });
                    });
                  }
                });
              }
            });
          };
          
          // Check scene contents every 5 seconds
          const interval = setInterval(checkScene, 5000);
          
          // Cleanup interval when canvas is destroyed
          return () => clearInterval(interval);
        }}
      >
        <OrthographicCamera
          ref={cameraRef}
          makeDefault={true}
          near={0.1}
          pov={1000}
          far={90000}
          zoom={cameraZoom}
          position={[3000, 3000, 5000]}
        />
        {props.gridParam ? (
          <Grid
            position={[0, 0, 0]}
            cellSize={cellSection}
            args={[10000, 10000]}
            cellColor={"#726482"}
            fadeFrom={0}
            lineColor={"#BFA301"}
            sectionColor={"#BFA301"}
            fadeDistance={9000}
            rotation={[Math.PI / 2, 0, 0]}
            sectionSize={cellSection * 10}
          />
        ) : null}
        <Controls axesParam={props.axesParam} enableDamping={false}></Controls>

        {!props.outdatedMesh ? (
          <ambientLight intensity={0.9} />
        ) : (
          <ambientLight intensity={0.4} />
        )}
        
        {/* Background USDZ model - rendered behind CAD models */}
        {console.log("🎯 THREECONTEXT: background render check", { backgroundUsdzFile, showBackgroundModel, shouldRender: backgroundUsdzFile && showBackgroundModel })}
        {backgroundUsdzFile && showBackgroundModel ? (
          (() => {
            console.log("🎯 THREECONTEXT: About to render BackgroundModel component");
            console.log("🎯 THREECONTEXT: fileName:", backgroundUsdzFile);
            console.log("🎯 THREECONTEXT: showModel:", showBackgroundModel);
            console.log("🎯 THREECONTEXT: authorizedUserOcto:", !!authorizedUserOcto);
            return (
              <BackgroundModel 
                fileName={backgroundUsdzFile}
                showModel={showBackgroundModel}
                authorizedUserOcto={authorizedUserOcto}
              />
            );
          })()
        ) : (
          (() => {
            console.log("🎯 THREECONTEXT: NOT rendering BackgroundModel - backgroundUsdzFile:", backgroundUsdzFile, "showBackgroundModel:", showBackgroundModel);
            return null;
          })()
        )}
        
        {children}
      </Canvas>
    </Suspense>
  );
}
