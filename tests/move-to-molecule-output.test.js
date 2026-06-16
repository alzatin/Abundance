import { describe, expect, it } from "vitest";

function areTypesCompatible(outputAP, inputAP) {
  if (!outputAP.valueType || !inputAP.valueType) {
    return true;
  }

  if (outputAP.valueType === "any" || inputAP.valueType === "any") {
    return true;
  }

  if (outputAP.valueType === inputAP.valueType) {
    return true;
  }

  return false;
}

const OUTPUT_X_OFFSET = 0.02;

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
            !areTypesCompatible(atom.output, targetInput)
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
              x: x + OUTPUT_X_OFFSET,
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

  it("finds the first available geometry input on the output atom", () => {
    const molecule = createMockMolecule();
    const outputAtom = createOutputAtom();

    expect(molecule.findFirstAvailableGeometryInput(outputAtom)).toEqual(
      outputAtom.inputs[0],
    );
  });

  it("returns null when there is no available geometry input", () => {
    const molecule = createMockMolecule();

    expect(molecule.findFirstAvailableGeometryInput({})).toBeNull();
    expect(
      molecule.findFirstAvailableGeometryInput(createOutputAtom([{ id: "used" }])),
    ).toBeNull();
  });

  it("returns null when there are no moved atoms to connect", () => {
    const molecule = createMockMolecule();
    molecule.nodesOnTheScreen.push(createOutputAtom());

    expect(
      molecule.findRightmostCompatibleOutputAtom(
        [],
        molecule.nodesOnTheScreen[0].inputs[0],
      ),
    ).toBeNull();
  });

  it("falls back to atom x coordinates when output x is unavailable", () => {
    const molecule = createMockMolecule();
    molecule.nodesOnTheScreen.push(createOutputAtom());

    const leftAtom = {
      uniqueID: "left-atom",
      x: 0.3,
      output: { valueType: "geometry" },
    };
    const rightAtom = {
      uniqueID: "right-atom",
      x: 0.8,
      output: { valueType: "geometry" },
    };

    molecule.connectRightmostAtomToOutput([leftAtom, rightAtom]);

    expect(molecule.connectorData?.ap1ID).toBe("right-atom");
  });
});
