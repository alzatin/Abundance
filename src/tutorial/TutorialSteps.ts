export interface TutorialStep {
  id: string;
  message: string;
  target?: string; // CSS selector to highlight, or undefined for full overlay
  overlay: "full" | "highlight";
  action: "click" | "hover" | "valueChange" | "custom" | "scroll" | "none";
  advanceOn?: string; // e.g., event name or custom trigger
}

export const gettingStartedSteps: TutorialStep[] = [
  {
    id: "welcome",
    message:
      "Welcome to Abundance! This is the main abundance interface called Create mode.",
    overlay: "full",
    action: "scroll",
  },
  {
    id: "top-level",
    message: "You are at the top level of your current project.",
    overlay: "full",
    action: "click",
  },
  {
    id: "canvas-intro",
    message: "This is the canvas and where you will begin your design.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "place-atom",
    message:
      "To place your first atom, right click anywhere on the canvas. Here you will find all the basic shapes and actions.",
    target: "#flow-canvas",
    overlay: "highlight",
    action: "custom",
    advanceOn: "openedShapeMenu",
  },
  {
    id: "choose-circle",
    message: "Go to the shapes submenu and click on circle.",
    target: "#circle-shape-menu-item",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "atom-io",
    message:
      "Most atoms have inputs and outputs. The circle atom has a diameter input and a geometry output.",
    target: ".atom-circle",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "param-panel",
    message:
      "If your atom is selected, you'll see info about it here in the parameter panel.",
    target: "#param-panel",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "change-diameter",
    message: "Change the value of your circle's diameter.",
    target: "#param-panel input[name='diameter']",
    overlay: "highlight",
    action: "valueChange",
  },
  {
    id: "render-view",
    message: "This is where you'll see your selection rendered.",
    target: "#lower-canvas",
    overlay: "highlight",
    action: "none",
  },
  {
    id: "extrude-menu",
    message:
      "Open the menu again, go to the action submenu, and click extrude. Then connect the circle's output to extrude's geometry input.",
    target: "#action-menu-extrude",
    overlay: "highlight",
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
      "Every project has an output. Clicking the canvas background will render whatever is connected to your output.",
    target: "#output-atom",
    overlay: "highlight",
    action: "click",
  },
  {
    id: "run-mode",
    message:
      "This output is the result of your project. To see how others see it, go to run mode.",
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
