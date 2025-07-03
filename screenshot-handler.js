const fs = require('fs');
const path = require('path');

module.exports = async function handleScreenshots({ github, context }) {
  const screenshotDir = 'Puppet/images';
  let files = [];
  try {
    files = fs.readdirSync(screenshotDir).filter(file => file.endsWith('.png'));
  } catch (e) {
    console.log('Screenshot directory not found or empty');
  }

  const branchName = `screenshots-pr-${context.issue.number}`;
  const isFromFork = context.payload.pull_request?.head?.repo?.full_name !== context.payload.pull_request?.base?.repo?.full_name;
  const targetOwner = isFromFork ? context.payload.pull_request.head.repo.owner.login : context.repo.owner;
  const targetRepo = isFromFork ? context.payload.pull_request.head.repo.name : context.repo.repo;

  console.log(`Using target repository: ${targetOwner}/${targetRepo}`);

  // Create or update the screenshots branch
  try {
    let branchRef;
    try {
      branchRef = await github.rest.git.getRef({
        owner: targetOwner,
        repo: targetRepo,
        ref: `heads/${branchName}`
      });
    } catch (error) {
      // Branch doesn't exist, create it
      const mainRef = await github.rest.git.getRef({
        owner: targetOwner,
        repo: targetRepo,
        ref: 'heads/main'
      });
      branchRef = await github.rest.git.createRef({
        owner: targetOwner,
        repo: targetRepo,
        ref: `refs/heads/${branchName}`,
        sha: mainRef.data.object.sha
      });
    }

    console.log(`Screenshots branch created or updated: ${branchName}`);
  } catch (branchError) {
    console.log(`Failed to create/update screenshots branch: ${branchError.message}`);
    return;
  }

  // Upload each screenshot to the branch
  const screenshotUrls = {};
  for (const file of files) {
    const filePath = path.join(screenshotDir, file);
    const fileContent = fs.readFileSync(filePath);
    const base64Content = fileContent.toString('base64');

    try {
      // Check if file already exists
      let existingFile;
      try {
        existingFile = await github.rest.repos.getContent({
          owner: targetOwner,
          repo: targetRepo,
          path: `screenshots/${file}`,
          ref: branchName
        });
      } catch (error) {
        // File doesn't exist, that's fine
      }

      await github.rest.repos.createOrUpdateFileContents({
        owner: targetOwner,
        repo: targetRepo,
        path: `screenshots/${file}`,
        message: `Add screenshot ${file} for PR #${context.issue.number}`,
        content: base64Content,
        branch: branchName,
        sha: existingFile ? existingFile.data.sha : undefined
      });

      // Generate GitHub raw URL
      screenshotUrls[file] = `https://raw.githubusercontent.com/${targetOwner}/${targetRepo}/${branchName}/screenshots/${file}`;
    } catch (uploadError) {
      console.log(`Failed to upload ${file}: ${uploadError.message}`);
      screenshotUrls[file] = null;
    }
  }

  console.log('Uploaded screenshots:', screenshotUrls);
};