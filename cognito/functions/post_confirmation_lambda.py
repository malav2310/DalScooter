import boto3

def lambda_handler(event, context):
    cognito = boto3.client("cognito-idp")
    cognito.admin_add_user_to_group(
        UserPoolId=event['userPoolId'],
        Username=event['userName'],
        GroupName='Users',
    )

    return event