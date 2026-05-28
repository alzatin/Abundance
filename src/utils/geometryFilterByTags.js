/**
 * Filters an AbundanceLeaf/Branch geometry tree to show only geometry for active tags.
 *
 * Rules:
 * - If activeTags is empty or all tags are OFF, show only untagged geometry (tags array is empty)
 * - If a tag is active, show geometry tagged with that tag
 * - For AbundanceBranch: recurse into children and filter them (don't hide whole branch)
 * - For AbundanceLeaf: check if leaf's tags match active tags
 *
 * @param {AbundanceLeaf|AbundanceBranch} geometry - The geometry tree to filter
 * @param {Set<string>} activeTags - Set of currently visible tag names
 * @returns {AbundanceLeaf|AbundanceBranch|null} - Filtered geometry tree, or null if completely hidden
 */
export function filterGeometryByTags(geometry, activeTags) {
  if (!geometry) return null;

  // If no tags are active, only show untagged geometry
  const showUntaggedOnly = activeTags.size === 0;

  return filterGeometryRecursive(geometry, activeTags, showUntaggedOnly);
}

function filterGeometryRecursive(geometry, activeTags, showUntaggedOnly) {
  if (!geometry) return null;

  // Check if this is an AbundanceBranch (has geometry array) or AbundanceLeaf (has string geometry ID)
  const isBranch = Array.isArray(geometry.geometry);

  if (isBranch) {
    // AbundanceBranch: recursively filter children
    const filteredChildren = geometry.geometry
      .map((child) =>
        filterGeometryRecursive(child, activeTags, showUntaggedOnly),
      )
      .filter((child) => child !== null);

    // If no children remain after filtering, hide this branch
    if (filteredChildren.length === 0) {
      return null;
    }

    // Return branch with filtered children
    return {
      ...geometry,
      geometry: filteredChildren,
    };
  } else {
    // AbundanceLeaf: check if this leaf's tags match active tags
    const leafTags = geometry.tags || [];

    if (showUntaggedOnly) {
      // Only show untagged geometry
      if (leafTags.length === 0) {
        return geometry;
      } else {
        return null;
      }
    }

    // If tags are active, show geometry that has at least one matching tag
    if (leafTags.length === 0) {
      // Untagged geometry is always shown when tags are active
      return geometry;
    }

    // Check if any of the leaf's tags are in activeTags
    const hasMatchingTag = leafTags.some((tag) => activeTags.has(tag));
    if (hasMatchingTag) {
      return geometry;
    } else {
      return null;
    }
  }
}
