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

const gettingStartedSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This is the main Abundance interface called Create mode.",
    overlay: "full",
    action: "click",
    svgDiagram: "abundance_Svg.svg",
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
    action: "click",
  },
  {
    id: "atom-io",
    message:
      "Most atoms have inputs and outputs. The circle atom has a diameter input and a geometry output. Hover over the atom to see its inputs and outputs. You can drag the output and connect it to other atoms.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
    messageArrow: "top",
  },
  {
    id: "extrude-menu",
    message:
      "Open the menu again, go to the Actions Submenu, and place an Extrude atom",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "connect-2-atoms",
    message:
      "Now connect the Circle's output to Extrude by clicking on the circle's output and dragging a connector to the Extrude's geometry input.",
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
    message: "You can pan around the 3D view by clicking and dragging.",
    target: "#threeCanvas",
    messagePosition: { top: -620 },
    messageArrow: "bottom",
    overlay: "highlight",
    action: "click",
  },

  {
    id: "about-output",
    message:
      "Every project has an output atom. This output is where you connect your finished design. Click next to continue.",
    target: "customHighlight1",
    overlay: "highlight",
    action: "click",
    messagePosition: { left: -300, top: 30 },
    messageArrow: "right",
  },
  {
    id: "connect-output",
    message:
      "Connect the geometry output of one of your atoms to the Output Atom. ",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "connect-output-2",
    message:
      "Now that you have something connected to your output, clicking the canvas background will render whatever is connected to it.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "click",
  },

  {
    id: "run-mode",
    message:
      "To see how others see it your project or to share it with others, go to run mode.",
    target: "#run-mode-btn",
    overlay: "highlight",
    messagePosition: { top: -100, left: -300 },
    messageArrow: "right",
    action: "click",
  },
  {
    id: "run-layout",
    message:
      "Here you can only see the output of your design. The inputs of your top level molecule will appear on the right and will be editable. If you want to learn more about inputs, check out our Inputs tutorial.",
    target: "#threeCanvas",
    messagePosition: { top: -680, left: -90 },
    offset: { top: 10, left: 10, width: -20, height: -20 },
    messageArrow: "right",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "back-to-create",
    message: "Go back to create mode any time to edit your design.",
    target: "#create-mode-btn",
    messagePosition: { top: -80, left: 330 },
    messageArrow: "left",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "Finish",
    message:
      "That's the end of the tutorial. Check out our other tutorials to learn more or get started with your design!",
    overlay: "full",
    action: "click",
  },
];

const moleculesSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This tutorial will introduce you to molecules and how to use them to organize your project.",
    overlay: "full",
    action: "click",
    svgDiagram: "abundance_Svg.svg",
  },
  {
    id: "place-molecule",
    message:
      " Open the menu by right clicking on the canvas and navigate to the Shapes submenu and click on Molecule to place your first molecule.",
    target: "#flow-canvas",
    messageArrow: "top",
    offset: { top: 10, left: 10, width: -20, height: -10 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "go-into-molecule",
    message:
      "Molecules are like folders for your atoms and other molecules. They can be nested so your project will become like a directory tree. Double click on your molecule to go inside it.",
    target: "#flow-canvas",
    messageArrow: "top",
    offset: { top: 10, left: 10, width: -20, height: -10 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "in-molecule-work",
    message:
      "Inside your molecule you can add other atoms or even other molecules. This way your screen won't get too cluttered. Click on the canvas background to continue.",
    target: "#flow-canvas",
    messageArrow: "top",
    offset: { top: 10, left: 10, width: -20, height: -10 },
    overlay: "highlight",
    action: "click",
  },
  {
    id: "rename-molecule",
    message:
      "You can rename the molecule whatever you like. Try renaming it now.",
    target: "#atom-create-params-panel",
    messageArrow: "top",
    overlay: "highlight",
    action: "valueChange",
  },
  {
    id: "go-up-level",
    message:
      "Go back up a level and out of your molecule by clicking the up arrow",
    target: "#go-up-button",
    messageArrow: "top",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "top-level",
    message:
      "This is your molecule path, it can help you locate yourself in your project. You are at the top level of your current project. Click it at any time to navigate to the top level of your project.",
    messageArrow: "top",
    overlay: "highlight",
    action: "click",
    messagePosition: { top: 0, left: 150 },
    target: "#molecule-path-link-div",
  },
  {
    id: "intro-github-molecule",
    message:
      "Your entire project is a molecule too! You can choose to export molecules inside of your project to Github as independent projects or add other user's projects as molecules in your project.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "place-github-molecule",
    message: "To place a Github Molecule ",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "find-gh-mol",
    message:
      "To place a Github Molecule, we need to find an existing molecule. Try typing - sphere -. It might take a few seconds. Once the list appear, hover over the list items and click on one.",
    overlay: "highlight",
    action: "valueChange",
    target: "#atom-create-params-panel",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "see-your-ghm",
    message:
      "To place a Github Molecule, we need to find an existing molecule. Try typing - sphere -. It might take a few seconds. Once the list appear, hover over the list items and click on one.",
    overlay: "highlight",
    action: "valueChange",
    target: "#atom-create-params-panel",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
];
const inputsEquationsValuesSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This tutorial will introduce you to Input atoms.",
    overlay: "full",
    action: "click",
    svgDiagram: "abundance_Svg.svg",
  },
  {
    id: "inputs-1",
    message:
      "As an atom has inputs and outputs, so can a molecule. Molecule inputs are defined by the creator of the molecule. Open the right click menu and in the inputs submenu, place an Input atom.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messageArrow: "top",
  },
  {
    id: "inputs-2",
    message:
      "All the inputs for your molecule will appear on the left of the screen. Click on the background to continue.",
    overlay: "highlight",
    action: "click",
    target: "customHighlight2",
    messagePosition: { top: -100, left: 500 },
    messageArrow: "left",
  },
  {
    id: "inputs-4",
    message:
      "If your molecule is active, you will see all its inputs listed here. You can change the values of these inputs here. Select an input to continue.",
    overlay: "highlight",
    action: "click",
    target: "#atom-create-params-panel",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "inputs-5",
    message:
      "When an input is selected, you can change its name and type here.",
    overlay: "highlight",
    action: "click",
    target: "#atom-create-params-panel",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "inputs-6",
    message:
      "You can drag a connectors output to the input of an atom that expects the same type of value. Try connecting the output of your input atom to the diameter input of a circle atom.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
  {
    id: "inputs-7",
    message:
      "If you change the value of your input, you will see that the circle's diameter changes too.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
];

const assemblysSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This tutorial will introduce you to assembly atoms.",
    overlay: "full",
    action: "click",
    svgDiagram: "abundance_Svg.svg",
  },
  {
    id: "assembly-1",
    message:
      "Assembly atoms allow you to create multiple copies of a geometry and arrange them in a grid or along a path. Open the right click menu and in the Actions submenu, place an Assembly atom.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
];

const tagsSteps: TutorialStep[] = [
  {
    id: "welcome",
    message: "Welcome to Abundance! This tutorial will introduce you to tags.",
    overlay: "full",
    action: "click",
    svgDiagram: "abundance_Svg.svg",
  },
  {
    id: "assembly-1",
    message:
      "Assembly atoms allow you to create multiple copies of a geometry and arrange them in a grid or along a path. Open the right click menu and in the Actions submenu, place an Assembly atom.",
    overlay: "highlight",
    action: "click",
    target: "#flow-canvas",
    messagePosition: { top: -100, left: 0 },
    messageArrow: "top",
  },
];

export const tutorials = {
  gettingStarted: gettingStartedSteps,
  moleculesAndGithubMolecules: moleculesSteps,
  inputsSteps: inputsEquationsValuesSteps,
  assemblySteps: assemblysSteps,
  tagsSteps: tagsSteps,
  // Add more as needed
};
