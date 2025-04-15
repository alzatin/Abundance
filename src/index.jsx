import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import Auth0ProviderWithHistory from "./auth/auth0-provider-with-history.jsx";
import { BrowserRouter } from "react-router-dom";

// This is here to compensate for a bug in vite
import "replicad-opencascadejs/src/replicad_single.wasm?url";

const root = ReactDOM.createRoot(document.getElementById("root"));
console.log("Vite Browser Router: ", import.meta.env.VITE_BROWSER_ROUTER);
root.render(
  <BrowserRouter basename={import.meta.env.VITE_BROWSER_ROUTER}>
    <Auth0ProviderWithHistory>
      <App />
    </Auth0ProviderWithHistory>
  </BrowserRouter>
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://vitejs.dev/guide/api-hmr.html
if (import.meta.hot) {
  import.meta.hot.accept();
}
