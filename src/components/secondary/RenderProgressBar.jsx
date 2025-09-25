export default function RenderProgressBar({
  progress,
  label = "Rendering...",
  run,
}) {
  return (
    <div className={!run ? "save-bar" : "save-bar-run"}>
      <div className="progress">
        <p className="save-bar-label">
          {progress < 100 ? `${label} ${progress}%` : "Render Complete!"}
        </p>
        <div
          className="progress-done"
          style={{
            width: `${progress}%`,
            opacity: 1,
          }}
        ></div>
      </div>
    </div>
  );
}
