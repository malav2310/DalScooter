import boto3
def lambda_handler(event, context):
    challenge_type = event['request']['privateChallengeParameters']['challenge_type']
    given_answer = event['request']['challengeAnswer']
    correct = False

    if challenge_type == 'PASSWORD':
        cognito = boto3.client('cognito-idp')
        client_id = event['request']['clientMetadata']['CLIENT_ID']
        try:
            cognito.admin_initiate_auth(
                UserPoolId=event['userPoolId'],
                ClientId=client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': event['userName'],
                    'PASSWORD': given_answer
                }
            )
            correct = True
        except cognito.exceptions.NotAuthorizedException:
            correct = False
    elif challenge_type == 'CHALLENGE_QUESTION' or challenge_type == 'CAESAR':
        expected_answer = event['request']['privateChallengeParameters']['answer']
        correct = (given_answer == expected_answer)
    
    event['response']['answerCorrect'] = correct
    return event