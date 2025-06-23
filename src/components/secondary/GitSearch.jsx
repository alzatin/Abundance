import React, { useState, useRef, useEffect } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { useQuery } from "react-query";
import useDebounce from "../../hooks/useDebounce.js";

function GitSearch({
  searchingGitHub,
  setSearchingGitHub,
  search,
  setSearch,
  isHovering,
  setIsHovering,
}) {
  let searchBarValue = "";
  const [lastKey, setLastKey] = useState("");
  const [yearShow, setYearShow] = useState("2024");
  const [panelItem, setPanelItem] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(-1);

  //const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 200);

  let lastKeyQuery = lastKey
    ? "&lastKey=" + lastKey.repoName + "~" + lastKey.owner
    : "&lastKey";

  let searchQuery;
  if (searchBarValue != "") {
    searchQuery = "&query=" + searchBarValue + "&yearShow=" + yearShow;
  } else {
    searchQuery = "&query" + "&yearShow=" + yearShow;
  }
  // let query = "attribute=searchField" + searchQuery + "&user" + lastKeyQuery;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", debouncedSearchTerm],
    queryFn: () => {
      if (debouncedSearchTerm) {
        return fetch(
          "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/scan-search-abundance?" +
            "attribute=searchField" +
            "&query=" +
            debouncedSearchTerm +
            "&yearShow=" +
            yearShow +
            "&user" +
            lastKeyQuery
        ).then((res) => res.json());
      }
      return undefined;
    },
  });

  // Update panel item when keyboard navigation changes selection
  useEffect(() => {
    if (data && data.repos && selectedIndex >= 0 && selectedIndex < data.repos.length) {
      const selectedItem = data.repos[selectedIndex];
      setPanelItem(selectedItem);
      setIsHovering(true);
    } else if (selectedIndex === -1) {
      setPanelItem({});
      setIsHovering(false);
    }
  }, [selectedIndex, data]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [data]);

  /**
   * Runs when a menu option is clicked to place a new atom from searching on GitHub.
   * @param {object} ev - The event triggered by clicking on a menu item.
   */
  function placeGitHubMolecule(e, item) {
    GlobalVariables.currentMolecule.loadGithubMoleculeByName(item);
    setSearchingGitHub(false);
    setSearch("");
    setIsHovering(false);
    
    // Ensure canvas regains focus after placing molecule
    const flowCanvas = document.getElementById("flow-canvas");
    if (flowCanvas) {
      flowCanvas.focus();
    }
  }

  const handleChange = function (e) {
    searchBarValue = e.target.value.toLowerCase();
    setSearch(e.target.value.toLowerCase());
    setSelectedIndex(-1); // Reset selection when search changes
  };

  const handleKeyDown = function (e) {
    if (!data || !data.repos || data.repos.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prevIndex) => 
          prevIndex < data.repos.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : data.repos.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < data.repos.length) {
          placeGitHubMolecule(e, data.repos[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchingGitHub(false);
        setSearch("");
        setIsHovering(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleMouseOver = (item, key) => {
    setPanelItem(item);
    setIsHovering(true);
    setSelectedIndex(key); // Sync mouse hover with keyboard selection
  };
  const handleMouseOut = () => {
    setPanelItem({});
    setIsHovering(false);
    // Don't reset selectedIndex here to allow keyboard navigation to continue
  };

  // Calculate smart positioning for the info panel to avoid overlap
  const calculatePanelPosition = () => {
    if (!GlobalVariables.lastClick) {
      return { left: "50%", top: "35%" };
    }

    const clickX = GlobalVariables.lastClick[0];
    const clickY = GlobalVariables.lastClick[1];
    const panelWidth = 340; // Width from CSS
    const searchInputWidth = 210; // Width from CSS
    const margin = 20; // Minimum margin between elements
    
    // Get viewport width
    const viewportWidth = window.innerWidth;
    
    // Calculate search input position (it's positioned at clickX)
    const searchInputLeft = clickX;
    const searchInputRight = searchInputLeft + searchInputWidth;
    
    // Try to position panel to the left first (original behavior)
    let panelLeft = clickX - panelWidth - margin;
    
    // Check if panel would go off the left edge or overlap with search input
    if (panelLeft < margin || (panelLeft + panelWidth + margin) > searchInputLeft) {
      // Position to the right of the search input instead
      panelLeft = searchInputRight + margin;
      
      // Check if it goes off the right edge
      if (panelLeft + panelWidth > viewportWidth - margin) {
        // If it doesn't fit on either side, position at the available space
        // Try left side with minimum margin from edge
        const leftSideSpace = searchInputLeft - margin;
        const rightSideSpace = viewportWidth - searchInputRight - margin;
        
        if (leftSideSpace >= panelWidth) {
          panelLeft = margin;
        } else if (rightSideSpace >= panelWidth) {
          panelLeft = searchInputRight + margin;
        } else {
          // Force fit in the larger available space
          if (leftSideSpace > rightSideSpace) {
            panelLeft = Math.max(margin, searchInputLeft - panelWidth - margin);
          } else {
            panelLeft = Math.min(searchInputRight + margin, viewportWidth - panelWidth - margin);
          }
        }
      }
    }
    
    return {
      left: panelLeft + "px",
      top: clickY + "px"
    };
  };

  const GitList = function () {
    if (isLoading) {
      return <li>Loading...</li>;
    }
    if (isError) {
      return <li>Error loading data</li>;
    }
    if (data !== undefined) {
      if (data.repos.length === 0) {
        return <li>No results found</li>;
      }

      return data.repos.map((item, key) => {
        const isSelected = selectedIndex === key;
        return (
          <li
            onClick={(e) => placeGitHubMolecule(e, item)}
            key={item.id}
            onMouseEnter={() => handleMouseOver(item, key)}
            onMouseLeave={() => handleMouseOut()}
            className={isSelected ? "selected" : ""}
          >
            {item.repoName}
          </li>
        );
      });
    }
  };

  return (
    <>
      {searchingGitHub ? (
        <div className="search-container">
          <div
            id="git_search"
            style={{
              top: GlobalVariables.lastClick
                ? GlobalVariables.lastClick[1] + "px"
                : "37%",
              left: GlobalVariables.lastClick
                ? GlobalVariables.lastClick[0] + "px"
                : "75%",
            }}
          >
            <input
              type="text"
              id="menuInput"
              autoFocus
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search for atom.."
              className="menu_search_canvas"
              autoComplete="off"
            ></input>

            <GitList />
          </div>
          {isHovering ? (
            <div
              className="GitProjectInfoPanel"
              style={{
                position: "absolute",
                ...calculatePanelPosition(),
              }}
            >
              <div className="GitInfoLeft">
                <img src={panelItem.svgURL}></img>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: "scale(.7)" }}
                    width="16"
                    height="16"
                  >
                    <path d="M8 .2l4.9 15.2L0 6h16L3.1 15.4z" />
                  </svg>
                  <p style={{ fontSize: "0.5em" }}>{panelItem.ranking}</p>
                </div>
              </div>

              <div className="GitInfo">
                <div>
                  <strong>Project Name: </strong>
                  <span>{panelItem.repoName}</span>
                </div>
                <div>
                  <strong>Creator: </strong>
                  <span>{panelItem.owner}</span>
                </div>
                <div>
                  <strong>Description: </strong>
                  <span>{panelItem.description || null}</span>
                </div>
                <div>
                  <strong>Topics: </strong>
                  <span>{panelItem.topics}</span>
                </div>
                <div>
                  <strong>Created: </strong>
                  <span>{panelItem.dateCreated}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default GitSearch;
