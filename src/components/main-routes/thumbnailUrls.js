/**
 * Helpers for resolving project thumbnail images in the browse screens.
 *
 * These are pulled out of the components so the URL a failed <img> is recorded
 * under is guaranteed to be the same URL the resolver checks. When those two
 * drift apart the thumbnail is served again on every render, fails again, and
 * the browse screen spins forever re-requesting an image that cannot load.
 */

/**
 * The thumbnail URL an <img> will actually request for a project. Prefers the
 * uploaded png, falling back to the generated svg.
 * @param {object} node - The project record
 * @returns {string|undefined} The thumbnail URL, or undefined if it has none
 */
export function getThumbnailUrl(node) {
  return node.pngURL || node.svgURL;
}

/**
 * Resolve the src for a project thumbnail, falling back to the default image
 * when the project has no thumbnail or its thumbnail has already failed.
 * @param {object} node - The project record
 * @param {Set<string>} failedImages - URLs already known to fail
 * @param {string|number} cacheBuster - Value appended as a cb query param
 * @param {string} defaultSrc - Image to use when no thumbnail is available
 * @returns {string} The src to render
 */
export function resolveThumbnailSrc(
  node,
  failedImages,
  cacheBuster,
  defaultSrc,
) {
  const url = getThumbnailUrl(node);

  if (!url || failedImages.has(url)) {
    return defaultSrc;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${cacheBuster}`;
}

/**
 * Record a thumbnail URL that failed to load. Returns the existing Set
 * unchanged when the URL is already known to have failed, so a repeat failure
 * cannot push new state and trigger another render.
 * @param {Set<string>} failedImages - URLs already known to fail
 * @param {string|undefined} imageUrl - The URL that just failed
 * @returns {Set<string>} The updated set, or the original if nothing changed
 */
export function markImageFailed(failedImages, imageUrl) {
  if (!imageUrl || failedImages.has(imageUrl)) {
    return failedImages;
  }

  return new Set(failedImages).add(imageUrl);
}
