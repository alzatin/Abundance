import puppeteer from "puppeteer";
import projects_to_test from "./projects_to_test.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectUser = "moatmaslow";
const currentDate = new Date().toISOString().split("T")[0];

// Function to create an error screenshot with a message
async function createErrorScreenshot(
  filePath,
  title,
  errorMessage,
  isWarning = false
) {
  try {
    // Use different colors for warnings vs errors
    const backgroundColor = isWarning ? "#ff9800" : "#f44336"; // Orange for warnings, red for errors

    // Create a simple HTML content to display the error
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: ${backgroundColor}; 
              color: white; 
              padding: 20px; 
              margin: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              text-align: center;
            }
            .error-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 20px; 
            }
            .error-message { 
              font-size: 16px; 
              background: rgba(0,0,0,0.2); 
              padding: 15px; 
              border-radius: 5px; 
              max-width: 80%;
              word-wrap: break-word;
            }
            .timestamp {
              margin-top: 20px;
              font-size: 14px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="error-title">${title}</div>
          <div class="error-message">${errorMessage}</div>
          <div class="timestamp">Failed at: ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;

    // Write the error HTML to a temporary file
    const tempErrorFile = path.join(__dirname, `temp-error-${Date.now()}.html`);
    fs.writeFileSync(tempErrorFile, errorHtml);

    // Use Puppeteer to screenshot the error page
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto(`file://${tempErrorFile}`);
    await page.screenshot({ path: filePath });
    await browser.close();

    // Clean up temporary file
    fs.unlinkSync(tempErrorFile);

    console.log(`Error screenshot created: ${filePath}`);
  } catch (screenshotError) {
    console.error(
      `Failed to create error screenshot: ${screenshotError.message}`
    );
  }
}

// Launch the browser and open a new blank page
//for each project in projects to test launch puppeteer

(async () => {
  let browser;
  let hasErrors = false;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    hasErrors = await loadPuppeteerAndExec(browser, currentDate);
  } catch (error) {
    console.error(`Error processing projects:`, error);
    hasErrors = true;
  } finally {
    if (browser) {
      console.log(`Closing browser `);
      await browser.close();
    }
  }
  console.log("All projects processed!");

  // Exit with error code if there were any failures
  if (hasErrors) {
    console.error("Some tests failed - check error screenshots");
    process.exit(1);
  }
})();

async function loadPuppeteerAndExec(browser, date) {
  const page = await browser.newPage();
  let hasErrors = false;

  for (const projectName of projects_to_test) {
    console.log(`Testing project: ${projectName}`);

    try {
      // Navigate the page to a localhost URL.
      await page.goto(
        "http://localhost:4444" + "/run/" + projectUser + "/" + projectName,
        { timeout: 60000 } // Increase navigation timeout to 60 seconds
      );
      console.log("navigated to: " + projectName);
      // Set screen size.
      await page.setViewport({ width: 1080, height: 1024 });
      const selector = "#molecule-fully-render-puppeteer";

      // Wait for the element to be present in the DOM
      await page.waitForFunction(
        (selector) => !!document.querySelector(selector),
        { timeout: 120000 }, // Increase timeout to 2 minutes
        selector
      );
      // Wait a few seconds after the selector is found before taking the screenshot
      await new Promise((resolve) => setTimeout(resolve, 10000));

      await page.screenshot({
        path: `Puppet/images/${projectName}-Test.png`,
      });
      console.log(`Screenshot saved: Puppet/images/${projectName}-Test.png`);
    } catch (testError) {
      console.error(`Error testing ${projectName}: ${testError.message}`);
      hasErrors = true;
      // Create an error screenshot to replace any outdated ones
      await createErrorScreenshot(
        `Puppet/images/${projectName}-Test.png`,
        `${projectName} Test Failed`,
        testError.message
      );
    }

    // Try deployed version - skip if not available
    try {
      await page.goto(
        "https://abundance.maslowcnc.com" +
          "/run/" +
          projectUser +
          "/" +
          projectName,
        { timeout: 60000 } // Increase navigation timeout
      );
      // Wait for the element to be present in the DOM
      await page.waitForFunction(
        (selector) => !!document.querySelector(selector),
        { timeout: 120000 }, // Increase timeout to 2 minutes
        "#molecule-fully-render-puppeteer"
      );

      // Wait a bit for the page to load
      await new Promise((resolve) => setTimeout(resolve, 20000));

      await page.screenshot({
        path: `Puppet/images/${projectName}-Deployed.png`,
      });
      console.log(
        `Screenshot saved: Puppet/images/${projectName}-Deployed.png`
      );
    } catch (deployedError) {
      console.log(
        `Deployed version not available for ${projectName}: ${deployedError.message}`
      );
      // Create an informational screenshot for deployed version (not counted as error)
      await createErrorScreenshot(
        `Puppet/images/${projectName}-Deployed.png`,
        `${projectName} Deployed Unavailable`,
        "Deployed version could not be reached",
        true
      );
    }
  }

  // Navigate to main.html
  try {
    await page.goto(`file:${path.join(__dirname, "main.html")}`, {
      timeout: 30000,
    });

    // Wait a bit for the page to load
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await page.screenshot({
      path: `Puppet/images/main.png`,
    });
    console.log("Screenshot saved: Puppet/images/main.png");
  } catch (mainError) {
    console.error("Error taking main.html screenshot:", mainError.message);
    hasErrors = true;
    await createErrorScreenshot(
      `Puppet/images/main.png`,
      "Main Page Failed",
      mainError.message
    );
  }

  return hasErrors;
}
