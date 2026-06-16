import { describe, expect, it } from "vitest";
import AttachmentPoint from "../src/prototypes/attachmentpoint";

describe("Move to molecule output connection", () => {
  function createMockMolecule() {
    return {
      nodesOnTheScreen: [],
      connectorData: null,

      placeConnector(connectorObj) {
        this.connectorData = connectorObj;
      },

      findFirstAvailableGeometryInput(atom) {
        if (!atom.inputs) return null;

        return (
          atom.inputs.find((input) => {
            return input.valueType === "geometry" && input.connectors.length === 0;
          }) || null
        );
      },

      findOutputAtom() {
        return this.nodesOnTheScreen.find((atom) => atom.atomType === "Output") || null;
      },

      findRightmostCompatibleOutputAtom(atoms, targetInput) {
        if (!Array.isArray(atoms) || !targetInput) {
          return null;
        }

        return atoms.reduce((rightmostAtom, atom) => {
          if (
            !atom?.output ||
            !AttachmentPoint.areTypesCompatible(atom.output, targetInput)
          ) {
            return rightmostAtom;
          }

          if (!rightmostAtom) {
            return atom;
          }

          const atomX = atom.output?.x ?? atom.x;
          const rightmostX = rightmostAtom.output?.x ?? rightmostAtom.x;

          return atomX > rightmostX ? atom : rightmostAtom;
        }, null);
      },

      connectRightmostAtomToOutput(movedAtoms) {
        const outputAtom = this.findOutputAtom();
        if (!outputAtom) {
          return;
        }

        const outputInput = this.findFirstAvailableGeometryInput(outputAtom);
        if (!outputInput) {
          return;
        }

        const sourceAtom = this.findRightmostCompatibleOutputAtom(
          movedAtoms,
          outputInput,
        );
        if (!sourceAtom) {
          return;
        }

        this.placeConnector({
          ap1ID: sourceAtom.uniqueID,
          ap2ID: outputAtom.uniqueID,
          ap2Name: outputInput.name,
        });
      },
    };
  }

  function createMovedAtom(uniqueID, x, valueType = "geometry") {
    return {
      uniqueID,
      x,
      output:
        valueType === null
          ? null
          : {
              x: x + 0.02,
              valueType,
            },
    };
  }

  function createOutputAtom(connectors = []) {
    return {
      uniqueID: "output-atom",
      atomType: "Output",
      inputs: [
        {
          name: "number or geometry",
          valueType: "geometry",
          connectors,
        },
      ],
    };
  }

  it("connects the rightmost moved geometry atom to the molecule output", () => {
    const molecule = createMockMolecule();
    molecule.nodesOnTheScreen.push(createOutputAtom());

    const leftAtom = createMovedAtom("left-atom", 0.2);
    const rightAtom = createMovedAtom("right-atom", 0.7);

    molecule.connectRightmostAtomToOutput([leftAtom, rightAtom]);

    expect(molecule.connectorData).toEqual({
      ap1ID: "right-atom",
      ap2ID: "output-atom",
      ap2Name: "number or geometry",
    });
  });

  it("skips farther-right incompatible outputs and uses the rightmost compatible atom", () => {
    const molecule = createMockMolecule();
    molecule.nodesOnTheScreen.push(createOutputAtom());

    const compatibleAtom = createMovedAtom("compatible-atom", 0.6);
    const incompatibleAtom = createMovedAtom("incompatible-atom", 0.8, "number");

    molecule.connectRightmostAtomToOutput([compatibleAtom, incompatibleAtom]);

    expect(molecule.connectorData).toEqual({
      ap1ID: "compatible-atom",
      ap2ID: "output-atom",
      ap2Name: "number or geometry",
    });
  });

  it("does not replace an existing output connection", () => {
    const molecule = createMockMolecule();
    molecule.nodesOnTheScreen.push(createOutputAtom([{ uniqueID: "existing" }]));

    const movedAtom = createMovedAtom("moved-atom", 0.7);

    molecule.connectRightmostAtomToOutput([movedAtom]);

    expect(molecule.connectorData).toBeNull();
  });
});
