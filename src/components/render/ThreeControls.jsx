import React from "react";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";

const Controls = React.memo(
  React.forwardRef(function Controls(
    { axesParam, enableDamping },
    controlsRef
  ) {
    return (
      <>
        <OrbitControls
          ref={controlsRef}
          panSpeed={1.5}
          zoomSpeed={0.5}
          enableDamping={enableDamping}
        />

        {/* Mark the origin with a small sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="gray" />
        </mesh>

        {axesParam && (
          <>
            <GizmoHelper alignment="bottom-right" margin={[80, 100]}>
              <GizmoViewport
                axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
                labelColor="white"
              />
            </GizmoHelper>

            <primitive object={new THREE.AxesHelper(300)} />
          </>
        )}
      </>
    );
  })
);

export default Controls;
