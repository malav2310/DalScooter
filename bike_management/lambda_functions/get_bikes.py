import json
import boto3
from boto3.dynamodb.conditions import Key
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])

# Add this class to handle Decimals in the JSON response
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        bike_type = query_params.get('type')
        
        if bike_type:
            response = bikes_table.query(
                IndexName='BikeTypeIndex',
                KeyConditionExpression=Key('bike_type').eq(bike_type)
            )
        else:
            response = bikes_table.scan()
        
        bikes = response['Items']
        
        formatted_bikes = []
        for bike in bikes:
            # FIX: Use .get() to prevent crashing on missing keys
            formatted_bikes.append({
                'bike_id': bike.get('bike_id'),
                'bike_type': bike.get('bike_type', 'N/A'), # Provide default if missing
                'hourly_rate': bike.get('hourly_rate', 0),
                'features': bike.get('features', []),
                'access_code': bike.get('access_code', ''),
                'available': bike.get('available', True),
                'location': bike.get('location', ''),
                'battery_life': bike.get('battery_life', 'N/A'),
                'height_adjustment': bike.get('height_adjustment', False)
            })
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            # Use the DecimalEncoder to properly format numbers
            'body': json.dumps({
                'bikes': formatted_bikes,
                'count': len(formatted_bikes)
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
