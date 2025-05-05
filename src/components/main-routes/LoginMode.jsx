import React, { useEffect, useRef, useState } from "react";
import GlobalVariables from "../../js/globalvariables.js";
import { Octokit } from "https://esm.sh/octokit@2.0.19";
import { Link } from "react-router-dom";
import globalvariables from "../../js/globalvariables.js";
import NewProjectPopUp from "../secondary/NewProjectPopUp.jsx";

import { useAuth0 } from "@auth0/auth0-react";

/**
 * The octokit instance which allows interaction with GitHub.
 * @type {object}
 */
var octokit = null;

/**
 * Initial log component displays pop Up to either attempt Github login/browse projects
 *
 */
const InitialLog = ({ setNoUserBrowsing }) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="login-page">
      <div className="form animate fadeInUp one">
        <div id="gitSide" className="logindiv">
          <img
            className="logo"
            src={
              import.meta.env.VITE_APP_PATH_FOR_PICS +
              "/imgs/abundance_logo.png"
            }
            alt="logo"
          />
          <div id="welcome">
            <img
              src={
                import.meta.env.VITE_APP_PATH_FOR_PICS +
                "/imgs/abundance_lettering.png"
              }
              alt="logo"
              className="login-logo"
            />
          </div>
          <p style={{ padding: "0 20px" }}>
            Abundance projects are stored through GitHub. You control your
            files.{" "}
          </p>
          <form className="login-form">
            <button
              type="button"
              id="loginButton"
              style={{ height: "40px" }}
              className="submit-btn"
              onClick={() => loginWithRedirect()}
            >
              Login With GitHub
            </button>
            <p className="message">
              Don't have an account?{" "}
              <a href="https://github.com/join">Create a free account</a>
            </p>
          </form>
        </div>
        <div id="nonGitSide" className="logindiv curiousBrowse">
          <p
            style={{
              justifyContent: "flex-start",
              display: "inline",
            }}
          >
            Check out what others have designed in Abundance
          </p>

          <button
            type="button"
            onClick={() => {
              setNoUserBrowsing(true);
            }}
            className="submit-btn"
            id="browseNonGit"
            style={{ padding: "0 30px" }}
          >
            Browse all projects
          </button>
        </div>
      </div>
    </div>
  );
};

