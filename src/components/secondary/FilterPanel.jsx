import React, { useState, useEffect } from "react";

/**
 * FilterPanel component for filtering projects by users, tags, years, and forks
 * Displays checkboxes on the right side of the project display
 */
const FilterPanel = ({ projects, onFilterChange }) => {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedYears, setSelectedYears] = useState(new Set());
  const [showForks, setShowForks] = useState(true);
  const [collapsed, setCollapsed] = useState({
    users: false,
    tags: false,
    years: false,
    forks: false,
  });

  // Extract unique users, tags, and years from projects
  const getUniqueValues = () => {
    const users = new Set();
    const tags = new Set();
    const years = new Set();

    if (projects && projects.length > 0) {
      projects.forEach((project) => {
        if (project.owner) {
          users.add(project.owner);
        }
        if (project.topics && Array.isArray(project.topics)) {
          project.topics.forEach((tag) => {
            // Filter out the abundance-tool tag as it's already shown separately
            if (tag) {
              tags.add(tag);
            }
          });
        }
        if (project.dateCreated) {
          const year = new Date(project.dateCreated).getFullYear();
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      });
    }

    return {
      users: Array.from(users).sort(),
      tags: Array.from(tags).sort(),
      years: Array.from(years).sort((a, b) => b - a), // Sort years descending
    };
  };

  const uniqueValues = getUniqueValues();

  // Apply filters whenever selections change
  useEffect(() => {
    onFilterChange({
      users: selectedUsers,
      tags: selectedTags,
      years: selectedYears,
      showForks: showForks,
    });
  }, [selectedUsers, selectedTags, selectedYears, showForks]);

  const handleUserToggle = (user) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(user)) {
      newSelected.delete(user);
    } else {
      newSelected.add(user);
    }
    setSelectedUsers(newSelected);
  };

  const handleTagToggle = (tag) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const handleYearToggle = (year) => {
    const newSelected = new Set(selectedYears);
    if (newSelected.has(year)) {
      newSelected.delete(year);
    } else {
      newSelected.add(year);
    }
    setSelectedYears(newSelected);
  };

  const toggleSection = (section) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearFilters = () => {
    setSelectedUsers(new Set());
    setSelectedTags(new Set());
    setSelectedYears(new Set());
    setShowForks(true);
  };

  const hasActiveFilters =
    selectedUsers.size > 0 || selectedTags.size > 0 || selectedYears.size > 0 || !showForks;

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>

      {/* Users Filter */}
      {uniqueValues.users.length > 0 && (
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection("users")}
          >
            <span className="filter-section-title">
              Users ({selectedUsers.size}/{uniqueValues.users.length})
            </span>
            <span className="filter-toggle">{collapsed.users ? "▼" : "▲"}</span>
          </div>
          {!collapsed.users && (
            <div className="filter-options">
              {uniqueValues.users.map((user) => (
                <label key={user} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user)}
                    onChange={() => handleUserToggle(user)}
                  />
                  <span className="filter-label-text">{user}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags Filter */}
      {uniqueValues.tags.length > 0 && (
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection("tags")}
          >
            <span className="filter-section-title">
              Tags ({selectedTags.size}/{uniqueValues.tags.length})
            </span>
            <span className="filter-toggle">{collapsed.tags ? "▼" : "▲"}</span>
          </div>
          {!collapsed.tags && (
            <div className="filter-options">
              {uniqueValues.tags.map((tag) => (
                <label key={tag} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTags.has(tag)}
                    onChange={() => handleTagToggle(tag)}
                  />
                  <span className="filter-label-text">{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Years Filter */}
      {uniqueValues.years.length > 0 && (
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection("years")}
          >
            <span className="filter-section-title">
              Years ({selectedYears.size}/{uniqueValues.years.length})
            </span>
            <span className="filter-toggle">{collapsed.years ? "▼" : "▲"}</span>
          </div>
          {!collapsed.years && (
            <div className="filter-options">
              {uniqueValues.years.map((year) => (
                <label key={year} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedYears.has(year)}
                    onChange={() => handleYearToggle(year)}
                  />
                  <span className="filter-label-text">{year}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forks Filter */}
      <div className="filter-section">
        <div
          className="filter-section-header"
          onClick={() => toggleSection("forks")}
        >
          <span className="filter-section-title">Forks</span>
          <span className="filter-toggle">{collapsed.forks ? "▼" : "▲"}</span>
        </div>
        {!collapsed.forks && (
          <div className="filter-options">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={showForks}
                onChange={(e) => setShowForks(e.target.checked)}
              />
              <span className="filter-label-text">Show Forks</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
