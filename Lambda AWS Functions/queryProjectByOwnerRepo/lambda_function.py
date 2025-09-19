import boto3
import os
import json
from boto3.dynamodb.conditions import Key
import decimal


def lambda_handler(event, context):
    # Helper class to convert a DynamoDB item to JSON.
    class DecimalEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, decimal.Decimal):
                if o % 1 > 0:
                    return float(o)
                else:
                    return int(o)
            return super(DecimalEncoder, self).default(o)

    def build_response(status_code, body):
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': "*"
            },
            'body': json.dumps(body, cls=DecimalEncoder)
        }

    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["TABLE_NAME"]
    table = dynamodb.Table(table_name)

    # Get owner and reponame from query string parameters
    params = event.get('queryStringParameters', {})
    owner = params.get('owner')
    repoName = params.get('repoName')

    if not owner or not repoName:
        response_to_return = build_response(
            400, {"error": "Missing owner or repoName parameter"})
        print("RESPONSE:", response_to_return)
        return response_to_return

    try:
        # Query using both owner and repoName as key
        response = table.query(
            KeyConditionExpression=Key('owner').eq(
                owner) & Key('repoName').eq(repoName)
        )
        items = response.get('Items', [])
        if not items:
            response_to_return = build_response(
                404, {"error": "No matching item found"})
            print("RESPONSE:", response_to_return)
            return response_to_return
        # Return only the first matching item
        response_to_return = build_response(200, {"item": items[0]})
        print("RESPONSE:", response_to_return)
        return response_to_return
    except Exception as e:
        print('Error:', e)
        response_to_return = build_response(400, {"error": str(e)})
        print("RESPONSE:", response_to_return)
        return response_to_return
