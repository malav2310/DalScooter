import json
import boto3
from boto3.dynamodb.conditions import Key
import os

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])

def lambda_handler(event, context):
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        bike_type = query_params.get('type')
        
        if bike_type:
            # Filter by bike type
            response = bikes_table.query(
                IndexName='BikeTypeIndex',
                KeyConditionExpression=Key('bike_type').eq(bike_type)
            )
        else:
            # Get all bikes
            response = bikes_table.scan()
        
        bikes = response['Items']
        
        # Format response for frontend
        formatted_bikes = []
        for bike in bikes:
            formatted_bikes.append({
                'bike_id': bike['bike_id'],
                'bike_type': bike['bike_type'],
                'hourly_rate': float(bike.get('hourly_rate', 0)),
                'features': bike.get('features', []),
                'access_code': bike.get('access_code', ''),
                'available': bike.get('available', True),
                'location': bike.get('location', ''),
                'battery_life': bike.get('battery_life', 'N/A'),
                'height_adjustment': bike.get('height_adjustment', False)
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps({
                'bikes': formatted_bikes,
                'count': len(formatted_bikes)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
