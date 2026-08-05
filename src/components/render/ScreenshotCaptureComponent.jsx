import GlobalVariables from "../../js/globalvariables.js";
import { useScreenshotCapture } from "../../hooks/useScreenshotCapture";
import { useThumbnailDialog } from "../../contexts/ThumbnailDialogContext";

/**
 * ScreenshotCaptureComponent
 * Mounts inside Canvas and exposes screenshot capture via GlobalVariables
 */
export default function ScreenshotCaptureComponent() {
  const { openDialog } = useThumbnailDialog();
  
  const handleScreenshotCaptured = (dataUrl) => {
    const projectName = GlobalVariables.currentAWSnode?.name || "this project";
    openDialog(dataUrl, projectName, async (imageDataUrl) => {
      // TODO: Implement thumbnail upload logic here
      console.log("Setting thumbnail:", imageDataUrl);
    });
  };

  const { captureHighResScreenshot } = useScreenshotCapture(
    handleScreenshotCaptured,
  );

  // Expose the function globally for use in menus and other components
  GlobalVariables.captureHighResScreenshot = captureHighResScreenshot;

  return null; // This component doesn't render anything
}
