/**
 * Required External Modules
 */

import express from "express";
import axios from "axios";
import serverless from "serverless-http";

import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

/**
 * App Variables
 */

const app = express();

/**
 *  App Configuration
 */

app.use(express.json());

app.get("/api/ourAutho", async (req, res) => {
  try {
    const code = req.query.code; // Retrieve 'code' from query parameters
    console.log("Code received:", code);

    // Set multiple headers
    res.set({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      Allow: "GET, OPTIONS, POST",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
      "Access-Control-Allow-Headers": "*",
    });

    const response = await axios.get(
      "https://github.com/login/oauth/access_token",
      {
        params: {
          client_id: "Ov23liN8Q3iGPXSUHUsH",
          client_secret: process.env.CLIENT_SECRET_GIT,
          code: code,
          redirect_uri: `http://localhost:4444/callback`,
        },
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "application/json",
        },
      }
    );
    const access_token = response.data.access_token;

    res.status(200).send({ success: true, message: access_token });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});
app.get("/api/mobAutho", async (req, res) => {
  try {
    const code = req.query.code; // Retrieve 'code' from query parameters
    console.log("Code received:", code);

    // Set multiple headers
    res.set({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      Allow: "GET, OPTIONS, POST",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
      "Access-Control-Allow-Headers": "*",
    });

    const response = await axios.get(
      "https://github.com/login/oauth/access_token",
      {
        params: {
          client_id: "Ov23lioNfq4Q063COhYR",
          client_secret: process.env.CLIENT_SECRET_GIT_MOB,
          code: code,
          redirect_uri: `${process.env.MOB_TEST_NETWORK}callback`,
        },
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "application/json",
        },
      }
    );
    const access_token = response.data.access_token;

    res.status(200).send({ success: true, message: access_token });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});
app.get("/api/deployAutho", async (req, res) => {
  try {
    const code = req.query.code; // Retrieve 'code' from query parameters
    console.log("Code received:", code);

    // Set multiple headers
    res.set({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      Allow: "GET, OPTIONS, POST",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
      "Access-Control-Allow-Headers": "*",
    });

    const response = await axios.get(
      "https://github.com/login/oauth/access_token",
      {
        params: {
          client_id: "Ov23liogKqBPbZwB4H5C",
          client_secret: process.env.CLIENT_SECRET_GIT_DEPLOY,
          code: code,
          redirect_uri: `https://abundance.maslowcnc.com/callback`,
        },
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "application/json",
        },
      }
    );
    const access_token = response.data.access_token;

    res.status(200).send({ success: true, message: access_token });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.get("/api/test", (req, res) => {
  const code = req.query.code; // Retrieve 'code' from query parameters
  console.log("Code received:", code);

  // Set multiple headers
  res.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    Allow: "GET, OPTIONS, POST",
    "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
    "Access-Control-Allow-Headers": "*",
  });

  res.status(200).send({ success: true, message: code });
});

app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send(err.message);
});

export const handler = serverless(app);
