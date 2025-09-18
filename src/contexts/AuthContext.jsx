import React, { createContext, useContext, useState } from "react";
import GlobalVariables from "../js/globalvariables.js";

const AuthContext = createContext();

/**
 * Context provider for authentication and GitHub integration.
 * Centralizes user authentication state and GitHub Octokit instance.
 */
export function AuthProvider({ children }) {
  const [isloggedIn, setIsLoggedIn] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedUserOcto, setAuthorizedUserOcto] = useState(null);

  /**
   * Unified handler for login and re-authentication.
   * @param {Object} options
   *   - redirectType: "fork" | "like" | "reauth" | undefined
   *   - currentProjectRep: string (optional, for re-auth)
   *   - returnTo: string (optional, for re-auth)
   */
  const authRedirectHandler = ({
    redirectType,
    currentProjectRep,
    returnTo,
  } = {}) => {
    let forking = false;
    let liking = false;
    console.log(currentProjectRep);
    if (redirectType) {
      if (redirectType === "fork") forking = true;
      if (redirectType === "like") liking = true;
    }

    // Save project if provided (for re-auth)
    if (currentProjectRep) {
      localStorage.setItem("pendingProjectSave", currentProjectRep);
    }

    const params = new URLSearchParams(window.location.search);
    let scope = "public_repo";
    if (params.has("private")) scope = "repo";

    const client_id =
      window.origin.includes("localhost") || window.origin.includes("abundance")
        ? import.meta.env.VITE_GH_OAUTH_CLIENT_ID
        : import.meta.env.VITE_GH_OAUTH_CLIENT_ID_MOB;

    // Create a CSRF token and store it locally
    const csrfToken = window.crypto
      .getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
    localStorage.setItem("latestCSRFToken", csrfToken);

    // Repo for state param: use string for login, object for reauth
    let repoState = null;
    if (GlobalVariables.currentRepo) {
      if (currentProjectRep || returnTo) {
        // Re-auth: use object
        repoState = {
          owner: GlobalVariables.currentRepo.owner,
          repo: GlobalVariables.currentRepo.repoName,
        };
      } else {
        // Login: use string
        repoState =
          GlobalVariables.currentRepo.owner +
          "/" +
          GlobalVariables.currentRepo.repoName;
      }
    }

    // Build state param
    const stateObj = {
      csrfToken: csrfToken,
      currentRepo: repoState,
    };
    if (forking) stateObj.forking = true;
    if (liking) stateObj.liking = true;
    if (returnTo) stateObj.returnTo = returnTo;

    const state = JSON.stringify(stateObj);
    const link = `https://github.com/login/oauth/authorize?client_id=${client_id}&response_type=code&scope=repo&redirect_uri=${
      window.origin
    }/callback&state=${encodeURIComponent(state)}&scope=${scope}`;
    window.location.assign(link);
  };

  const value = {
    isloggedIn,
    setIsLoggedIn,
    isAuthorized,
    setIsAuthorized,
    authorizedUserOcto,
    setAuthorizedUserOcto,
    authRedirectHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
