import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Octokit } from "https://esm.sh/octokit@2.0.19";
import GlobalVariables from "../../js/globalvariables.js";

const Callback = ({
  isAuthorized,
  setIsAuthorized,
  setIsLoggedIn,
  authorizedUserOcto,
  setAuthorizedUserOcto,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  console.log("isAuthorized", isAuthorized);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("code")) {
      setIsAuthorized(true);
    }
    const serverEndpoint = import.meta.env.VITE_AUTHO_SERVER_ENDPOINT;
    const serverUrl = import.meta.env.VITE_AUTHO_SERVER_URL;

    const callSecureApi = async () => {
      try {
        const code = params.get("code");

        const response = await fetch(
          `${serverUrl}/api/${serverEndpoint}?code=${encodeURIComponent(code)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();
        const access_token = result.message;

        const authorizedUser = new Octokit({
          auth: access_token,
        });

        const { data } = await authorizedUser.request("/user");
        GlobalVariables.currentUser = data.login;
        if (GlobalVariables.currentUser) {
          setIsLoggedIn(true);
          setAuthorizedUserOcto(authorizedUser);

          return authorizedUser;
        }
      } catch (error) {
        console.error(error);
        setIsAuthorized(false);
      }
    };

    // Call the function to fetch the access token
    callSecureApi().then((authorizedUser) => {
      try {
        const stateParam = params.get("state");
        const state = stateParam ? JSON.parse(stateParam) : {};
        console.log("state", state);
        if (state.forking && state.currentRepo && authorizedUser) {
          navigate(`/run/${state.currentRepo}`);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error parsing state parameter:", error);
        navigate("/");
      }
    });
  }, [location, setIsAuthorized]);

  return <div>Redirecting...</div>;
};

export default Callback;
