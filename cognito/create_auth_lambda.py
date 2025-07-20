import boto3
import random
def lambda_handler(event, context):
    dynamo = boto3.client('dynamodb')
    username = event['userName']
    OFFSET = ord('A')

    key = {
        'userId': {
            'S': username
        }
    }

    item = dynamo.get_item(TableName='UserChallenges', Key=key)
    question = item['Item']['challengeQuestion']['S']
    answer = item['Item']['challengeAnswer']['S']
    caesar_key = int(item['Item']['caesarKey']['N'])

    if len(event['request']['session']) == 0:
        event['response']['publicChallengeParameters'] = {
            'prompt': 'Enter your password'
        }
        event['response']['privateChallengeParameters'] = {
            'challenge_type': 'PASSWORD'
        }
    elif len(event['request']['session']) == 1:
        event['response']['publicChallengeParameters'] = {
            'prompt': 'Please answer this security question:',
            'question': question
        }
        event['response']['privateChallengeParameters'] = {
            'challenge_type': 'CHALLENGE_QUESTION',
            'answer': answer
        }
    elif len(event['request']['session']) == 2:
        vals = [x for x in range(26)]
        random_vals = [random.choice(vals) for _ in range(5)]

        challenge_string = ''.join(chr(x + OFFSET) for x in random_vals)
        answer_string = ''.join(chr(((x + caesar_key) % 26) + OFFSET) for x in random_vals)
        event['response']['publicChallengeParameters'] = {
            'prompt': 'Please apply your caesar cipher to this string:',
            'question': challenge_string
        }
        event['response']['privateChallengeParameters'] = {
            'challenge_type': 'CAESAR',
            'answer': answer_string
        }

    return event