// adds individual projects after API call
const AddProject = ({
  setYearShow,
  nodes,
  authorizedUserOcto,
  projectToShow,
}) => {
  const [browseType, setBrowseType] = useState("thumb");

  let initialOrder =
    projectToShow == "featured"
      ? "byStars"
      : projectToShow == "all"
      ? "byDateModified"
      : projectToShow == "recents"
      ? "byDateModified"
      : "byName";

  const [orderType, setOrderType] = useState(initialOrder);
  //looking for highest ranking project and tool
  let highestRankingNode = null;
  let highestRankingToolNode = null;

  if (projectToShow == "featured" && nodes.length > 0) {
    const filteredNodes = nodes.filter((node) => {
      return !node.topics.includes("abundance-tool");
    });
    const sortedNodes = filteredNodes.sort((a, b) => b.ranking - a.ranking);
    highestRankingNode = sortedNodes[0];

    const toolNodes = nodes.filter((node) =>
      node.topics.includes("abundance-tool")
    );
    const sortedToolNodes = toolNodes.sort((a, b) => b.ranking - a.ranking);
    highestRankingToolNode = sortedToolNodes[0];
  }

  return (
    <>
      <div id="sorting-button-div">
        <button
          className="list_thumb_button"
          key="list-filter-button"
          onClick={() => setBrowseType("list")}
        >
          <img
            src={import.meta.env.VITE_APP_PATH_FOR_PICS + "/imgs/list.svg"}
            alt="list_search"
            style={{
              width: "20px",
              marginRight: "5px",
              opacity: "0.8",
            }}
          />
        </button>
        <button
          className="list_thumb_button"
          key="thumb-filter-button"
          onClick={() => setBrowseType("thumb")}
        >
          <img
            src={import.meta.env.VITE_APP_PATH_FOR_PICS + "/imgs/thumbnail.svg"}
            alt="thumb_search"
            style={{
              width: "20px",
              marginRight: "5px",
              opacity: "0.8",
            }}
          />
        </button>
        <label htmlFor="order-by">
          <select
            className="order_dropdown"
            id="order-by"
            defaultValue={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            <option key={"name_order"} value={"byName"}>
              Name
            </option>
            <option key={"forks_order"} value={"byForks"}>
              Forks
            </option>
            <option key={"stars_order"} value={"byStars"}>
              Stars
            </option>
            <option key={"owner_order"} value={"byOwnerName"}>
              Creator
            </option>
            <option key={"date_order"} value={"byDateCreated"}>
              Date Created
            </option>
            <option key={"dateModified_order"} value={"byDateModified"}>
              Date Modified
            </option>
          </select>
        </label>
      </div>
      <div className="project-items-div">
        {projectToShow == "featured" &&
        highestRankingNode &&
        highestRankingToolNode ? (
          <div id="featured-div">
            <div
              id="left-featured-div"
              style={{ width: "50%", display: "flex" }}
              className="project"
            >
              <div>
                <h3 className="project_name">Featured Project: </h3>
                <p className="project_name">{highestRankingNode.repoName}</p>
                <p className="project_name">{highestRankingNode.owner}</p>
              </div>
              <img
                className="project_image"
                src={highestRankingNode.svgURL}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src =
                    import.meta.env.VITE_APP_PATH_FOR_PICS +
                    "/imgs/defaultThumbnail.svg";
                }}
                alt={highestRankingNode.repoName}
              ></img>
            </div>
            <div
              id="right-featured-div"
              style={{ width: "50%", display: "flex" }}
              className="project"
            >
              <div>
                <h3 className="project_name">Featured Tool</h3>
                <p className="project_name">
                  {highestRankingToolNode.repoName}
                </p>
                <p className="project_name">{highestRankingToolNode.owner}</p>
              </div>
              <img
                className="project_image"
                src={highestRankingToolNode.svgURL}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src =
                    import.meta.env.VITE_APP_PATH_FOR_PICS +
                    "/imgs/defaultThumbnail.svg";
                }}
                alt={highestRankingToolNode.repoName}
              ></img>
            </div>
          </div>
        ) : null}
        {nodes.length > 0 ? (
          <ProjectDiv
            {...{ nodes, browseType, orderType, authorizedUserOcto }}
          />
        ) : (
          <p>No projects match your search</p>
        )}
      </div>
    </>
  );
};

