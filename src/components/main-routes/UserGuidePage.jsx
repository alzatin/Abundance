import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Octokit } from "octokit";
import { useAuth } from "../../contexts/index.js";

/**
 * UserGuidePage component displays the Abundance repository README.md
 * as a user guide, embedded within the application.
 * Accessible both when logged in and logged out.
 */
function UserGuidePage() {
  const navigate = useNavigate();
  const { authorizedUserOcto } = useAuth();
  const [readmeContent, setReadmeContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        setLoading(true);
        
        // Always fetch from the Abundance repository
        const repoOwner = "BarbourSmith";
        const repoNameToUse = "Abundance";

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
        console.error("Error fetching User Guide:", err);
        setError(
          "Unable to load the User Guide. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
  }, [authorizedUserOcto]);

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
          Abundance User Guide
        </h1>
      </div>

      <div className="readme-content">
        {loading && (
          <div className="readme-loading">Loading User Guide...</div>
        )}
        
        {error && (
          <div className="readme-error">
            <p>{error}</p>
            <button onClick={handleBack}>Go Back</button>
          </div>
        )}
        
        {!loading && !error && (
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
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

export default UserGuidePage;
