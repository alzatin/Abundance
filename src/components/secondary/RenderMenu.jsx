import { useState } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";

// Grid/Axis icon for RenderMenu
const GridAxisIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      stroke="#c4a3d5"
      strokeWidth="2"
      fill="#181c23"
    />
    <line x1="3" y1="12" x2="21" y2="12" stroke="#a18fcf" strokeWidth="1.5" />
    <line x1="12" y1="3" x2="12" y2="21" stroke="#a18fcf" strokeWidth="1.5" />
    <circle
      cx="12"
      cy="12"
      r="2.5"
      fill="#c4a3d5"
      stroke="#a18fcf"
      strokeWidth="1"
    />
  </svg>
);
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
        collapsedIcon={GridAxisIcon}
      />
    </div>
  );
}
