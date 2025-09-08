import { useEffect, useState, useMemo } from "react";
import { SimpleControlPanel } from "./SimpleControlPanel";
import { useControls } from "../../hooks/useControls";
import GlobalVariables from "../../js/globalvariables";
import { useQuery } from "react-query";
import useDebounce from "../../hooks/useDebounce.js";
import { placeholder } from "@uiw/react-codemirror";

export default function GitSearchMenu({
  activeAtom,
  id,
  contentCollapsed,
  setContentCollapsed,
  position,
  collapsedOffset,
  controlPanelRef,
  gitRef,
}) {
  const [inputChanged, setInputChanged] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [panelItem, setPanelItem] = useState({});
  const [isHovering, setIsHovering] = useState(false);
  const [yearShow, setYearShow] = useState("2024");
  const [lastKey, setLastKey] = useState("");

  const debouncedSearchTerm = useDebounce(search, 200);

  const handleSearchBarValueChange = function (value) {
    setSearch(value.toLowerCase());
    //setSelectedIndex(-1); // Reset selection when search changes
  };

  let lastKeyQuery = lastKey
    ? "&lastKey=" + lastKey.repoName + "~" + lastKey.owner
    : "&lastKey";

  let searchQuery;
  if (search != "") {
    searchQuery = "&query=" + search + "&yearShow=" + yearShow;
  } else {
    searchQuery = "&query" + "&yearShow=" + yearShow;
  }

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

  /**
   * Runs when a menu option is clicked to place a new atom from searching on GitHub.
   * @param {object} ev - The event triggered by clicking on a menu item.
   */
  function placeGitHubMolecule(e, item) {
    GlobalVariables.currentMolecule.loadGithubMoleculeByName(item).catch(() => {
      setErrorNotification(`Error: Project Missing`);
      // Auto-dismiss notification after 3 seconds
      setTimeout(() => setErrorNotification(null), 3000);
    });
    setSearchingGitHub(false);
    setIsShortcutTriggered(false);
    setSearch("");
    setIsHovering(false);

    // Ensure canvas regains focus after placing molecule
    const flowCanvas = document.getElementById("flow-canvas");
    if (flowCanvas) {
      flowCanvas.focus();
    }
  }
  /**
   * Runs when a local atom option is clicked to place a new atom from the circular menu atoms.
   * @param {object} ev - The event triggered by clicking on a menu item.
   * @param {string} atomType - The type of atom to place.
   */
  function placeLocalAtom(e, atomType) {
    GlobalVariables.currentMolecule.placeAtom(
      {
        x: GlobalVariables.pixelsToWidth(
          GlobalVariables.lastClick
            ? GlobalVariables.lastClick[0]
            : window.innerWidth * 0.75
        ),
        y: GlobalVariables.pixelsToHeight(
          GlobalVariables.lastClick
            ? GlobalVariables.lastClick[1]
            : window.innerHeight * 0.37
        ),
        parent: GlobalVariables.currentMolecule,
        atomType: atomType,
        uniqueID: GlobalVariables.generateUniqueID(),
      },
      true
    );
    setSearchingGitHub(false);

    setSearch("");
    setIsShortcutTriggered(false);
    setIsHovering(false);

    // Ensure canvas regains focus after placing atom
    const flowCanvas = document.getElementById("flow-canvas");
    if (flowCanvas) {
      flowCanvas.focus();
    }
  }
  const handleMouseOver = (item, key) => {
    setPanelItem(item);
    setIsHovering(true);
    //setSelectedIndex(key); // Sync mouse hover with keyboard selection
  };
  const handleMouseOut = () => {
    setPanelItem({});
    setIsHovering(false);
    // Don't reset selectedIndex here to allow keyboard navigation to continue
  };

  let getGitListItems = () => {
    const localAtoms = getFilteredLocalAtoms(debouncedSearchTerm);

    if (isLoading || isError) {
      // Show local atoms even while loading GitHub results
      if (localAtoms.length > 0) {
        console.log("Local Atoms while loading:", localAtoms);
        return {
          type: "list",
          value: [...localAtoms],
          label: "Local Results",
          order: 1,
          itemRenderer: (item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <li
                key={item.id}
                className={`local-atom ${
                  isSelected ? "selected" : ""
                } disabled`}
                title={`Local Atom - ${item.atomCategory}`}
              >
                {item.atomType}{" "}
                <span className="atom-category">({item.atomCategory})</span>
              </li>
            );
          },
        };
      }
      /*
      items.push(
        <li key="loading" className="loading-item">
          Loading GitHub results...
        </li>
      );*/
      //return { type: "list", value: [], label: "Loading...", order: 1 };
    }
    // Combine local atoms with GitHub results
    const combinedResults = [...localAtoms];
    if (data?.repos) {
      combinedResults.push(
        ...data.repos.map((repo) => ({ ...repo, isLocal: false }))
      );
    }
    console.log("Combined Results:", combinedResults);
    if (combinedResults.length === 0) {
      return {};
    }

    return {
      type: "list",
      value: [...combinedResults],

      order: 2,
      itemRenderer: (item, idx) => {
        const isSelected = false; //selectedIndex === idx;
        if (item.isLocal) {
          return (
            <li
              onClick={(e) => !isLoading && handleItemClick(e, item)}
              key={item.id}
              onMouseEnter={() => handleMouseOver(item, key)}
              onMouseLeave={() => handleMouseOut()}
              className={`local-atom ${isSelected ? "selected" : ""}`}
              title={`Local Atom - ${item.atomCategory}`}
            >
              {item.atomType}{" "}
              <span className="atom-category">({item.atomCategory})</span>
            </li>
          );
        } else {
          return (
            <li
              onClick={(e) => !isLoading && handleItemClick(e, item)}
              key={item.id}
              onMouseEnter={() => handleMouseOver(item, key)}
              onMouseLeave={() => handleMouseOut()}
              className={`github-repo ${isSelected ? "selected" : ""}`}
              title="GitHub Repository"
            >
              {item.repoName}
            </li>
          );
        }
      },
    };
  };
  const gitList = useMemo(() => {
    console.log("Getting Git List Items with data:", data);
    return getGitListItems();
  }, [data, debouncedSearchTerm]);

  const handleItemClick = (e, item) => {
    e.stopPropagation(); // Prevent event propagation
    if (item.isLocal) {
      placeLocalAtom(e, item.atomType);
    } else {
      placeGitHubMolecule(e, item);
    }
  };

  /**
   * Filters local atoms based on search term
   * @param {string} searchTerm - The search term to filter by
   * @returns {Array} Array of matching local atoms
   */
  function getFilteredLocalAtoms(searchTerm) {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const filteredAtoms = [];
    for (const key in GlobalVariables.availableTypes) {
      const atom = GlobalVariables.availableTypes[key];
      if (
        atom.atomType?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        atom.atomType?.toLowerCase() !== "box"
      ) {
        filteredAtoms.push({
          id: `local-${key}`,
          atomType: atom.atomType,
          atomCategory: atom.atomCategory || "General",
          isLocal: true,
        });
      }
    }
    return filteredAtoms;
  }

  let gitParams = {
    gitsearch: {
      type: "string",
      value: "",
      placeholder: "Search for GitHub Molecules",
      order: 1,
      onChange: (value) => {
        handleSearchBarValueChange(value);
      },
    },
    exampleList: gitList,
  };
  const [
    values,
    setControlValue,
    { controls, registerControl, removeControl },
  ] = useControls(gitParams, [inputChanged, gitList]);

  const screenHeight = window.innerHeight;

  // GitHub logo icon, scaled for 20x20 viewBox
  const GitHubIcon = ({ size = 14 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="scale(0.0083, -0.0083) translate(0, -2400)">
        <path
          d="M970 2301 c-305 -68 -555 -237 -727 -493 -301 -451 -241 -1056 143-1442 115 -116 290 -228 422 -271 49 -16 55 -16 77 -1 24 16 25 20 25 135 l0 118 -88 -5 c-103 -5 -183 13 -231 54 -17 14 -50 62 -73 106 -38 74 -66 108-144 177 -26 23 -27 24 -9 37 43 32 130 1 185 -65 96 -117 133 -148 188 -160 49 -10 94 -6 162 14 9 3 21 24 27 48 6 23 22 58 35 77 l24 35 -81 16 c-170 35-275 96-344 200 -64 96-85 179-86 334 0 146 16 206 79 288 28 36 31 47 23 68 -15 36 -11 188 5 234 13 34 20 40 47 43 45 5 129 -24 214 -72 l73 -42 64 15 c91 21 364 20 446 0 l62 -16 58 35 c77 46 175 82 224 82 39 0 39 -1 55 -52 17 -59 20 -166 5 -217 -8 -30 -6 -39 16 -68 109 -144 121 -383 29 -579 -62-129 -193-219 -369-252 l-84 -16 31 -55 32 -56 3 -223 4 -223 25 -16 c23-15 28-15 76 2 80 27 217 101 292 158 446 334 590 933 343 1431 -145 293-419 518-733 602 -137 36 -395 44 -525 15z"
          fill="var(--control-text-muted)"
        />
      </g>
    </svg>
  );

  return (
    <div>
      <SimpleControlPanel
        controls={controls}
        id={id}
        position={position || { top: screenHeight / 2 - 10, left: 55 }}
        title={"Github Molecule Search"}
        initialCollapsed={true}
        minWidth={280}
        collapsedIcon={GitHubIcon}
        collapsedOffset={collapsedOffset} // shifts expanded panel by 45px right, 45px down
        contentCollapsed={contentCollapsed}
        setContentCollapsed={setContentCollapsed}
        ref={gitRef}
      />
    </div>
  );
}
