import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

/**
 * Context provider for authentication and GitHub integration.
 * Centralizes user authentication state and GitHub Octokit instance.
 */
export function AuthProvider({ children }) {
  const [isloggedIn, setIsLoggedIn] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedUserOcto, setAuthorizedUserOcto] = useState(null);

  const value = {
    isloggedIn,
    setIsLoggedIn,
    isAuthorized,
    setIsAuthorized,
    authorizedUserOcto,
    setAuthorizedUserOcto,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}