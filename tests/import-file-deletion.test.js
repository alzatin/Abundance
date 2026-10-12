/**
 * Import atoms, and Input atoms of type "import", upload their files to the
 * project's GitHub repository. Only the user deleting such an atom may delete
 * its file. Moving atoms into a molecule, reloading, undo, and the agent also
 * remove atoms (with deleteNode), and the file has to survive those.
 *
 * Run: npx vitest run --config=vitest.headless.config.ts tests/import-file-deletion.test.js
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/prototypes/attachmentpoint.js";
import Molecule from "../src/molecules/molecule.js";
import GlobalVariables from "../src/js/globalvariables.js";
import { AddAtomCommand } from "../src/js/undoCommands.js";

let top;
let deleteFile;
let flowCanvas;

beforeEach(() => {
  const canvas = document.createElement("canvas");
  GlobalVariables.canvas = { current: canvas };
  GlobalVariables.c = canvas.getContext("2d");
  GlobalVariables.writeToDisplay = () => {};
  GlobalVariables.undoCommandStack = [];
  GlobalVariables.currentAWSnode = { owner: "tester", repoName: "Proj" };
  // Atoms that load their file wait forever instead of calling GitHub.
  GlobalVariables.fetchFileContent = () => new Promise(() => {});
  deleteFile = vi.fn();
  GlobalVariables.deleteFile = deleteFile;

  // Placing atoms the way the user does needs the flow canvas.
  flowCanvas = document.createElement("div");
  flowCanvas.id = "flow-canvas";
  document.body.appendChild(flowCanvas);

  top = new Molecule({
    x: 0.5,
    y: 0.5,
    parent: null,
    uniqueID: GlobalVariables.generateUniqueID(),
    topLevel: true,
  });
  GlobalVariables.topLevelMolecule = top;
  GlobalVariables.currentMolecule = top;
});

afterEach(() => {
  flowCanvas.remove();
  GlobalVariables.deleteFile = null;
  GlobalVariables.fetchFileContent = null;
});

/** Place an Import atom whose file was uploaded to the open project. */
async function addImport(molecule, fileName) {
  const atom = await molecule.placeAtom(
    {
      atomType: "Import",
      uniqueID: GlobalVariables.generateUniqueID(),
      x: 0.3,
      y: 0.3,
      fileName,
      type: "STL",
      repoOwner: "tester",
      repoName: "Proj",
    },
    false,
  );
  atom.sha = `sha-${fileName}`; // Set once the file loads
  return atom;
}

function addMolecule(molecule, name) {
  return molecule.placeAtom(
    {
      atomType: "Molecule",
      uniqueID: GlobalVariables.generateUniqueID(),
      x: 0.5,
      y: 0.5,
      name,
    },
    false,
  );
}

describe("Import atoms", () => {
  it("delete their own file when the user deletes them", async () => {
    const bracket = await addImport(top, "bracket.stl");
    const plate = await addImport(top, "plate.stl");

    bracket.deleteByUser();
    plate.deleteByUser();

    expect(deleteFile.mock.calls).toEqual([
      ["bracket.stl", "sha-bracket.stl"],
      ["plate.stl", "sha-plate.stl"],
    ]);
    expect(top.nodesOnTheScreen).not.toContain(bracket);
    expect(top.nodesOnTheScreen).not.toContain(plate);
  });

  it("keep a file that another atom still loads", async () => {
    // Copy and paste makes atoms that share one file.
    const part = await addMolecule(top, "Part");
    const original = await addImport(part, "bracket.stl");
    const copy = await addImport(top, "bracket.stl");

    copy.deleteByUser();
    expect(deleteFile).not.toHaveBeenCalled();

    original.deleteByUser();
    expect(deleteFile).toHaveBeenCalledWith("bracket.stl", "sha-bracket.stl");
  });

  it("keep their file when removed any other way", async () => {
    // Undo, the agent's delete_atoms, and reloading a fork call deleteNode;
    // reloading a GitHub molecule deletes its atoms silently.
    const bracket = await addImport(top, "bracket.stl");
    const plate = await addImport(top, "plate.stl");

    bracket.deleteNode();
    plate.deleteNode(false, false, true);

    expect(top.nodesOnTheScreen).not.toContain(bracket);
    expect(top.nodesOnTheScreen).not.toContain(plate);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("keep their file when the user deletes the molecule they are in", async () => {
    const part = await addMolecule(top, "Part");
    await addImport(part, "bracket.stl");

    part.deleteByUser();

    expect(top.nodesOnTheScreen).not.toContain(part);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("keep their file when undo removes them", async () => {
    const bracket = await addImport(top, "bracket.stl");
    GlobalVariables.pushUndoCommand(new AddAtomCommand(bracket.uniqueID, top));

    await top.undo();

    expect(top.nodesOnTheScreen).not.toContain(bracket);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("keep their file when moved into a new molecule", async () => {
    const bracket = await addImport(top, "bracket.stl");
    bracket.selected = true;

    top.moveSelectedAtomsToMolecule(); // Ctrl+M

    let moved;
    await vi.waitFor(() => {
      const part = top.nodesOnTheScreen.find((a) => a.atomType === "Molecule");
      moved = part?.nodesOnTheScreen.find((a) => a.atomType === "Import");
      expect(moved).toBeDefined();
    });
    expect(moved.fileName).toBe("bracket.stl");
    expect(top.nodesOnTheScreen).not.toContain(bracket);
    expect(deleteFile).not.toHaveBeenCalled();
  });
});

describe("Input atoms that import a file", () => {
  function addFileInput(molecule) {
    return molecule.placeAtom(
      {
        atomType: "Input",
        uniqueID: GlobalVariables.generateUniqueID(),
        name: "Profile",
        type: "import",
        fileName: "profile.svg",
        fileSha: "sha-profile.svg",
        fileType: "SVG",
        repoOwner: "tester",
        repoName: "Proj",
      },
      false,
    );
  }

  it("delete their file only when the user deletes them", async () => {
    const kept = await addFileInput(top);
    kept.deleteNode();
    expect(top.nodesOnTheScreen).not.toContain(kept);
    expect(deleteFile).not.toHaveBeenCalled();

    // Never selected, so its properties panel never opened.
    const deleted = await addFileInput(top);
    deleted.deleteByUser();
    expect(top.nodesOnTheScreen).not.toContain(deleted);
    expect(deleteFile).toHaveBeenCalledWith("profile.svg", "sha-profile.svg");
  });
});
