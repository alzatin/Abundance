import { ImgHTMLAttributes } from "react";

export interface TutorialStep {
  id: string;
  message: string;
  messageArrow?: "top" | "bottom" | "left" | "right";
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
    id: "atom-io",
    message:
      "Most atoms have inputs and outputs. The circle atom has a diameter input and a geometry output. Hover over the atom to see its inputs and outputs.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },

  {
    id: "circle-params",
    message:
      "When your atom is selected, you'll see info about it in the parameter panel. Change the value of your circle's diameter.",

    messageArrow: "bottom",
    target: "#atom-create-params-panel",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "lower-render",
    message:
      "If your atom is selected, you'll see a preview of it here in the lower render view.",
    messageArrow: "bottom",
    target: "#threeCanvas",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "extrude-menu",
    message:
      "Open the menu again, go to the Actions Submenu, and click extrude. Then connect the circle's output to extrude's geometry input by clicking on the circle's output and dragging a connector to the Extrude's geometry input.",
    target: "#flow-canvas",
    overlay: "highlight",

    offset: { top: 10, left: 10, width: -20, height: -10 },
    action: "custom",
    advanceOn: "connectedExtrude",
  },
  {
    id: "see-extrude",
    message: "You should see the extruded circle on the bottom of your screen.",
    target: "#lower-canvas",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "about-output",
    message:
      "Every project has an output. This output is the result of your project. Connect the geometry output of one to your atoms to the Output Atom.Clicking the canvas background will render whatever is connected to your output.",
    target: "#output-atom",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "run-mode",
    message: "To see how others see it, go to run mode.",
    target: "#run-mode-btn",
    overlay: "highlight",
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
