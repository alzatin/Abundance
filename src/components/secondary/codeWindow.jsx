import React from "react";
import { useEffect, useState, useMemo } from "react";
import ReactCodeEditor from "@uiw/react-codemirror";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import {
  loadLanguage,
  langNames,
  langs,
} from "@uiw/codemirror-extensions-langs";
import { javascript, esLint } from "@codemirror/lang-javascript";
import { linter, lintGutter } from "@codemirror/lint";
//import { andromeda, andromedaInit } from "@uiw/codemirror-theme-andromeda";

import apiJson from "./methodsreplicad.json"; // static import of the JSON file
import abundanceJson from "./abundanceApiJson.json";
import ReactCodeEditorWithApiAutocomplete from "./ReactCodeEditorWithApiAutocomplete";
import InfoPanel from "./InfoPanel";

/**
 * Common JavaScript methods for reference panel
 */
const COMMON_JS_METHODS = [
  {
    name: "console.log",
    usage: "console.log(...values)",
    params: ["...values"],
    returns: "void",
    detail: "Outputs messages to the console",
  },
  {
    name: "Math.max",
    usage: "Math.max(...values)",
    params: ["...values"],
    returns: "number",
    detail: "Returns the largest of the given numbers",
  },
  {
    name: "Math.min",
    usage: "Math.min(...values)",
    params: ["...values"],
    returns: "number",
    detail: "Returns the smallest of the given numbers",
  },
  {
    name: "Math.abs",
    usage: "Math.abs(x)",
    params: ["x"],
    returns: "number",
    detail: "Returns the absolute value of a number",
  },
  {
    name: "Math.round",
    usage: "Math.round(x)",
    params: ["x"],
    returns: "number",
    detail: "Returns the value of a number rounded to the nearest integer",
  },
  {
    name: "Math.floor",
    usage: "Math.floor(x)",
    params: ["x"],
    returns: "number",
    detail: "Returns the largest integer less than or equal to a number",
  },
  {
    name: "Math.ceil",
    usage: "Math.ceil(x)",
    params: ["x"],
    returns: "number",
    detail: "Returns the smallest integer greater than or equal to a number",
  },
  {
    name: "Math.pow",
    usage: "Math.pow(base, exp)",
    params: ["base", "exp"],
    returns: "number",
    detail: "Returns base to the exponent power",
  },
  {
    name: "Math.sqrt",
    usage: "Math.sqrt(x)",
    params: ["x"],
    returns: "number",
    detail: "Returns the square root of a number",
  },
  {
    name: "Math.random",
    usage: "Math.random()",
    params: [],
    returns: "number",
    detail: "Returns a random number between 0 and 1",
  },
  {
    name: "Array.prototype.map",
    usage: "array.map((item) => newItem)",
    params: ["callback"],
    returns: "Array",
    detail:
      "Creates a new array with the results of calling a function for every element",
  },
  {
    name: "Array.prototype.filter",
    usage: "array.filter((item) => boolean)",
    params: ["callback"],
    returns: "Array",
    detail: "Creates a new array with elements that pass a test",
  },
  {
    name: "Array.prototype.reduce",
    usage: "array.reduce((acc, item) => acc, initial)",
    params: ["callback", "initialValue"],
    returns: "any",
    detail:
      "Executes a reducer function on each element, resulting in a single output value",
  },
  {
    name: "Object.keys",
    usage: "Object.keys(obj)",
    params: ["obj"],
    returns: "Array",
    detail: "Returns an array of a given object's property names",
  },
  {
    name: "Object.values",
    usage: "Object.values(obj)",
    params: ["obj"],
    returns: "Array",
    detail: "Returns an array of a given object's property values",
  },
  {
    name: "JSON.stringify",
    usage: "JSON.stringify(obj)",
    params: ["obj"],
    returns: "string",
    detail: "Converts a JavaScript value to a JSON string",
  },
  {
    name: "JSON.parse",
    usage: "JSON.parse(str)",
    params: ["str"],
    returns: "any",
    detail:
      "Parses a JSON string and returns the corresponding JavaScript value",
  },
];

