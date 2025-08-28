import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";
import { re } from "mathjs";

export default function ParamsMenu({
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
  setBackgroundUsdzFile,
  showBackgroundModel,
  setShowBackgroundModel,
}) {
  const [inputChanged, setInputChanged] = useState("");
  let renderParams = {};

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
        id="atom-render-panel"
        position={{ top: screenHeight / 2 - 10, left: 10 }}
        title={"Render Controls" || "Controls"}
        initialCollapsed={true}
        minWidth={280}
        collapsedOffset={[45, 0]}
      />
      {/* <button onClick={handleAddControl} style={{ marginTop: 16 }}>
        Add Custom Control
      </button>
      <div style={{ marginTop: 40 }}>
        <strong>Current Values:</strong>
        <pre>{JSON.stringify(values, null, 2)}</pre>
      </div>*/}
    </div>
  );
}
