import {
  getThumbnailUrl,
  markImageFailed,
  resolveThumbnailSrc,
} from "../src/components/main-routes/thumbnailUrls.js";

const DEFAULT = "/imgs/defaultThumbnail.svg";
const CACHE_BUSTER = 1786123601148;

// A private project with an uploaded thumbnail. raw.githubusercontent.com will
// not serve a private repo, so this png always 404s.
const privateProjectWithThumbnail = {
  owner: "BarbourSmith",
  repoName: "Arm_Assembly_5",
  pngURL:
    "https://raw.githubusercontent.com/BarbourSmith/Arm_Assembly_5/main/project.png",
  svgURL:
    "https://raw.githubusercontent.com/BarbourSmith/Arm_Assembly_5/main/project.svg",
};

describe("thumbnail URL resolution", () => {
  it("prefers the png over the svg", () => {
    expect(getThumbnailUrl(privateProjectWithThumbnail)).toEqual(
      privateProjectWithThumbnail.pngURL,
    );
  });

  it("falls back to the svg when there is no png", () => {
    const node = { owner: "a", repoName: "b", svgURL: "https://x/project.svg" };
    expect(getThumbnailUrl(node)).toEqual("https://x/project.svg");
  });

  it("uses the default thumbnail when a project has no image at all", () => {
    const node = { owner: "a", repoName: "b" };
    expect(resolveThumbnailSrc(node, new Set(), CACHE_BUSTER, DEFAULT)).toEqual(
      DEFAULT,
    );
  });

  it("appends the cache buster with the right separator", () => {
    const node = { owner: "a", repoName: "b", svgURL: "https://x/p.svg" };
    expect(resolveThumbnailSrc(node, new Set(), 7, DEFAULT)).toEqual(
      "https://x/p.svg?cb=7",
    );

    const withQuery = {
      owner: "a",
      repoName: "b",
      svgURL: "https://x/p.svg?sanitize=true",
    };
    expect(resolveThumbnailSrc(withQuery, new Set(), 7, DEFAULT)).toEqual(
      "https://x/p.svg?sanitize=true&cb=7",
    );
  });

  // The reported bug: the failure was recorded against svgURL while the
  // resolver checked pngURL, so the dead png was served again on every render.
  it("stops serving a thumbnail after the URL it served fails", () => {
    const node = privateProjectWithThumbnail;

    const firstSrc = resolveThumbnailSrc(
      node,
      new Set(),
      CACHE_BUSTER,
      DEFAULT,
    );
    expect(firstSrc).toContain(node.pngURL);

    // The <img> reports the failure with the URL it was given
    const failed = markImageFailed(new Set(), getThumbnailUrl(node));

    expect(resolveThumbnailSrc(node, failed, CACHE_BUSTER, DEFAULT)).toEqual(
      DEFAULT,
    );
  });

  it("returns the same Set when a URL fails again, so no re-render is queued", () => {
    const url = privateProjectWithThumbnail.pngURL;
    const failed = markImageFailed(new Set(), url);

    expect(markImageFailed(failed, url)).toBe(failed);
  });

  it("returns the same Set when there is no URL to record", () => {
    const failed = new Set();
    expect(markImageFailed(failed, undefined)).toBe(failed);
  });
});
