import React from "react";
import { useEffect, useState } from "react";
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

/*
 * CodeWindow component is a code editor window that allows the user to edit the code of the active code atom.
 */
export default function CodeWindow(props) {
  const [docvalue, setdocValue] = useState("");
  const extensions = [keymap.of(defaultKeymap)];

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

  return (
    <div id="code-window" className=" code-off login-page code-window-div">
      <ReactCodeEditorWithApiAutocomplete
        value={docvalue}
        onChange={setdocValue}
        apiJson={apiJson}
        abundanceJson={abundanceJson}
        activeAtom={props.activeAtom}
      />
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
