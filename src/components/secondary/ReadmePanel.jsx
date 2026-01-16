import { useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel.jsx";
import GlobalVariables from "../../js/globalvariables.js";

// Book icon for ReadmePanel (slightly bigger)
const BookIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2.5"
      fill="#c4a3d5"
      stroke="#a18fcf"
      strokeWidth="1.7"
    />
    <path
      d="M8 8h8M8 11h8M8 14h6"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function ReadmePanel({
  readme = "",
  id = "readme-panel",
  position,
  initialCollapsed = false,
  contentCollapsed,
  setContentCollapsed,
  panelRef,
  closeMenu,
  minWidth = 300,
  maxHeight,
  collapsedOffset = [0, 0],
  collapsedIcon,
  title = "Project Readme",
  activeAtom,
}) {
  console.log(
    "Current top level molecule in ReadmePanel:",
    GlobalVariables.topLevelMolecule
  );

  // Add README text if this molecule has compiled README content
  if (
    activeAtom &&
    activeAtom.compiledReadme &&
    Array.isArray(activeAtom.compiledReadme) &&
    activeAtom.compiledReadme.length > 0
  ) {
    // Combine all readme text into a single display
    readme = activeAtom.compiledReadme
      .map((item) => item.readMeText)
      .join("\n\n");
  }

  // Only one control: the readme as markdown
  const controls = useMemo(
    () => ({
      projectReadme: {
        type: "markdown",
        label: "Readme",
        value: readme || "No README available.",
        order: 0,
        disabled: true,
      },
    }),
    [readme]
  );

  const screenHeight = window.innerHeight;

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 - 10, left: 30 }}
        title={title}
        minWidth={minWidth}
        initialCollapsed={initialCollapsed}
        maxHeight={maxHeight || screenHeight / 1.5}
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
        ref={panelRef}
        closeMenu={closeMenu}
        collapsedOffset={collapsedOffset}
        collapsedIcon={collapsedIcon || BookIcon}
      />
    </div>
  );
}
