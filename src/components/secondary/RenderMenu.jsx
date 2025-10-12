import { useState } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import { useRendering } from "../../contexts/index.js";

export default function RenderMenu({
  position,
  id,
  contentCollapsed,
  collapsedOffset,
  setContentCollapsed,
  closeMenu,
}) {
  const {
    gridParam,
    axesParam,
    wireParam,
    solidParam,
    setGrid,
    setAxes,
    setWire,
    setSolid,
    backgroundUsdzFile,
    showBackgroundModel,
    setShowBackgroundModel,
    showTopLevelWireframe,
    setShowTopLevelWireframe,
  } = useRendering();
  const [inputChanged, setInputChanged] = useState("");

  /** Creates Leva panel with grid settings */
  const renderSettings = {
    grid: {
      value: gridParam,
      label: "Grid",
      type: "boolean",
      onChange: (value) => {
        setGrid(value);
      },
    },
    axes: {
      value: axesParam,
      label: "Axes",
      type: "boolean",
      onChange: (value) => {
        setAxes(value);
      },
    },
    wire: {
      value: wireParam,
      label: "Output Wire",
      type: "boolean",
      onChange: (value) => {
        setWire(value);
      },
    },
    wireframe: {
      value: solidParam,
      label: "Wireframe",
      type: "boolean",
      onChange: (value) => {
        setSolid(value);
      },
    },
    backgroundModel: {
      value: backgroundUsdzFile ? showBackgroundModel : false,
      label: "Background Model",
      type: "boolean",
      disabled: !backgroundUsdzFile,
      onChange: (value) => {
        if (backgroundUsdzFile) {
          setShowBackgroundModel(value);
        }
      },
    },
    topLevelWireframe: {
      value: showTopLevelWireframe,
      label: "Top Level Wireframe",
      type: "boolean",
      onChange: (value) => {
        setShowTopLevelWireframe(value);
      },
    },
  };

  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(renderSettings, [
    inputChanged,
    backgroundUsdzFile,
    showBackgroundModel,
    showTopLevelWireframe,
  ]);

  const screenHeight = window.innerHeight;

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 + 10, left: 10 }}
        collapsedOffset={collapsedOffset || [45, 0]}
        title={"Render Controls"}
        initialCollapsed={true}
        minWidth={280}
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
        closeMenu={closeMenu}
      />
    </div>
  );
}
