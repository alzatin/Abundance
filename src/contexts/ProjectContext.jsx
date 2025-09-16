import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

/**
 * Context provider for project-level operations and state.
 * Centralizes project loading, saving, and CAD operations.
 */
export function ProjectProvider({ children, cad, loadProject }) {
  const [size, setSize] = useState(5);

  const value = {
    size,
    setSize,
    cad,
    loadProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Hook to use the ProjectContext
 */
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}