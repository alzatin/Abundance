import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Octokit } from "octokit";
import GlobalVariables from "../../js/globalvariables.js";
import { useAuth } from "../../contexts/index.js";

/**
 * ReadMePage component displays the README.md content from the current project
 * embedded within the application, accessible both when logged in and logged out.
 */
function ReadMePage() {
  const navigate = useNavigate();
  const { owner, repoName } = useParams();
  const { authorizedUserOcto } = useAuth();
  const [readmeContent, setReadmeContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        setLoading(true);
        
        // Use route params if available, otherwise fall back to GlobalVariables
        const repoOwner = owner || GlobalVariables.currentRepo?.owner?.login;
        const repoNameToUse = repoName || GlobalVariables.currentRepo?.name;
        
        if (!repoOwner || !repoNameToUse) {
          setError("No project information available. Please open a project first.");
          setLoading(false);
          return;
        }

        // Create Octokit instance (authenticated if available, otherwise public)
        const octokit = authorizedUserOcto || new Octokit();

        // Fetch README content from GitHub API
        const response = await octokit.request(
          "GET /repos/{owner}/{repo}/readme",
          {
            owner: repoOwner,
            repo: repoNameToUse,
            mediaType: {
              format: "raw",
            },
          }
        );

        setReadmeContent(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching README:", err);
        setError(
          "Unable to load README. The project may not have a README.md file."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
  }, [owner, repoName, authorizedUserOcto]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="readme-page">
      <div className="readme-header">
        <button className="readme-back-button" onClick={handleBack}>
          ← Back
        </button>
        <h1 className="readme-title">
          {repoName || GlobalVariables.currentRepo?.name || "Project"} README
        </h1>
      </div>

      <div className="readme-content">
        {loading && (
          <div className="readme-loading">Loading README...</div>
        )}
        
        {error && (
          <div className="readme-error">
            <p>{error}</p>
            <button onClick={handleBack}>Go Back</button>
          </div>
        )}
        
        {!loading && !error && (
          <ReactMarkdown
            components={{
              // Ensure external links open in new tab
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
              // Add styling classes to headers
              h1: ({ node, ...props }) => <h1 className="readme-h1" {...props} />,
              h2: ({ node, ...props }) => <h2 className="readme-h2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="readme-h3" {...props} />,
              // Style images to be responsive
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  style={{ maxWidth: "100%", height: "auto" }}
                  alt={props.alt || ""}
                />
              ),
              // Style code blocks
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code className="readme-inline-code" {...props} />
                ) : (
                  <code className="readme-code-block" {...props} />
                ),
              pre: ({ node, ...props }) => (
                <pre className="readme-pre" {...props} />
              ),
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default ReadMePage;
