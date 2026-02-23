import React, { useState, useMemo } from "react";
import "../../styles/InfoPanel.css";

/**
 * InfoPanel component - A collapsible panel that shows method information
 * @param {string} title - Panel title
 * @param {boolean} isExpanded - Whether the panel is expanded
 * @param {function} onToggle - Callback when panel is toggled
 * @param {array} methods - Array of method objects to display
 */
export default function InfoPanel({ title, isExpanded, onToggle, methods }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter methods based on search term
  const filteredMethods = useMemo(() => {
    if (!searchTerm.trim()) {
      return methods;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return methods.filter((method) =>
      method.name.toLowerCase().includes(lowerSearch)
    );
  }, [methods, searchTerm]);

  return (
    <div className={`info-panel ${isExpanded ? "expanded" : "collapsed"}`}>
      {isExpanded ? (
        <div className="info-panel-content">
          <div className="info-panel-header">
            <h3>{title}</h3>
            <button className="collapse-btn" onClick={onToggle}>
              ▶
            </button>
          </div>
          <div className="info-panel-search">
            <input
              type="text"
              className="search-input"
              placeholder="Search methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="info-panel-body">
            {filteredMethods && filteredMethods.length > 0 ? (
              <div className="methods-list">
                {filteredMethods.map((method) => (
                  <div key={method.name} className="method-item">
                    <div className="method-name">{method.name}</div>
                    {method.usage && (
                      <div className="method-usage">
                        <strong>Usage:</strong> {method.usage}
                      </div>
                    )}
                    {method.params && method.params.length > 0 && (
                      <div className="method-params">
                        <strong>Parameters:</strong> {method.params.join(", ")}
                      </div>
                    )}
                    {method.returns && (
                      <div className="method-returns">
                        <strong>Returns:</strong> {method.returns}
                      </div>
                    )}
                    {method.detail && (
                      <div className="method-detail">{method.detail}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-methods">
                {searchTerm ? "No methods match your search" : "No methods available"}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="info-panel-tab" onClick={onToggle}>
          <span className="tab-arrow">◀</span>
          <span className="tab-label">{title}</span>
        </div>
      )}
    </div>
  );
}
