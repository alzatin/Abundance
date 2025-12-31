import boto3
import os
import json
from datetime import datetime


def lambda_handler(event: any, context: any):

    returnObject = {}

    # create a dynamodb client
    dynamodb = boto3.resource("dynamodb")
    # get the item from the table
    table_name = os.environ["TABLE_NAME"]
    table = dynamodb.Table(table_name)

    print(event)
    newDate = str(datetime.now().toordinal())

    try:
        owner = event["owner"]
        description = event["description"]
        repoName = event["repoName"]
        ranking = event["ranking"]
        searchField = event["searchField"]
        forks = event["forks"]
        topMoleculeID = event["topMoleculeID"]
        topics = event["topics"]
        readMe = event["readme"]
        contentURL = event["contentURL"]
        svgURL = event["svgURL"]
        dateCreated = event["dateCreated"]
        parentRepo = event["parentRepo"]
        githubMoleculesUsed = event["githubMoleculesUsed"]
        html_url = event["html_url"]
        dateModified = newDate

        newYear = datetime.now().year

        itemToPut = {"owner": owner,
                     "description": description,
                     "repoName": repoName,
                     "ranking": ranking,
                     "searchField": searchField,
                     "forks": forks,
                     "topMoleculeID": topMoleculeID,
                     "svgURL": svgURL,
                     "topics": topics,
                     "readMe": readMe,
                     "dateCreated": dateCreated,
                     "contentURL": contentURL,
                     "parentRepo": parentRepo,
                     "githubMoleculesUsed": githubMoleculesUsed,
                     "yyyy": newYear,
                     "html_url": html_url,
                     "dateModified": dateModified}

        table.put_item(Item=itemToPut)
        returnObject['statusCode'] = 200
        message = "Success put item"

    except:
        returnObject['statusCode'] = 400
        message = 'Something went wrong'

    returnObject['headers'] = {}
    returnObject["body"] = json.dumps(message)
    returnObject['headers']['Content-Type'] = 'application/json'

    return returnObject