const ProjectDiv = ({ nodes, browseType, orderType }) => {
  const ThumbItem = ({ node }) => {
    return (
      <div
        className="project"
        style={
          node.owner != GlobalVariables.currentUser
            ? { backgroundColor: "rgb(233 221 242 / 58%)" }
            : null
        }
        key={node.topMoleculeID + node.owner}
        id={node.repoName}
        onClick={() => {
          GlobalVariables.currentRepo = node;
        }}
      >
        <p className="project_name">{node.repoName}</p>
        <img
          className="project_image"
          src={node.svgURL}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src =
              import.meta.env.VITE_APP_PATH_FOR_PICS +
              "/imgs/defaultThumbnail.svg";
          }}
          alt={node.repoName}
        ></img>
        <div
          style={{
            height: "30px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: "scale(.7)", alignSelf: "center" }}
              width="16"
              height="16"
            >
              <path d="M8 .2l4.9 15.2L0 6h16L3.1 15.4z" />
            </svg>
            <p
              style={{
                fontSize: ".7em",
                display: "inline",
                alignSelf: "center",
              }}
            >
              {node.ranking}
            </p>
          </div>
          <div style={{ alignSelf: "center" }}>
            {node.topics && node.topics.includes("abundance-tool") ? (
              <p> {"\u{1F528} "} </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  };
  const ListItem = (node) => {
    let dateCreated = new Date(node.node.dateCreated).toDateString(); //converts date to string
    if (dateCreated == "Invalid Date") {
      dateCreated = "Date Created";
    }
    return (
      <div
        className="project_list"
        key={node.node.id}
        id={node.node.id}
        onClick={() => {
          GlobalVariables.currentRepo = node.node;
        }}
      >
        <p className="project_name_list">{node.node.repoName}</p>

        <p className="project_name_list">{node.node.owner}</p>
        <p style={{ width: "20%", display: "block" }}>
          {" "}
          {node.node.topics && node.node.topics.includes("abundance-tool")
            ? "\u{1F528} "
            : null}
        </p>
        <p className="project_name_list">{dateCreated}</p>

        <div
          style={{
            width: "10%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: "scale(.75)" }}
            width="16"
            height="16"
          >
            <path d="M8 .2l4.9 15.2L0 6h16L3.1 15.4z" />
          </svg>
          <p className="project_name_list">{node.node.ranking}</p>
        </div>
      </div>
    );
  };

  var sorters = {
    byName: function (a, b) {
      return a.repoName < b.repoName ? -1 : a.repoName > b.repoName ? 1 : 0;
    },
    byForks: function (a, b) {
      return b.forks - a.forks;
    },
    byStars: function (a, b) {
      return b.ranking - a.ranking;
    },
    byOwnerName: function (a, b) {
      return a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0;
    },
    byDateCreated: function (a, b) {
      return new Date(a.dateCreated) > new Date(b.dateCreated)
        ? -1
        : new Date(a.dateCreated) < new Date(b.dateCreated)
        ? 1
        : 0;
    },
    byDateModified: function (a, b) {
      return a.dateModified > b.dateModified
        ? -1
        : a.dateModified < b.dateModified
        ? 1
        : 0;
    },
  };
  const dummyNode = {
    forks: "Forks",
    ranking: "#",
    dateCreated: "Date Created",
    owner: "Creator",
    repoName: "Name",
  };

  return (
    <>
      <div className="project-item-div">
        {browseType == "list" ? <ListItem node={dummyNode} /> : null}
        {nodes.sort(sorters[orderType]).map((node) => (
          <Link
            key={node.owner + node.repoName}
            to={
              node.owner == globalvariables.currentUser
                ? `/${node.owner}/${node.repoName}`
                : `/run/${node.owner}/${node.repoName}`
            }
          >
            {browseType == "list" ? (
              <ListItem {...{ node }} />
            ) : (
              <ThumbItem {...{ node }} />
            )}
          </Link>
        ))}
      </div>
    </>
  );
};

/* to add: if current user is null show this next part */
const ShowProjects = ({
  projectToShow,
  setExportPopUp,
  setProjectsToShow,
  user,
  authorizedUserOcto,
  pageDict,
  loginWithRedirect,
  setNoUserBrowsing,
}) => {
  const loadingMessages = {
    loading: "Loading projects...",
    error: "Error",
    noProjects: "No projects found",
  };

  useEffect(() => {
    setProjectsToShow(user ? "recents" : "featured");
  }, [GlobalVariables.currentUser]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [projectsLoaded, setStateLoaded] = useState([]);
  const [lastKey, setLastKey] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const [searchBarValue, setSearchBarValue] = useState("");
  const [yearShow, setYearShow] = useState(currentYear);
  const [apiStatus, setApiStatus] = useState(loadingMessages.loading);

  const controllerRef = useRef(new AbortController());

  const forkProject = async function (authorizedUserOcto, owner, repo) {
    authorizedUserOcto
      .request("GET /repos/{owner}/{repo}", {
        owner: owner,
        repo: repo,
      })
      .then((result) => {
        authorizedUserOcto.rest.repos
          .createFork({
            owner: owner,
            repo: repo,
          })
          .then(() => {
            //push fork to aws
            const apiUrl =
              "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage//post-new-project";
            let searchField = (
              result.data.name +
              " " +
              GlobalVariables.currentUser
            ).toLowerCase();
            let forkedNodeBody = {
              owner: GlobalVariables.currentUser,
              ranking: result.data.stargazers_count,
              description: result.data.description,
              searchField: searchField,
              repoName: result.data.name,
              forks: 0,
              topMoleculeID: result.data.id,
              topics: [],
              readme:
                "https://raw.githubusercontent.com/" +
                GlobalVariables.currentUser +
                "/" +
                result.data.name +
                "/master/README.md?sanitize=true",
              contentURL:
                "https://raw.githubusercontent.com/" +
                GlobalVariables.currentUser +
                "/" +
                result.data.name +
                "/master/project.abundance?sanitize=true",
              githubMoleculesUsed: [],
              parentRepo: owner + "/" + repo,
              svgURL:
                "https://raw.githubusercontent.com/" +
                GlobalVariables.currentUser +
                "/" +
                result.data.name +
                "/master/project.svg?sanitize=true",
              dateCreated: result.data.created_at,
              html_url: result.data.html_url,
            };
            fetch(apiUrl, {
              method: "POST",
              body: JSON.stringify(forkedNodeBody),
              headers: {
                "Content-type": "application/json; charset=UTF-8",
              },
            });
          });
      });
  };

  useEffect(() => {
    octokit = new Octokit();
    var query;

    /* Function to fork a dummy project if user has no projects */
    const forkDummyProject = async function (authorizedUserOcto) {
      console.log("User has no projects, forking dummy project");
      await forkProject(authorizedUserOcto, "alzatin", "my-first-project");
    };
    const repoSearchRequest = async () => {
      setStateLoaded([]); /*sets loading while fetching*/
      //pageDict[pageNumber] = lastKey;

      /* aborting previous request */
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      let lastKeyQuery = lastKey
        ? "&lastKey=" + lastKey.repoName + "~" + lastKey.owner
        : "&lastKey";

      let searchQuery;
      if (searchBarValue != "") {
        searchQuery = "&query=" + searchBarValue + "&yearShow=" + yearShow;
      } else {
        searchQuery = "&query" + "&yearShow=" + yearShow;
      }

      if (projectToShow == "all") {
        query = "attribute=searchField" + searchQuery + "&user" + lastKeyQuery;
      } else if (projectToShow == "owned") {
        query =
          "attribute=searchField" +
          searchQuery +
          "&user=" +
          user +
          lastKeyQuery;
      } else if (projectToShow == "featured") {
        // placeholder for featured projects
        const scanFeaturedApi =
          "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/queryFeaturedProjects";
        let awsRepos = await fetch(scanFeaturedApi, { signal });

        return awsRepos.json();
      } else if (projectToShow == "liked") {
        // placeholder for liked projects
        const scanUserApiUrl =
          "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/USER-TABLE?user=" +
          user +
          "&liked=true";
        let awsLikeRepos = await fetch(scanUserApiUrl, { signal });

        return awsLikeRepos.json();
      } else if (projectToShow == "recents") {
        query =
          "attribute=searchField" +
          searchQuery +
          "&user=" +
          user +
          lastKeyQuery;
        const scanRecentApi =
          "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/queryRecentProjects?" +
          query;
        let awsRepos = await fetch(scanRecentApi, { signal });
        return awsRepos.json();
      }
      //API URL for the scan-search-abundance endpoint and abundance-projects table
      const scanApiUrl =
        "https://hg5gsgv9te.execute-api.us-east-2.amazonaws.com/abundance-stage/scan-search-abundance?" +
        query;
      let awsRepos = await fetch(scanApiUrl, { signal }); //< return result.json();[repos]
      //let awsRepos = await fetch(scanUserApiUrl);

      return awsRepos.json();
    };

    repoSearchRequest(projectToShow)
      .then((result) => {
        setStateLoaded([]);
        setApiStatus(loadingMessages.loading);
        if (
          (result["repos"].length == 0 && projectToShow == "recents") ||
          projectToShow == "owned"
        ) {
          setApiStatus(loadingMessages.noProjects);
          forkDummyProject(authorizedUserOcto).then(() => {
            repoSearchRequest().then((result) => {
              //setBrowsing(true);
              setStateLoaded(result["repos"]);
            });
          });
        } else if (result["repos"].length == 0) {
          setApiStatus(loadingMessages.noProjects);
        } else {
          setStateLoaded(result["repos"]);
          setLastKey(result["lastKey"]);
        }
      })
      .catch((err) => {
        console.log(err);
        if (err.name !== "AbortError") {
          alert(
            "Error loading projects from database. Please try again later. " +
              err
          );
        }
      });
  }, [searchBarValue, pageNumber, projectToShow, yearShow]);

  let nodes = [];

  if (projectsLoaded.length > 0) {
    var userRepos = [];
    projectsLoaded /*[pageNumber].data.*/
      .forEach((repo) => {
        userRepos.push(repo);
      });
    nodes = [...userRepos];
  }
  const handleSearchChange = (e) => {
    if (e.code == "Enter") {
      setSearchBarValue(e.target.value);
      setPageNumber(0);
    }
  };

  const UserNavDiv = (
    <div className="left-login-div">
      <div
        className="login-nav-item"
        onClick={() => {
          setExportPopUp(true);
        }}
      >
        <p>New project</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "owned" ? " login-nav-item-clicked" : "")
        }
        onClick={(e) => {
          setProjectsToShow("owned");
        }}
      >
        <p>My Projects</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "recents" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("recents");
        }}
      >
        <p> Recent Projects</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "liked" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("liked");
        }}
      >
        <p> Liked Projects</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "featured" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("featured");
        }}
      >
        <p> Browse Featured Projects</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "all" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("all");
        }}
      >
        <p> Browse All Other Projects</p>
      </div>
    </div>
  );

  const noUserNavDiv = (
    <div className="left-login-div">
      <div
        className="login-nav-item"
        onClick={() => {
          setNoUserBrowsing(false);
          loginWithRedirect();
        }}
      >
        <p>Login</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "featured" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("featured");
        }}
      >
        <p> Browse Featured Projects</p>
      </div>
      <div
        className={
          "login-nav-item" +
          (projectToShow == "all" ? " login-nav-item-clicked" : "")
        }
        onClick={() => {
          setProjectsToShow("all");
        }}
      >
        <p> Browse All Other Projects</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="login-content-div">
        {GlobalVariables.currentUser ? UserNavDiv : noUserNavDiv}
        <div className="right-login-div">
          <span style={{ fontFamily: "Roboto" }}>
            Welcome {GlobalVariables.currentUser}
          </span>
          <div className="home-section">
            {projectToShow == "owned"
              ? "My Projects"
              : projectToShow == "liked"
              ? "My Liked Projects"
              : projectToShow == "all"
              ? "Browsing Projects"
              : projectToShow == "featured"
              ? "Featured Projects"
              : projectToShow == "recents"
              ? "Recent Projects"
              : null}
          </div>
          <hr width="100%" color="#D3D3D3" />

          <div className="search-bar-div">
            {projectsLoaded.length > 1 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  margin: "0px 10px 0px 10px",
                }}
              >
                {lastKey ? (
                  <button
                    onClick={() => {
                      if (pageNumber > 0) {
                        setPageNumber(pageNumber - 1);
                      }
                    }}
                    className="page_back_button"
                  >
                    {"\u2190"}
                  </button>
                ) : null}

                {lastKey ? (
                  <button
                    className="page_forward_button"
                    onClick={() => {
                      if (lastKey != "") {
                        setPageNumber(pageNumber + 1);
                      }
                    }}
                  >
                    {"\u2192"}
                  </button>
                ) : null}
              </div>
            ) : null}

            <input
              type="text"
              key="project-search-bar"
              placeholder={searchBarValue}
              //value={target.value}
              //onChange={(e) => setSearchBarType(e.target.value)}
              onKeyDown={(e) => {
                handleSearchChange(e);
              }}
              className="menu_search searchButton"
              id="project_search"
            />
            <button className="list_thumb_button">
              <img
                src={
                  import.meta.env.VITE_APP_PATH_FOR_PICS +
                  "/imgs/search_icon.svg"
                }
                alt="search"
                style={{
                  width: "20px",
                  color: "white",
                  marginRight: "5px",
                  opacity: "0.5",
                }}
              />
            </button>
          </div>
          {projectsLoaded.length > 0 ? (
            <AddProject
              {...{
                setYearShow,
                nodes,
                authorizedUserOcto,
                user,
                projectToShow,
              }}
            />
          ) : (
            apiStatus
          )}
        </div>
      </div>
    </>
  );
};

