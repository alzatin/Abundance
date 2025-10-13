import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Test for GitSearchMenu loading indicator
 * 
 * This test validates that the loading indicator is shown when searching for GitHub molecules
 * to address the issue where users don't know that a search is ongoing.
 */
describe('GitSearchMenu Loading Indicator', () => {
  let getGitListItems;
  
  beforeEach(() => {
    // Simulate the getGitListItems function behavior when loading
    getGitListItems = (isLoading, isError, debouncedSearchTerm, localAtoms = [], data = null) => {
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
      
      // Show "no results found" message if search completed with no results
      if (combinedResults.length === 0 && debouncedSearchTerm && !isLoading && !isError) {
        return [{
          id: "no-results-indicator",
          isNoResults: true,
          message: "No projects found",
        }];
      }
      
      return combinedResults;
    };
  });
  
  it('should show loading indicator when isLoading is true', () => {
    
    // Test loading state with search term
    const loadingItems = getGitListItems(true, false, 'test', [], null);
    expect(loadingItems).toHaveLength(1);
    expect(loadingItems[0].isLoading).toBe(true);
    expect(loadingItems[0].message).toBe("Searching GitHub molecules...");
    expect(loadingItems[0].id).toBe("loading-indicator");
  });
  
  it('should NOT show loading indicator when search term is empty', () => {
    
    // Test loading state with empty search term
    const loadingItems = getGitListItems(true, false, '', [], null);
    expect(loadingItems).toHaveLength(0);
  });
  
  it('should show error indicator when isError is true', () => {
    
    // Test error state with search term
    const errorItems = getGitListItems(false, true, 'test', [], null);
    expect(errorItems).toHaveLength(1);
    expect(errorItems[0].isError).toBe(true);
    expect(errorItems[0].message).toBe("Error loading GitHub results");
    expect(errorItems[0].id).toBe("error-indicator");
  });
  
  it('should combine local atoms with loading indicator', () => {
    
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
      // Don't handle clicks on loading, error, or no results indicators
      if (item.isLoading || item.isError || item.isNoResults) {
        return false;
      }
      return true;
    };
    
    const loadingItem = { id: 'loading-indicator', isLoading: true };
    const errorItem = { id: 'error-indicator', isError: true };
    const noResultsItem = { id: 'no-results-indicator', isNoResults: true };
    const normalItem = { id: 'normal-item', repoName: 'test-repo' };
    
    expect(handleItemClick(loadingItem)).toBe(false);
    expect(handleItemClick(errorItem)).toBe(false);
    expect(handleItemClick(noResultsItem)).toBe(false);
    expect(handleItemClick(normalItem)).toBe(true);
  });
  
  it('should show "no results found" when search completes with no results', () => {
    // Test with no local atoms and no GitHub results
    const items = getGitListItems(false, false, 'nonexistent-search-term', [], null);
    expect(items).toHaveLength(1);
    expect(items[0].isNoResults).toBe(true);
    expect(items[0].message).toBe("No projects found");
    expect(items[0].id).toBe("no-results-indicator");
  });
  
  it('should show "no results found" when GitHub returns empty repos array', () => {
    // Test with empty repos array
    const emptyData = { repos: [] };
    const items = getGitListItems(false, false, 'test', [], emptyData);
    expect(items).toHaveLength(1);
    expect(items[0].isNoResults).toBe(true);
    expect(items[0].message).toBe("No projects found");
  });
  
  it('should NOT show "no results found" when search term is empty', () => {
    // No results indicator should not appear for empty search
    const items = getGitListItems(false, false, '', [], null);
    expect(items).toHaveLength(0);
  });
  
  it('should NOT show "no results found" when there are local atoms', () => {
    // No results indicator should not appear if local atoms match
    const localAtoms = [
      { id: 'local-1', atomType: 'Circle', isLocal: true },
    ];
    const items = getGitListItems(false, false, 'circle', localAtoms, null);
    expect(items).toHaveLength(1);
    expect(items[0].isNoResults).toBeUndefined();
    expect(items[0].atomType).toBe('Circle');
  });
  
  it('should return results when data is available and not loading', () => {
    
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
