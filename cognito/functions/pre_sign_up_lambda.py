import boto3
def lambda_handler(event, context):
    event['response']['autoConfirmUser'] = True
    metadata = event['request']['clientMetadata']

    dynamo = boto3.client('dynamodb')
    
    item = {
        'userId': {
            'S': event['userName']
        },
        'challengeQuestion': {
            'S': metadata['challenge_question']
        },
        'challengeAnswer': {
            'S': metadata['challenge_answer']
        },
        'caesarKey': {
            'N': metadata['caesar_key']
        }
    }

    dynamo.put_item(TableName='UserChallenges', Item=item)

    return event