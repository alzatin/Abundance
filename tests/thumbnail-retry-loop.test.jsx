import React from "react";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// ProjectDiv is the only thing under test here; keep every other context real
vi.mock("../src/contexts/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useProject: () => ({ renameProject: async () => null }),
  };
});

const { ProjectDiv } =
  await import("../src/components/main-routes/LoginMode.jsx");

// A URL the dev server will answer with a 404, standing in for a private
// project's thumbnail on raw.githubusercontent.com
const MISSING_THUMBNAIL = "/definitely-not-a-real-thumbnail.png";

const nodes = [
  {
    owner: "BarbourSmith",
    repoName: "Arm_Assembly_5",
    pngURL: MISSING_THUMBNAIL,
    svgURL: "/definitely-not-a-real-thumbnail.svg",
    ranking: 0,
    dateModified: "2026-01-01",
  },
];

function countRequestsFor(url) {
  return performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.includes(url)).length;
}

function Harness() {
  const [failedImages, setFailedImages] = React.useState(new Set());
  return (
    <MemoryRouter>
      <ProjectDiv
        nodes={nodes}
        browseType="thumb"
        orderType="byName"
        authorizedUserOcto={null}
        svgCacheBuster={12345}
        failedImages={failedImages}
        setFailedImages={setFailedImages}
        projectToShow="all"
      />
    </MemoryRouter>
  );
}

describe("project thumbnail that 404s", () => {
  afterEach(cleanup);

  it("is not requested over and over", async () => {
    performance.clearResourceTimings();

    render(<Harness />);

    // Give the browser time to run several rounds of the loop if there is one
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const requests = countRequestsFor(MISSING_THUMBNAIL);

    // A remount race can cost a second request before the failure is recorded,
    // but anything beyond that means the dead URL is being served again.
    expect(requests).toBeLessThanOrEqual(2);
  });
});
