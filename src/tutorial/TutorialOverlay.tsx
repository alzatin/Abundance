import React from "react";
import { useTutorial } from "./TutorialManager";
import { createPortal } from "react-dom";

export const TutorialOverlay: React.FC = () => {
  const { currentStep, isActive, next, complete } = useTutorial();

  if (!isActive || !currentStep) return null;
  // Calculate highlight rectangle and overlay positions
  let highlightRect = null;
  if (currentStep.target) {
    const el = document.querySelector(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      highlightRect = {
        top: rect.top + 5,
        left: rect.left + 8,
        width: rect.width - 16,
        height: rect.height - 16,
        borderRadius: 10,
      };
    }
  }

  // Ensure overlay-root exists (should always be true if you added it to index.html)
  const portalRoot = document.getElementById("overlay-root");
  if (!portalRoot) return null;
  const overlayContent = (
    <div>
      {/* Four overlay divs to create a window effect */}
      {highlightRect ? (
        <>
          {/* Top overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: highlightRect.top,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10000,
              pointerEvents: currentStep.action === "none" ? "auto" : "none",
            }}
            onClick={
              currentStep.action === "click" && !currentStep.target
                ? next
                : undefined
            }
          />
          {/* Left overlay */}
          <div
            style={{
              position: "fixed",
              top: highlightRect.top,
              left: 0,
              width: highlightRect.left,
              height: highlightRect.height,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10000,
              pointerEvents: currentStep.action === "none" ? "auto" : "none",
            }}
            onClick={
              currentStep.action === "click" && !currentStep.target
                ? next
                : undefined
            }
          />
          {/* Right overlay */}
          <div
            style={{
              position: "fixed",
              top: highlightRect.top,
              left: highlightRect.left + highlightRect.width,
              width: `calc(100vw - ${
                highlightRect.left + highlightRect.width
              }px)`,
              height: highlightRect.height,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10000,
              pointerEvents: currentStep.action === "none" ? "auto" : "none",
            }}
            onClick={
              currentStep.action === "click" && !currentStep.target
                ? next
                : undefined
            }
          />
          {/* Bottom overlay */}
          <div
            style={{
              position: "fixed",
              top: highlightRect.top + highlightRect.height,
              left: 0,
              width: "100vw",
              height: `calc(100vh - ${
                highlightRect.top + highlightRect.height
              }px)`,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10000,
              pointerEvents: currentStep.action === "none" ? "auto" : "none",
            }}
            onClick={
              currentStep.action === "click" && !currentStep.target
                ? next
                : undefined
            }
          />
          {/* Highlight border */}
          <div
            style={{
              position: "fixed",
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              border: `2px solid #d368cdff`,
              borderRadius: highlightRect.borderRadius,
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 10001,
              boxShadow:
                "0 0 0 4px rgba(232, 156, 240, 0.5), 0 0 0 8px rgba(223, 169, 228, 0.15)",
              background: "transparent",
            }}
          />
        </>
      ) : (
        // Fallback: full overlay if no highlight
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
          onClick={
            currentStep.action === "click" && !currentStep.target
              ? next
              : undefined
          }
        />
      )}
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
