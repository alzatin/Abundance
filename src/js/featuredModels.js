/**
 * Projects shown as 3D models on the landing page. Each needs a GLB at
 * public/featured/<owner>_<repoName>.glb, made with Developer settings >
 * Landing Page Model > Export GLB while the project is open on the local dev
 * server. Keep each file small (aim for under 1-2 MB).
 */
export const FEATURED_MODELS = [
  { owner: "alzatin", repoName: "Adirondack-chair" },
  { owner: "BarbourSmith", repoName: "Sauna_Boat_Controller" },
  { owner: "BarbourSmith", repoName: "Parametric_Geodesic_Dome" },
  { owner: "BarbourSmith", repoName: "Belt_Guard" },
  { owner: "alzatin", repoName: "Belt_Guard_-_Hollander" },
  { owner: "BarbourSmith", repoName: "Blocky_Adorondac_Chair" },
  { owner: "BarbourSmith", repoName: "Van-Build" },
  { owner: "BarbourSmith", repoName: "Swimming_ladder" },
  { owner: "BarbourSmith", repoName: "Parametric_Plant_Stand" },
  { owner: "BarbourSmith", repoName: "3D_Printed_T-Nut" },
];

/** URL of a featured project's GLB. */
export function featuredModelUrl({ owner, repoName }) {
  return `${import.meta.env.VITE_APP_PATH_FOR_PICS}/featured/${owner}_${repoName}.glb`;
}

/** URL of a featured project's thumbnail, shown while its model loads. */
export function featuredImageUrl({ owner, repoName }) {
  return `https://raw.githubusercontent.com/${owner}/${repoName}/main/project.png`;
}
