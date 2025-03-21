import React, { useLayoutEffect, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { BufferGeometry } from "three";
import {
  syncFaces,
  syncLines,
  syncLinesFromFaces,
} from "replicad-threejs-helper";
import { Wireframe } from "@react-three/drei";

export default React.memo(function ShapeMeshes({
  mesh,
  isSolid,
  setOutdatedMesh,
}) {
  const { invalidate } = useThree();
  //const body = useRef(new BufferGeometry());
  //const lines = useRef(new BufferGeometry());

  const [fullMesh, setFullMesh] = useState([]);

  useLayoutEffect(() => {
    let meshArray = [];
    let keepOutMesh = [];
    mesh.map((m) => {
      const body = new BufferGeometry();
      const lines = new BufferGeometry();
      // We use the three helpers to synchronise the buffer geometry with the
      // new data from the parameters
      if (m.faces) syncFaces(body, m.faces);
      //if (faces) syncFaces(wire.current, faces);

      if (m.edges) syncLines(lines, m.edges);
      else if (m.faces) syncLinesFromFaces(lines, body);

      const thisBody = body;
      const thisLines = lines;
      const thisColor = m.color;
      // If the color is keep out make it transparent
      if (thisColor == "#D9544D") {
        meshArray.push({
          body: thisBody,
          lines: thisLines,
          color: thisColor,
          solid: false,
        });
      } else {
        meshArray.push({
          body: thisBody,
          lines: thisLines,
          color: thisColor,
          solid: isSolid,
        });
      }
    });
    setFullMesh(meshArray);
    // We have configured the canvas to only refresh when there is a change,
    // the invalidate function is here to tell it to recompute
    invalidate();
  }, [mesh, invalidate]);

  useEffect(
    () => () => {
      //body.current.dispose();
      //lines.current.dispose();
      setOutdatedMesh(false);
      invalidate();
    },
    [invalidate]
  );

  const wireframeProps = {
    // Other props
    simplify: false, // Remove some edges from wireframes
    //fill: m.color, // Color of the inside of the wireframe
    fillMix: 0, // Mix between the base color and the Wireframe 'fill'. 0 = base; 1 = wireframe
    fillOpacity: 0.5, // Opacity of the inner fill
    stroke: "#ff0000", // Color of the stroke
    strokeOpacity: 1, // Opacity of the stroke
    thickness: 0.05, // Thickness of the lines
    colorBackfaces: false, // Whether to draw lines that are facing away from the camera
    backfaceStroke: "#0000ff", // Color of the lines that are facing away from the camera
    dashInvert: true, // Invert the dashes
    dash: false, // Whether to draw lines as dashes
    dashRepeats: 4, // Number of dashes in one segment
    dashLength: 0.5, // Length of each dash
    squeeze: false, // Narrow the centers of each line segment
    squeezeMin: 0.2, // Smallest width to squeeze to
    squeezeMax: 1, // Largest width to squeeze from
  };

  return (
    <>
      {fullMesh.map((m, index) => {
        return (
          <group key={"group" + m.color + index}>
            {!isSolid ? (
              <mesh geometry={m.body} key={"mesh" + m.color}>
                {/*the offsets are here to avoid z fighting between the mesh and the lines*/}
                {m.color != "#D9544D" ? (
                  <meshMatcapMaterial
                    color={m.color}
                    key={"material" + m.color}
                    polygonOffset
                    polygonOffsetFactor={2.0}
                    polygonOffsetUnits={1.0}
                  />
                ) : (
                  <meshBasicMaterial
                    geometry={m.body}
                    transparent={true}
                    opacity={0.5}
                    color={m.color}
                  >
                    <Wireframe geometry={m.body} {...wireframeProps} />
                  </meshBasicMaterial>
                )}
              </mesh>
            ) : (
              <meshBasicMaterial
                geometry={m.body}
                transparent={true}
                opacity={0.7}
                color={m.color}
              >
                <Wireframe geometry={m.body} {...wireframeProps} />
              </meshBasicMaterial>
            )}
            <lineSegments
              key={"lines" + m.color}
              geometry={m.lines}
            ></lineSegments>
            <lineSegments key={"linesmesh" + m.color} geometry={m.lines}>
              <lineBasicMaterial
                color={"#3c5a6e"}
                opacity={"1"}
                linewidth={8}
              />
            </lineSegments>
          </group>
        );
      })}
    </>
  );
});