/*
 * CodeWindow component is a code editor window that allows the user to edit the code of the active code atom.
 */
export default function CodeWindow(props) {
  const [docvalue, setdocValue] = useState("");
  const extensions = [keymap.of(defaultKeymap)];
  const [expandedPanel, setExpandedPanel] = useState(null); // null, 'replicad', 'abundance', or 'common'

  useEffect(() => {
    if (props.activeAtom != null) {
      setdocValue(props.activeAtom.code);
    }
  }, [props.activeAtom]);

  /**
   * Closes the code editor window.
   */
  function closeEditor() {
    const codeWindow = document.getElementById("code-window");
    codeWindow.classList.add("code-off");
  }

  const config = {
    parserOptions: {
      ecmaVersion: 6,
      ecmaFeatures: {
        jsx: true,
        globalReturn: true,
      },
    },
    rules: {
      semi: "error",
      "callback-return": "off",
    },
  };

  /**
   * Process API JSON to extract method information
   */
  /**
   * Process API JSON to extract method information (Replicad style)
   * Each entry: {
   *   type: "method",
   *   requiredParams: [],
   *   optionalParams: ["position"],
   *   returns: "Vector"
   * }
   */
  const replicadMethods = useMemo(() => {
    if (!apiJson) return [];
    return Object.keys(apiJson)
      .sort()
      .map((key) => {
        const def = apiJson[key];
        const params = (def.requiredParams || []).concat(
          def.optionalParams || []
        );
        let usage;
        if (key.includes(".")) {
          // Instance method: e.g. Shape.move(x, y)
          const [typeName, methodName] = key.split(".");
          usage = `${typeName}.${methodName}(${params.join(", ")})`;
        } else {
          // Top-level: e.g. replicad.Box(x, y, z)
          usage = `replicad.${key}(${params.join(", ")})`;
        }
        return {
          name: key,
          usage,
          params,
          returns: def.returns,
          detail: def.type || "method",
        };
      });
  }, []);

  /**
   * Process Abundance API JSON to extract method information (Abundance style)
   * Each entry: {
   *   type: "function",
   *   requiredParams: ["AbundanceObject", "x", "y", "z"],
   *   optionalParams: [],
   *   usage: "await Move(AbundanceObject, x, y, z)",
   *   returns: "AbundanceObject"
   * }
   */
  const abundanceMethods = useMemo(() => {
    if (!abundanceJson) return [];
    return Object.keys(abundanceJson)
      .sort()
      .map((key) => {
        const def = abundanceJson[key];
        const params = (def.requiredParams || []).concat(
          def.optionalParams || []
        );
        // Always prepend 'await' for abundance methods
        const usage = `await ${key}(${params.join(", ")})`;
        return {
          name: key,
          usage,
          params,
          returns: def.returns,
          detail: def.type || "function",
        };
      });
  }, []);

  const togglePanel = (panel) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  return (
    <div id="code-window" className="code-off login-page code-window-div">
      <div className="code-window-container">
        <div className="code-editor-section">
          <ReactCodeEditorWithApiAutocomplete
            value={docvalue}
            onChange={setdocValue}
            apiJson={apiJson}
            abundanceJson={abundanceJson}
            activeAtom={props.activeAtom}
          />
        </div>
        <div className="info-panels-section">
          <InfoPanel
            title="Replicad API"
            isExpanded={expandedPanel === "replicad"}
            onToggle={() => togglePanel("replicad")}
            methods={replicadMethods}
          />
          <InfoPanel
            title="Abundance Methods"
            isExpanded={expandedPanel === "abundance"}
            onToggle={() => togglePanel("abundance")}
            methods={abundanceMethods}
          />
          <InfoPanel
            title="Common JS"
            isExpanded={expandedPanel === "common"}
            onToggle={() => togglePanel("common")}
            methods={COMMON_JS_METHODS}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => props.activeAtom.updateCode(docvalue)}
        style={{ display: "none" }}
        id="save-code-button"
      >
        Save Code
      </button>
      <button
        type="button"
        style={{ display: "none" }}
        id="close-code-button"
        onClick={() => closeEditor()}
      >
        Close Editor
      </button>
    </div>
  );
}
