//ENTER YOUR GITHUB CREDENTIALS TO TEST PUPPETEER AND CHANGE PROJECTS TO TEST TO PROJECTS THAT EXIST FOR THAT SPECIFIC USER

//const envUserValue = "";
//const envPassValue = "";

const projectUser = "moatmaslow";

const puppeteer = require("puppeteer");
const projects_to_test = require("./projects_to_test.js");

// Launch the browser and open a new blank page
//for each project in projects to test lauch puppeteer

(async () => {
  for (const project of projects_to_test) {
    await loadPuppeterAndExec("http://localhost:4444", project, "Test");

    await loadPuppeterAndExec(
      "https://barboursmith.github.io/Abundance",
      project,
      "Deployed"
    );
  }
})();

async function loadPuppeterAndExec(url, projectName, photoLabel) {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  // Navigate the page to a URL.
  //await page.goto("https://barboursmith.github.io/Abundance/");
  await page.goto(url + "/run/" + projectUser + "/" + projectName);

  // Set screen size.
  await page.setViewport({ width: 1080, height: 1024 });

  /*//  Authentication workflow - when not in run mode
  Wait and click on login button.
  await page.waitForSelector("#loginButton");
  await page.click("#loginButton");
  // Wait and click on login button.
  await page.waitForSelector(
    "body > div > main > section > div > div > div > div > form > button"
  );
  await page.click(
    "body > div > main > section > div > div > div > div > form > button"
  );
  await page.waitForSelector('input[id="login_field"]');
  await page.waitForSelector('input[id="password"]');
  await page.waitForSelector(
    "#login > div.auth-form-body.mt-3 > form > div > input.btn.btn-primary.btn-block.js-sign-in-button"
  );

  if (envUserValue) {
    await page.type('input[id="login_field"]', String(envUserValue));
  } else {
    console.warn("No GITHUB_USER environment variable set.");
  }
  await page.type('input[id="password"]', String(envPassValue));
  await page.click(
    "#login > div.auth-form-body.mt-3 > form > div > input.btn.btn-primary.btn-block.js-sign-in-button"
  );
  await page.waitForSelector(".project-item-div");
  await page.click(`#${projectName}`);*/

  const selector = "#molecule-fully-render-puppeteer";
  await page.waitForFunction(
    (selector) => !!document.querySelector(selector),
    {},
    selector
  );

  await page.screenshot({
    path: `Puppet/images/${projectName}-${photoLabel}.png`,
  });
  console.log(`Puppet/images/${projectName}-${photoLabel}.png`);

  await browser.close();
}
