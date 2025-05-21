import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Octokit } from "https://esm.sh/octokit@2.0.19";
import GlobalVariables from "../../js/globalvariables.js";

const Callback = ({
  isAuthorized,
  setIsAuthorized,
  setIsLoggedIn,
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
    console.log(params.get("code"));

    const serverUrl =
      "https://n3i60kesu6.execute-api.us-east-2.amazonaws.com/prox";

    const callSecureApi = async () => {
      try {
        //const token = await getAccessTokenSilently();

        const code = params.get("code");
        const response = await fetch(
          `${serverUrl}/api/ourAutho?code=${encodeURIComponent(code)}`,
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
        }
      } catch (error) {
        console.error(error);
      }
    };
    callSecureApi();
    navigate("/");
  }, [location, setIsAuthorized]);

  return <div>Redirecting...</div>;
};

export default Callback;
