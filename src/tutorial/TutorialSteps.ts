import { ImgHTMLAttributes } from "react";

export interface TutorialStep {
  id: string;
  message: string;
  messageArrow?: "top" | "bottom" | "left" | "right"; // describes an offset
  messagePosition?: {
    bottom?: number;
    top?: number;
    left?: number;
    right?: number;
    transform?: string;
    height?: number;
  };
  target?: string; // CSS selector to highlight, or undefined for full overlay
  overlay: "full" | "highlight";
  action:
    | "click"
    | "hover"
    | "valueChange"
    | "custom"
    | "scroll"
    | "rightClick"
    | "none";
  advanceOn?: string; // e.g., event name or custom trigger
  svgDiagram?: React.ReactNode;
  offset?: { top?: number; left?: number; width?: number; height?: number };
}

export const gettingStartedSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This is the main Abundance interface called Create mode.",
    overlay: "full",
    action: "none",
    svgDiagram: "abundance_Svg.svg",
  },
  {
    id: "top-level",
    message:
      "You are at the top level of your current project. As your add parts to your project you'll want to separate them into different molecules. Molecules are like folders for your atoms and other molecules. They can be nested so your project will become like a directory tree. This is your current molecule path. You can click at any time to navigate to the top level of your project. Click on it now to continue.",

    messageArrow: "top",
    overlay: "highlight",
    action: "click",
    target: "#molecule-path-link-div",
  },
  {
    id: "place-atom",
    message:
      "This is the canvas and where you will begin your design. Right click on the canvas to open the atom menu. Feel free to explore the submenu options and when you are ready, navigate to the Shapes submenu and click on circle.",
    target: "#flow-canvas",
    messageArrow: "top",
    offset: { top: 10, left: 10, width: -20, height: -10 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "select-atom",
    message:
      "This is your first atom! Atoms are the building blocks of your design. You can move your atom by clicking and dragging it on the canvas.",
    messageArrow: "top",
    target: "#flow-canvas",
    offset: { top: 10, left: 10, width: -20, height: -10 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "circle-params",
    message:
      "When your atom is selected, you'll see info about it in the parameter panel. Change the value of your circle's diameter.",

    messagePosition: { top: -200, left: 320 },
    messageArrow: "left",
    target: "#atom-create-params-panel",
    overlay: "highlight",
    action: "valueChange",
  },
  {
    id: "lower-render",
    message:
      "If your atom is selected, you'll see a preview of it here in the lower render view.",
    messageArrow: "bottom",
    messagePosition: { top: -620, left: 200 },
    target: "#threeCanvas",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "atom-io",
    message:
      "Most atoms have inputs and outputs. The circle atom has a diameter input and a geometry output. Hover over the atom to see its inputs and outputs. You can drag them and connect them to other atoms.",
    target: "#flow-canvas",

    messagePosition: { left: 200 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "extrude-menu",
    message:
      "Open the menu again, go to the Actions Submenu, and place an Extrude atom, then connect the Circle's output to Extrude's geometry input by clicking on the circle's output and dragging a connector to the Extrude's geometry input.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "connect-2-atoms",
    message:
      "Now connect the Circle's output to Extrude's geometry input by clicking on the circle's output and dragging a connector to the Extrude's geometry input.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "see-extrude",
    message:
      "Select your atom to see the extruded circle on the bottom of your screen",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "click-background",
    message: "Click on the canvas background to continue.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },

  {
    id: "about-output",
    message:
      "Every project has an output atom. This output is where you connect your finished design. Connect the geometry output of one of your atoms to the Output Atom. Clicking the canvas background will render whatever is connected to your output.",
    target: "customHighlight1",
    overlay: "highlight",
    action: "click",
    messagePosition: { left: -420, top: 30 },
    messageArrow: "top",
  },

  {
    id: "run-mode",
    message:
      "To see how others see it your project or to share it with others, go to run mode.",
    target: "#run-mode-btn",
    overlay: "highlight",
    messagePosition: { top: -100, left: -550 },
    messageArrow: "right",
    action: "click",
  },
  {
    id: "back-to-create",
    message: "Go back to create mode any time to edit your design.",
    target: "#create-mode-btn",
    overlay: "highlight",
    action: "click",
  },
];
