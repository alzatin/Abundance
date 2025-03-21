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
  const octokit = new Octokit();

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

  let promises = items
    .filter((repo) => !repo.privateRepo)
    .map((repo) => {
      return checkGithub(
        repo.owner,
        repo.repoName,
        repo.forks,
        repo.lastFoundGit,
        repo.contentURL
      );
    });

  await Promise.all(promises).then((results) => {
    const response = {
      statusCode: 200,
      body: JSON.stringify("Github has been checked"),
    };
    return response;
  });

  async function checkUpdate(owner, repoName, forks, githubForks) {
    const input = {
      ExpressionAttributeValues: {
        ":forks": githubForks,
        ":lastFoundGit": today,
      },
      ReturnValues: "ALL_NEW",
      TableName: "abundance-projects",
      UpdateExpression: "SET lastFoundGit = :lastFoundGit,  forks = :forks",
      Key: {
        owner: owner,
        repoName: repoName,
      },
    };
    const command = new UpdateCommand(input);
    try {
      const response = await dynamo.send(command);
      return response;
    } catch (error) {
      console.error(error);
      throw error; // re-throw the error
    }
  }

  /* Makes request to github to check if repo exists, if it doesn't deletes from table, it it does updates in table*/
  async function checkGithub(owner, repoName, forks, lastFoundGit, contentURL) {
    const response = await fetch(contentURL);
    if (!response.ok) {
      console.log(owner + "," + repoName + "not found");
      //when was the last time it was found, compare times
      let currentTime = new Date();
      let expireTime = new Date(lastFoundGit);

      let minutes = (expireTime - currentTime) / (1000 * 60);
      let days = minutes / 1440;
      //remove from table if you haven't found in 3 days
      if (days < -3.5) {
        // deleting must be broken , alzatin projects getting randomly erased
        //deleteFromTable(owner, repoName);
      }
    } else {
      /*if repo exists fetch from github/ exceeding requests :( which is probably why delete was breaking)
      return octokit.rest.repos
      .get({
        owner: owner,
        repo: repoName,
      })
      .then((response) => {
        console.log(response)
        return checkUpdate(
          owner,
          repoName,
          forks,
          response.data.forks_count
        ).then((response) => {
          return response;
        });
      })*/
    }
  }
  /*Removes non existent repos from table */
  async function deleteFromTable(owner, repoName) {
    pushingToRecentlyDeletedTable(owner, repoName)
      .then(async () => {
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
      })
      .catch((error) => {
        console.error(error);
        throw error; // re-throw the error
      });
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
