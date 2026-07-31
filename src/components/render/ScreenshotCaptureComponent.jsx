import GlobalVariables from "../../js/globalvariables.js";
import { useScreenshotCapture } from "../../hooks/useScreenshotCapture";

/**
 * ScreenshotCaptureComponent
 * Mounts inside Canvas and exposes screenshot capture via GlobalVariables
 */
export default function ScreenshotCaptureComponent() {
  const { captureHighResScreenshot } = useScreenshotCapture();

  // Expose the function globally for use in menus and other components
  GlobalVariables.captureHighResScreenshot = captureHighResScreenshot;

  return null; // This component doesn't render anything
}
