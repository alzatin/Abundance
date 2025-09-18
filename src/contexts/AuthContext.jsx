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
   * Initiates re-authentication flow
   * @param {string} currentProjectRep - current json representation of project for save
   */
  const initiateReAuthentication = (currentProjectRep) => {
    console.log("Initiating re-authentication...");
    const params = new URLSearchParams(window.location.search);
    let scope = "public_repo";
    if (params.has("private")) {
      scope = "repo";
    }
    // Save the current project representation to local storage for recovery after re-authentication
    if (currentProjectRep) {
      localStorage.setItem("pendingProjectSave", currentProjectRep);
    }
    const client_id =
      window.origin.includes("localhost") || window.origin.includes("abundance")
        ? import.meta.env.VITE_GH_OAUTH_CLIENT_ID
        : import.meta.env.VITE_GH_OAUTH_CLIENT_ID_MOB;

    const repo = {
      owner: GlobalVariables.currentUser,
      repo: GlobalVariables.currentRepo.repoName,
    };

    // Create a CSRF token and store it locally
    const csrfToken = window.crypto
      .getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
    localStorage.setItem("latestCSRFToken", csrfToken);

    // Include current repo in the state parameter to return here
    const state = JSON.stringify({
      csrfToken: csrfToken,
      currentRepo: repo,
      returnTo: `/${GlobalVariables.currentUser}/${GlobalVariables.currentRepoName}`,
    });

    // Redirect to GitHub for re-authentication
    const link = `https://github.com/login/oauth/authorize?client_id=${client_id}&response_type=code&scope=repo&redirect_uri=${
      window.origin
    }/callback&state=${encodeURIComponent(state)}&scope=${scope}`;
    window.location.assign(link); // don't try to authenticate right now
  };

  const loginHandler = (redirectType) => {
    let forking = false;
    let liking = false;
    if (redirectType) {
      if (redirectType === "fork") {
        forking = true;
      }
      if (redirectType === "like") {
        liking = true;
      }
    }

    const params = new URLSearchParams(location.search);
    let scope = "public_repo";
    if (params.has("private")) {
      scope = "repo";
    }

    // the client id from github

    const client_id =
      window.origin.includes("localhost") || window.origin.includes("abundance")
        ? import.meta.env.VITE_GH_OAUTH_CLIENT_ID
        : import.meta.env.VITE_GH_OAUTH_CLIENT_ID_MOB;

    // create a CSRF token and store it locally
    const csrfToken = window.crypto
      .getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
    localStorage.setItem("latestCSRFToken", csrfToken);
    let repo = null;
    if (GlobalVariables.currentRepo) {
      repo =
        GlobalVariables.currentRepo.owner +
        "/" +
        GlobalVariables.currentRepo.repoName;
    }
    // include currentRepo in the state parameter
    const state = JSON.stringify({
      csrfToken: csrfToken,
      currentRepo: repo,
      forking: forking,
      liking: liking,
    });
    // redirect the user to github
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
    initiateReAuthentication,
    loginHandler,
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
