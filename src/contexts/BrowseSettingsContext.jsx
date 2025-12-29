import React, { createContext, useContext, useState } from "react";

const BrowseSettingsContext = createContext();

/**
 * Context provider for session-persistent browse settings.
 * Maintains user preferences for project browsing across navigation,
 * as long as the page is not refreshed or the user logs out.
 */
export function BrowseSettingsProvider({ children }) {
  // Sort order state
  const [orderType, setOrderType] = useState("byDateModified");

  // Filter state
  const [filters, setFilters] = useState({
    users: new Set(),
    tags: new Set(),
    years: new Set(),
    showForks: true,
  });

  // Browse type state (list vs thumbnail)
  const [browseType, setBrowseType] = useState("thumb");

  // Active project tab state
  const [projectTab, setProjectTab] = useState("owned");

  /**
   * Update the sort order preference
   * @param {string} newOrderType - The sort order (byName, byForks, byStars, etc.)
   */
  const updateOrderType = (newOrderType) => {
    setOrderType(newOrderType);
  };

  /**
   * Update the filter preferences
   * @param {object} newFilters - The filter settings
   */
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Update the browse type preference (list vs thumbnail)
   * @param {string} newBrowseType - Either "list" or "thumb"
   */
  const updateBrowseType = (newBrowseType) => {
    setBrowseType(newBrowseType);
  };

  /**
   * Update the active project tab
   * @param {string} newTab - The tab identifier (owned, liked, featured, all, tutorials)
   */
  const updateProjectTab = (newTab) => {
    setProjectTab(newTab);
  };

  /**
   * Reset all settings to their defaults (useful on logout)
   */
  const resetSettings = () => {
    setOrderType("byDateModified");
    setFilters({
      users: new Set(),
      tags: new Set(),
      years: new Set(),
      showForks: true,
    });
    setBrowseType("thumb");
    setProjectTab("owned");
  };

  const value = {
    // State
    orderType,
    filters,
    browseType,
    projectTab,
    // Updaters
    updateOrderType,
    updateFilters,
    updateBrowseType,
    updateProjectTab,
    resetSettings,
  };

  return (
    <BrowseSettingsContext.Provider value={value}>
      {children}
    </BrowseSettingsContext.Provider>
  );
}

/**
 * Hook to use the BrowseSettingsContext
 */
export function useBrowseSettings() {
  const context = useContext(BrowseSettingsContext);
  if (!context) {
    throw new Error(
      "useBrowseSettings must be used within a BrowseSettingsProvider"
    );
  }
  return context;
}
