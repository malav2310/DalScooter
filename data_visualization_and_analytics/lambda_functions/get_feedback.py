import boto3
import json

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('BikeFeedback')

    # Scan the entire table to get all feedbacks
    response = table.scan()

    feedback_items = response.get('Items', [])

    # Handle pagination if needed
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        feedback_items.extend(response.get('Items', []))

    return {
        'statusCode': 200,
        'body': json.dumps(feedback_items)
    }
