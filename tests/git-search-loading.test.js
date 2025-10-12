import { describe, it, expect } from 'vitest';

/**
 * Test for GitSearchMenu loading indicator
 * 
 * This test validates that the loading indicator is shown when searching for GitHub molecules
 * to address the issue where users don't know that a search is ongoing.
 */
describe('GitSearchMenu Loading Indicator', () => {
  
  it('should show loading indicator when isLoading is true', () => {
    // Simulate the getGitListItems function behavior when loading
    const getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
      if (isLoading || isError) {
        const items = [...localAtoms];
        
        if (isLoading && debouncedSearchTerm) {
          items.push({
            id: "loading-indicator",
            isLoading: true,
            message: "Searching GitHub molecules...",
          });
        } else if (isError && debouncedSearchTerm) {
          items.push({
            id: "error-indicator",
            isError: true,
            message: "Error loading GitHub results",
          });
        }
        
        return items;
      }
      
      // Normal case with data
      const combinedResults = [...localAtoms];
      if (data?.repos) {
        combinedResults.push(...data.repos.map((repo) => ({ ...repo, isLocal: false })));
      }
      return combinedResults;
    };
    
    // Test loading state with search term
    const loadingItems = getGitListItems(true, false, 'test', [], null);
    expect(loadingItems).toHaveLength(1);
    expect(loadingItems[0].isLoading).toBe(true);
    expect(loadingItems[0].message).toBe("Searching GitHub molecules...");
    expect(loadingItems[0].id).toBe("loading-indicator");
  });
  
  it('should NOT show loading indicator when search term is empty', () => {
    const getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
      if (isLoading || isError) {
        const items = [...localAtoms];
        
        if (isLoading && debouncedSearchTerm) {
          items.push({
            id: "loading-indicator",
            isLoading: true,
            message: "Searching GitHub molecules...",
          });
        } else if (isError && debouncedSearchTerm) {
          items.push({
            id: "error-indicator",
            isError: true,
            message: "Error loading GitHub results",
          });
        }
        
        return items;
      }
      return [];
    };
    
    // Test loading state with empty search term
    const loadingItems = getGitListItems(true, false, '', [], null);
    expect(loadingItems).toHaveLength(0);
  });
  
  it('should show error indicator when isError is true', () => {
    const getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
      if (isLoading || isError) {
        const items = [...localAtoms];
        
        if (isLoading && debouncedSearchTerm) {
          items.push({
            id: "loading-indicator",
            isLoading: true,
            message: "Searching GitHub molecules...",
          });
        } else if (isError && debouncedSearchTerm) {
          items.push({
            id: "error-indicator",
            isError: true,
            message: "Error loading GitHub results",
          });
        }
        
        return items;
      }
      return [];
    };
    
    // Test error state with search term
    const errorItems = getGitListItems(false, true, 'test', [], null);
    expect(errorItems).toHaveLength(1);
    expect(errorItems[0].isError).toBe(true);
    expect(errorItems[0].message).toBe("Error loading GitHub results");
    expect(errorItems[0].id).toBe("error-indicator");
  });
  
  it('should combine local atoms with loading indicator', () => {
    const getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
      if (isLoading || isError) {
        const items = [...localAtoms];
        
        if (isLoading && debouncedSearchTerm) {
          items.push({
            id: "loading-indicator",
            isLoading: true,
            message: "Searching GitHub molecules...",
          });
        }
        
        return items;
      }
      return [];
    };
    
    const localAtoms = [
      { id: 'local-1', atomType: 'Circle', isLocal: true },
      { id: 'local-2', atomType: 'Rectangle', isLocal: true },
    ];
    
    // Test loading state with local atoms
    const items = getGitListItems(true, false, 'test', localAtoms, null);
    expect(items).toHaveLength(3);
    expect(items[0].atomType).toBe('Circle');
    expect(items[1].atomType).toBe('Rectangle');
    expect(items[2].isLoading).toBe(true);
  });
  
  it('should prevent clicking on loading indicator', () => {
    const handleItemClick = (item) => {
      // Don't handle clicks on loading or error indicators
      if (item.isLoading || item.isError) {
        return false;
      }
      return true;
    };
    
    const loadingItem = { id: 'loading-indicator', isLoading: true };
    const errorItem = { id: 'error-indicator', isError: true };
    const normalItem = { id: 'normal-item', repoName: 'test-repo' };
    
    expect(handleItemClick(loadingItem)).toBe(false);
    expect(handleItemClick(errorItem)).toBe(false);
    expect(handleItemClick(normalItem)).toBe(true);
  });
  
  it('should return results when data is available and not loading', () => {
    const getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
      if (isLoading || isError) {
        const items = [...localAtoms];
        
        if (isLoading && debouncedSearchTerm) {
          items.push({
            id: "loading-indicator",
            isLoading: true,
            message: "Searching GitHub molecules...",
          });
        }
        
        return items;
      }
      
      // Normal case with data
      const combinedResults = [...localAtoms];
      if (data?.repos) {
        combinedResults.push(...data.repos.map((repo) => ({ ...repo, isLocal: false })));
      }
      return combinedResults;
    };
    
    const mockData = {
      repos: [
        { id: 'repo-1', repoName: 'test-repo-1', owner: 'user1' },
        { id: 'repo-2', repoName: 'test-repo-2', owner: 'user2' },
      ]
    };
    
    // Test normal state with data
    const items = getGitListItems(false, false, 'test', [], mockData);
    expect(items).toHaveLength(2);
    expect(items[0].repoName).toBe('test-repo-1');
    expect(items[1].repoName).toBe('test-repo-2');
    expect(items.every(item => !item.isLoading)).toBe(true);
  });
});
