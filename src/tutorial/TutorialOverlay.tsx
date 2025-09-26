import React from "react";
import { useTutorial } from "./TutorialManager";
import { createPortal } from "react-dom";

export const TutorialOverlay: React.FC = () => {
  const { currentStep, isActive, next, complete } = useTutorial();

  if (!isActive || !currentStep) return null;
  console.log("Current Step:", currentStep);
  // Highlight logic (you may want to use a library like react-portal or react-spotlight for better visuals)
  const highlightStyle: React.CSSProperties = currentStep.target
    ? (() => {
        const el = document.querySelector(currentStep.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          return {
            position: "fixed",
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            border: "3px solid #2ec4b6",
            borderRadius: 8,
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 10001,
          };
        }
        return {};
      })()
    : {};

  // Ensure overlay-root exists (should always be true if you added it to index.html)
  const portalRoot = document.getElementById("overlay-root");
  if (!portalRoot) return null;
  const overlayContent = (
    <div>
      {/* Fullscreen overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          zIndex: 10000,
          pointerEvents: currentStep.action === "none" ? "auto" : "none",
        }}
        // For steps that want the user to click anywhere to proceed
        onClick={
          currentStep.action === "click" && !currentStep.target
            ? next
            : undefined
        }
      />
      {/* Highlight rectangle */}
      {currentStep.target && <div style={highlightStyle} />}
      {/* Message */}
      <div
        style={{
          position: "fixed",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          borderRadius: 12,
          padding: "2rem 2.5rem",
          boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
          zIndex: 10002,
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 16 }}>{currentStep.message}</div>
        {["none", "scroll"].includes(currentStep.action) && (
          <button onClick={next} style={{ marginRight: 8 }}>
            Next
          </button>
        )}
        <button onClick={complete} style={{ background: "#eee" }}>
          Exit Tutorial
        </button>
      </div>
    </div>
  );
  return createPortal(overlayContent, portalRoot);
};