function LoginMode({
  exportPopUp,
  setExportPopUp,
  setIsLoggedIn,
  authorizedUserOcto,
  setAuthorizedUserOcto,
}) {
  const pageDict = { 0: null };

  const [noUserBrowsing, setNoUserBrowsing] = useState(false);

  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [projectToShow, setProjectsToShow] = useState("featured");

  useEffect(() => {
    if (isAuthenticated) {
      console.log("isAuthenticated");

      const serverUrl =
        "https://n3i60kesu6.execute-api.us-east-2.amazonaws.com/prox";

      const callSecureApi = async () => {
        try {
          const token = await getAccessTokenSilently();

          //Returns authorized user from proxy server
          const response = await fetch(`${serverUrl}/api/greet`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const authResponse = await response.json();
          const authorizedUser = new Octokit({
            auth: authResponse.message,
          });
          const { data } = await authorizedUser.request("/user");
          GlobalVariables.currentUser = data.login;
          if (GlobalVariables.currentUser) {
            setIsLoggedIn(true);
            setAuthorizedUserOcto(authorizedUser);
          }
        } catch (error) {
          console.error(error);
        }
      };
      callSecureApi();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  let popUpContent;
  if (exportPopUp && authorizedUserOcto) {
    popUpContent = (
      <NewProjectPopUp
        {...{ setExportPopUp, authorizedUserOcto, exporting: false }}
      />
    );
  } else if (isAuthenticated && authorizedUserOcto) {
    popUpContent = (
      <ShowProjects
        {...{
          projectToShow,
          setExportPopUp,
          setProjectsToShow,
          user: GlobalVariables.currentUser,
          authorizedUserOcto,
          pageDict,
        }}
      />
    );
  } else if (isLoading || isAuthenticated) {
    popUpContent = (
      <div className="login-page">
        <div className="form animate fadeInUp one">
          <div id="gitSide" className="logindiv">
            <img
              className="logo"
              src={
                import.meta.env.VITE_APP_PATH_FOR_PICS +
                "/imgs/abundance_logo.png"
              }
              alt="logo"
            />
            <div id="welcome">
              <img
                src={
                  import.meta.env.VITE_APP_PATH_FOR_PICS +
                  "/imgs/abundance_lettering.png"
                }
                alt="logo"
                className="login-logo"
              />
            </div>
            {isAuthenticated ? (
              <p style={{ padding: "0 20px" }}>
                Welcome. Redirecting you to your projects...
              </p>
            ) : (
              <p style={{ padding: "0 20px" }}>Logging you in ...</p>
            )}
          </div>
        </div>
      </div>
    );
  } else if (noUserBrowsing) {
    popUpContent = (
      <ShowProjects
        {...{
          projectToShow,
          setExportPopUp,
          setProjectsToShow,
          user: null,
          authorizedUserOcto,
          pageDict,
          loginWithRedirect,
          setNoUserBrowsing,
        }}
      />
    );
  } else {
    popUpContent = <InitialLog {...{ loginWithRedirect, setNoUserBrowsing }} />;
  }
  return (
    <div
      className="login-popup"
      id="projects-popup"
      style={{
        padding: "0",
        border: "10px solid #3e3d3d",
      }}
    >
      <div>
        {" "}
        {GlobalVariables.currentRepo &&
        GlobalVariables.currentRepo.owner == GlobalVariables.currentUser &&
        isAuthenticated ? (
          <Link
            to={`/${GlobalVariables.currentRepo.owner}/${GlobalVariables.currentRepo.repoName}`}
          >
            <button
              className="closeButton"
              onClick={() => {
                setExportPopUp(false);
              }}
            >
              <img></img>
              <span> Return to project</span>
            </button>
          </Link>
        ) : isAuthenticated ? (
          <button
            className="closeButton"
            onClick={() => {
              logout({
                returnTo: import.meta.env.VITE_APP_DEV
                  ? window.location.origin
                  : "https://abundance.maslowcnc.com", // Redirect to home page or specified URL
              });
            }}
          >
            <span> Log out </span>
          </button>
        ) : null}
      </div>
      <div className="top-banner" style={{ margin: "35px 0 0 30px" }}>
        <div id="welcome-logo">
          <img
            src={
              import.meta.env.VITE_APP_PATH_FOR_PICS +
              "/imgs/abundance_logo.png"
            }
            alt="logo"
            id="welcome-logo-img"
          />
          <img
            src={
              import.meta.env.VITE_APP_PATH_FOR_PICS +
              "/imgs/abundance_lettering.png"
            }
            alt="logo"
            id="welcome-logo-lettering"
            style={{ height: "20px", padding: "10px" }}
          />
        </div>

        {isAuthenticated ? (
          <section id="mobile-nav" className="top-nav">
            <input id="menu-toggle" type="checkbox" />
            <label className="menu-button-container" htmlFor="menu-toggle">
              <div className="menu-button"></div>
            </label>
            <button
              className="closeButtonmobile"
              onClick={() => {
                logout({
                  returnTo: import.meta.env.VITE_APP_DEV
                    ? window.location.origin
                    : "https://abundance.maslowcnc.com", // Redirect to home page or specified URL
                });
              }}
            >
              <span> Log out </span>
            </button>

            <div className="menu">
              <div
                className="login-nav-item"
                onClick={() => {
                  setExportPopUp(true);
                }}
              >
                <p>New project</p>
              </div>
              <div
                className={
                  "login-nav-item" +
                  (projectToShow == "owned" ? " login-nav-item-clicked" : "")
                }
                onClick={(e) => {
                  setProjectsToShow("owned");
                }}
              >
                <p>My Projects</p>
              </div>
              <div
                className={
                  "login-nav-item" +
                  (projectToShow == "recents" ? " login-nav-item-clicked" : "")
                }
                onClick={() => {
                  setProjectsToShow("recents");
                }}
              >
                <p> Recent Projects</p>
              </div>
              <div
                className={
                  "login-nav-item" +
                  (projectToShow == "liked" ? " login-nav-item-clicked" : "")
                }
                onClick={() => {
                  setProjectsToShow("liked");
                }}
              >
                <p> Liked Projects</p>
              </div>
              <div
                className={
                  "login-nav-item" +
                  (projectToShow == "featured" ? " login-nav-item-clicked" : "")
                }
                onClick={() => {
                  setProjectsToShow("featured");
                }}
              >
                <p> Browse Featured Projects</p>
              </div>
              <div
                className={
                  "login-nav-item" +
                  (projectToShow == "all" ? " login-nav-item-clicked" : "")
                }
                onClick={() => {
                  setProjectsToShow("all");
                }}
              >
                <p> Browse All Other Projects</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
      {popUpContent}
    </div>
  );
}

export default LoginMode;

/*--Credit to https://codepen.io/colorlib/pen/rxddKy */
