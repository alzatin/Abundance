import React, {
  useImperativeHandle,
  useLayoutEffect,
  useEffect,
  useState,
  forwardRef,
} from "react";
import { useThree } from "@react-three/fiber";
import { BufferGeometry } from "three";
import {
  Scene,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from "three";
import {
  syncFaces,
  syncLines,
  syncLinesFromFaces,
} from "replicad-threejs-helper";
import { Wireframe } from "@react-three/drei";
import { useRendering } from "../../contexts/index.js";

export default React.memo(
  forwardRef(function ShapeMeshes({ isSolid }, ref) {
    const { mesh, setOutdatedMesh } = useRendering();
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
        // If the color is keep out or glass make it transparent
        if (thisColor == "#D9544D" || thisColor == "#E6F3FF") {
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

    useImperativeHandle(ref, () => ({
      buildThumbnail: async () => {
        const svg = await meshArrayToSVG2(fullMesh);
        console.log("Generated SVG thumbnail in ReplicadMesh.", svg);
        return svg;
      },
    }));

    function meshArrayToSVG2(meshArray, width = 1000, height = 1000) {
      // 1. Setup camera (match your 3D scene)
      const camera = new PerspectiveCamera(25, width / height, 0.1, 1000);
      camera.position.set(80, 80, 50);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();

      // 2. Project all points to 2D and collect for bounding box
      let allProjectedPoints = [];
      let svgPaths = [];
      meshArray.forEach((m) => {
        if (!m.lines) return;
        const positions = m.lines.attributes.position.array;
        let path = "";
        for (let i = 0; i < positions.length; i += 6) {
          // Project first point
          const v1 = new Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          v1.project(camera);
          const x1 = (v1.x * 0.5 + 0.5) * width;
          const y1 = (1 - (v1.y * 0.5 + 0.5)) * height;
          allProjectedPoints.push([x1, y1]);

          // Project second point
          const v2 = new Vector3(
            positions[i + 3],
            positions[i + 4],
            positions[i + 5]
          );
          v2.project(camera);
          const x2 = (v2.x * 0.5 + 0.5) * width;
          const y2 = (1 - (v2.y * 0.5 + 0.5)) * height;
          allProjectedPoints.push([x2, y2]);

          path += `M${x1},${y1} L${x2},${y2} `;
        }
        svgPaths.push(
          `<path d="${path.trim()}" stroke="${m.color}" fill="none"/>`
        );
      });

      // 3. Compute bounding box and center
      if (allProjectedPoints.length === 0) {
        return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"></svg>`;
      }
      const xs = allProjectedPoints.map((p) => p[0]);
      const ys = allProjectedPoints.map((p) => p[1]);
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // 4. Shift all paths by center
      let centeredPaths = [];
      meshArray.forEach((m, idx) => {
        if (!m.lines) return;
        const positions = m.lines.attributes.position.array;
        let path = "";
        for (let i = 0; i < positions.length; i += 6) {
          // Project first point
          const v1 = new Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          v1.project(camera);
          const x1 = (v1.x * 0.5 + 0.5) * width - centerX + width / 2;
          const y1 = (1 - (v1.y * 0.5 + 0.5)) * height - centerY + height / 2;

          // Project second point
          const v2 = new Vector3(
            positions[i + 3],
            positions[i + 4],
            positions[i + 5]
          );
          v2.project(camera);
          const x2 = (v2.x * 0.5 + 0.5) * width - centerX + width / 2;
          const y2 = (1 - (v2.y * 0.5 + 0.5)) * height - centerY + height / 2;

          path += `M${x1},${y1} L${x2},${y2} `;
        }
        centeredPaths.push(
          //`<path d="${path.trim()}" stroke="${m.color}" fill="none"/>`
          `<path d="${path.trim()}" stroke="black"  stroke-width="4"  fill="red"/>`
        );
      });

      // 5. SVG viewBox centered at 0,0
      const svgWidth = maxX - minX;
      const svgHeight = maxY - minY;
      return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${centeredPaths.join("\n")}</svg>`;
    }

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
                  {m.color != "#D9544D" && m.color != "#E6F3FF" ? (
                    <meshMatcapMaterial
                      color={m.color}
                      key={"material" + m.color}
                      polygonOffset
                      polygonOffsetFactor={2.0}
                      polygonOffsetUnits={1.0}
                    />
                  ) : m.color == "#E6F3FF" ? (
                    <meshPhysicalMaterial
                      color={m.color}
                      transparent={true}
                      opacity={0.5}
                      transmission={0.6}
                      roughness={0}
                      metalness={0}
                      clearcoat={1}
                      clearcoatRoughness={0}
                      ior={1.5}
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
  })
);
