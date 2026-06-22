import { describe, expect, it } from "vitest";

function createRunModeBomParams(compiledBom = []) {
  const normalizedBomSourceLink = (sourceLink) => {
    if (typeof sourceLink !== "string") {
      return "";
    }
    const trimmedSourceLink = sourceLink.trim();
    if (trimmedSourceLink === "") {
      return "";
    }
    if (
      trimmedSourceLink.startsWith("http://") ||
      trimmedSourceLink.startsWith("https://")
    ) {
      return trimmedSourceLink;
    }
    return `https://${trimmedSourceLink}`;
  };

  const bomParams = {};

  compiledBom.forEach((item) => {
    bomParams[item.BOMitemName] = {
      type: "label",
      value: item.numberNeeded,
      label: item.BOMitemName,
    };
    const sourceLink = normalizedBomSourceLink(item.source);
    if (sourceLink) {
      bomParams[`${item.BOMitemName} Source`] = {
        type: "button",
        label: "Link",
      };
    }
  });

  return bomParams;
}

describe("Molecule createBom run mode usability", () => {
  it("shows BOM quantities as labels and includes source links", () => {
    const bomParams = createRunModeBomParams([
      {
        BOMitemName: "Bolt",
        numberNeeded: 4,
        source: "example.com/bolt",
      },
    ]);

    expect(bomParams.Bolt.type).toBe("label");
    expect(bomParams.Bolt.value).toBe(4);
    expect(bomParams.Bolt.label).toBe("Bolt");

    expect(bomParams["Bolt Source"]).toBeDefined();
    expect(bomParams["Bolt Source"].type).toBe("button");
    expect(bomParams["Bolt Source"].label).toBe("Link");
  });

  it("does not add a source-link button when a BOM source is empty", () => {
    const bomParams = createRunModeBomParams([
      {
        BOMitemName: "Washer",
        numberNeeded: 2,
        source: "   ",
      },
    ]);

    expect(bomParams.Washer.type).toBe("label");
    expect(bomParams["Washer Source"]).toBeUndefined();
  });
});
