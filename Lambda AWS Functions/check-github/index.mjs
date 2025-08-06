import { Octokit } from "@octokit/rest";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const date = new Date();
const today = date.toISOString();

const tableName = "abundance-projects";
const recentlyDeletedTable = "recently-deleted-abundance";

export const handler = async (event, context) => {
  const octokit = new Octokit({
    auth: process.env.GIT_ACCESS,
  });

  let updatedCount = 0; // Counter for updated projects
  let deletedProjects = []; // Array to store deleted project names
  let notFoundProjects = []; // Array to store not found project names

  /*Scans parameter to returns attributes owner, repoName, fork from all repositories in table*/
  const command = new ScanCommand({
    ProjectionExpression:
      "#ow, #repoName, #forks, #lastFoundGit, #privateRepo, #contentURL",
    ExpressionAttributeNames: {
      "#ow": "owner",
      "#repoName": "repoName",
      "#forks": "forks",
      "#lastFoundGit": "lastFoundGit",
      "#privateRepo": "privateRepo",
      "#contentURL": "contentURL",
    },
    TableName: tableName,
  });

  const tableItems = await dynamo.send(command);

  var items = [];

  const scanExecute = async () => {
    try {
      let result;
      do {
        result = await dynamo.send(command);
        items = items.concat(result.Items);
        command.ExclusiveStartKey = result.LastEvaluatedKey;
      } while (result.LastEvaluatedKey);
      return items;
    } catch (err) {
      throw err;
    }
  };

  items = await scanExecute();

  console.log("Items to check:", items.length);
  await checkRateLimit();

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Batch processing to avoid DynamoDB throttling
  const BATCH_SIZE = 5; // Number of repositories to process in parallel per batch
  const BATCH_DELAY_MS = 500; // Delay in milliseconds between each batch

  let reposToCheck = items.filter((repo) => !repo.privateRepo);
  for (let i = 0; i < reposToCheck.length; i += BATCH_SIZE) {
    const batch = reposToCheck.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((repo) =>
        checkGithub(
          repo.owner,
          repo.repoName,
          repo.forks,
          repo.lastFoundGit,
          repo.contentURL
        )
      )
    );
    if (i + BATCH_SIZE < reposToCheck.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`Projects updated: ${updatedCount}`);
  if (deletedProjects.length > 0) {
    console.log(
      `Projects deleted: ${deletedProjects.length} (${deletedProjects.join(
        ", "
      )})`
    );
  } else {
    console.log("No projects deleted.");
  }
  if (notFoundProjects.length > 0) {
    console.log(
      `Projects not found: ${notFoundProjects.length} (${notFoundProjects.join(
        ", "
      )})`
    );
  } else {
    console.log("All projects found.");
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify("Github has been checked"),
  };
  return response;

  async function checkUpdate(owner, repoName, forks, githubForks) {
    const input = {
      ExpressionAttributeValues: {
        ":forks": githubForks,
        ":lastFoundGit": today,
      },
      ReturnValues: "ALL_NEW",
      TableName: "abundance-projects",
      UpdateExpression:
        "SET lastFoundGit = :lastFoundGit, forks = :forks REMOVE failureCount",
      Key: {
        owner: owner,
        repoName: repoName,
      },
    };
    const command = new UpdateCommand(input);
    try {
      const response = await dynamo.send(command);
      updatedCount++; // Increment counter on successful update
      return response;
    } catch (error) {
      console.error(error);
      throw error; // re-throw the error
    }
  }

  /* Checks the rate limit of the GitHub API */
  async function checkRateLimit() {
    const response = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${process.env.GIT_ACCESS}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch rate limit status.");
      return null;
    }

    const data = await response.json();
    console.log("Rate Limit Status:", data);
    return data;
  }

  /* Makes request to github to check if repo exists, if it doesn't deletes from table, it it does updates in table*/
  async function checkGithub(owner, repoName, forks, lastFoundGit, contentURL) {
    const failureCountKey = "failureCount";

    try {
      // Use Octokit to check if repo exists
      const repoResponse = await octokit.rest.repos.get({
        owner: owner,
        repo: repoName,
      });
      // Update repository details and reset failure count in one call
      return checkUpdate(owner, repoName, forks, repoResponse.data.forks_count);
    } catch (error) {
      if (error.status === 404) {
        console.log(`Project not found: ${owner}/${repoName}`);
        notFoundProjects.push(`${owner}/${repoName}`);
        // Fetch current failure count from DynamoDB
        const getParams = {
          TableName: tableName,
          Key: {
            owner: owner,
            repoName: repoName,
          },
          ProjectionExpression: failureCountKey,
        };
        const getCommand = new GetCommand(getParams);
        const getResponse = await dynamo.send(getCommand);
        const currentFailureCount = getResponse.Item?.[failureCountKey] || 0;

        // Increment failure count
        const newFailureCount = currentFailureCount + 1;
        // Delete from table if failure count reaches 3
        if (newFailureCount >= 3) {
          console.log(
            `Deleting project after 3 consecutive failures: ${owner}/${repoName}`
          );
          deletedProjects.push(`${owner}/${repoName}`);
          await deleteFromTable(owner, repoName);
        } else {
          const updateParams = {
            TableName: tableName,
            Key: {
              owner: owner,
              repoName: repoName,
            },
            UpdateExpression: `SET ${failureCountKey} = :failureCount`,
            ExpressionAttributeValues: {
              ":failureCount": newFailureCount,
            },
          };
          const updateCommand = new UpdateCommand(updateParams);
          await dynamo.send(updateCommand);
        }
      } else {
        // Log and rethrow unexpected errors
        console.error(`Error checking repo ${owner}/${repoName}:`, error);
        throw error;
      }
    }
  }
  /*Removes non existent repos from table */
  async function deleteFromTable(owner, repoName) {
    try {
      await pushingToRecentlyDeletedTable(owner, repoName);
      const params = {
        TableName: tableName,
        Key: {
          owner: owner,
          repoName: repoName,
        },
      };
      const command = new DeleteCommand(params);
      console.log("deleting item" + owner + "/" + repoName);
      return await dynamo.send(command);
    } catch (error) {
      console.error(error);
      throw error; // re-throw the error
    }
  }
  async function pushingToRecentlyDeletedTable(owner, repoName) {
    // push to recently deleted table
    const params2 = {
      TableName: tableName,
      Key: {
        owner: owner,
        repoName: repoName,
      },
    };
    const getCommand = new GetCommand(params2);
    const responseGet = await dynamo.send(getCommand); //delete from abundance-projects table
    responseGet.Item["deletedAt"] = today;

    const commandPut = new PutCommand({
      TableName: "recently-deleted-abundance",
      Item: responseGet.Item,
    });
    const responsePut = await dynamo.send(commandPut);
    return responsePut;
  }
};
