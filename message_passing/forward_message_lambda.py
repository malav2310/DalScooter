import boto3
import os

def lambda_handler(event, context):
    table_name = os.environ["dynamodb_table_name"]
    
    dynamo = boto3.client('dynamodb')

    msg = event['Records'][0]['Sns']
    body = msg['Message']
    ref_code = msg['MessageAttributes']['referenceCode']['Value']

    print('Feedback recieved:')
    print(f'Reference Code: {ref_code}')
    print(f'Feedback Body: {body}')

    item = {
        'messageBody': {
            'S': body
        },
        'referenceCode': {
            'S': ref_code
        }
    }

    dynamo.put_item(TableName=table_name, Item=item)
