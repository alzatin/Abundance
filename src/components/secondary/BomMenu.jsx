import React from "react";
import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";
import { useAppState } from "../../contexts/index.js";

export default function BomMenu({
  id,
  contentCollapsed,
  setContentCollapsed,
  position,
  collapsedOffset,
  closeMenu,
}) {
  const { activeAtom } = useAppState();
  const [inputChanged, setInputChanged] = useState("");
  let bomParams = {};

  if (activeAtom?.atomType == "Molecule") {
    bomParams = activeAtom.createBom(setInputChanged);
  }
  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(bomParams, [activeAtom, inputChanged]);

  const screenHeight = window.innerHeight;

  // Dollar sign icon, same size and style as SettingsIcon
  const DollarIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
      />
      <path
        d="M10 5v10"
        stroke="var(--control-text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12.5 7.5c0-1-1-1.5-2.5-1.5s-2.5.5-2.5 1.5c0 1 1 1.5 2.5 1.5s2.5.5 2.5 1.5c0 1-1 1.5-2.5 1.5s-2.5-.5-2.5-1.5"
        stroke="var(--control-text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 - 10, left: 55 }}
        title={"Bill of Materials"}
        initialCollapsed={true}
        minWidth={280}
        collapsedIcon={DollarIcon}
        collapsedOffset={collapsedOffset}
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
        closeMenu={closeMenu}
        activeAtom={activeAtom}
      />
    </div>
  );
}
