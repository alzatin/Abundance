/**
 * Utility functions for converting project names between display format and GitHub format.
 * 
 * GitHub repositories cannot contain spaces, so we replace them with underscores.
 * For display purposes, we convert underscores back to spaces.
 */

/**
 * Convert a project name from display format to GitHub format.
 * Replaces all spaces with underscores.
 * 
 * @param {string} displayName - The project name as entered by the user (may contain spaces)
 * @returns {string} The project name formatted for GitHub (spaces replaced with underscores)
 * @example
 * convertToGithubName("My Project") // returns "My_Project"
 * convertToGithubName("My_Project") // returns "My_Project"
 */
export function convertToGithubName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return displayName;
  }
  return displayName.replace(/\s+/g, '_');
}

/**
 * Convert a project name from GitHub format to display format.
 * Replaces all underscores with spaces.
 * 
 * @param {string} githubName - The project name from GitHub (may contain underscores)
 * @returns {string} The project name formatted for display (underscores replaced with spaces)
 * @example
 * convertToDisplayName("My_Project") // returns "My Project"
 * convertToDisplayName("My Project") // returns "My Project"
 */
export function convertToDisplayName(githubName) {
  if (!githubName || typeof githubName !== 'string') {
    return githubName;
  }
  return githubName.replace(/_/g, ' ');
}
