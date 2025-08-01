import boto3
import uuid
import json
from datetime import datetime

def lambda_handler(event, context):
    body = json.loads(event['body'])
    bike_id = body['bike_id']
    user_type = body['user_type']
    feedback_text = body['feedback']

    # Simple sentiment analysis
    positive_words = ['good', 'excellent', 'happy', 'great', 'satisfied', 'nice']
    negative_words = ['bad', 'poor', 'sad', 'terrible', 'unsatisfied', 'worse']

    feedback_lower = feedback_text.lower()
    score = sum(word in feedback_lower for word in positive_words) - sum(word in feedback_lower for word in negative_words)
    sentiment = "Positive" if score > 0 else "Negative" if score < 0 else "Neutral"

    feedback_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('BikeFeedback')

    table.put_item(
        Item={
            'bike_id': bike_id,
            'feedback_id': feedback_id,
            'user_type': user_type,
            'feedback': feedback_text,
            'sentiment': sentiment,
            'timestamp': timestamp
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Feedback submitted successfully', 'sentiment': sentiment})
    }
