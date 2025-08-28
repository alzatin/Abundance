import { useState } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";

export default function RenderMenu({
  activeAtom,
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
  position,
  positionOffset,
  id,
}) {
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
  };

  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(renderSettings, [
    inputChanged,
    backgroundUsdzFile,
    showBackgroundModel,
  ]);

  const screenHeight = window.innerHeight;

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 - 10, left: 10 }}
        title={"Render Controls"}
        initialCollapsed={true}
        minWidth={280}
        collapsedOffset={positionOffset || [45, 0]}
      />
    </div>
  );
}
