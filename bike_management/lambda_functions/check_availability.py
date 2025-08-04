import json
import boto3
from datetime import datetime
import os

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

def lambda_handler(event, context):
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        bike_type = query_params.get('type')
        start_date = query_params.get('start_date')
        end_date = query_params.get('end_date')
        
        if bike_type:
            bikes_response = bikes_table.query(
                IndexName='BikeTypeIndex',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_type').eq(bike_type)
            )
        else:
            bikes_response = bikes_table.scan()
        
        available_bikes = []
        
        for bike in bikes_response['Items']:
            if not bike.get('available', False):
                continue
                
            # Check if bike is available for the requested period
            if start_date and end_date:
                is_available = check_bike_availability(bike['bike_id'], start_date, end_date)
                if not is_available:
                    continue
            
            available_bikes.append({
                'bike_id': bike['bike_id'],
                'bike_type': bike['bike_type'],
                'hourly_rate': float(bike.get('hourly_rate', 0)),
                'location': bike.get('location', ''),
                'features': bike.get('features', []),
                'battery_life': bike.get('battery_life', 'Standard'),
                'height_adjustment': bike.get('height_adjustment', False)
            })
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'available_bikes': available_bikes,
                'count': len(available_bikes)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def check_bike_availability(bike_id, start_date, end_date):
    try:
        bookings_response = bookings_table.query(
            IndexName='BikeIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_id').eq(bike_id)
        )
        
        requested_start = datetime.fromisoformat(start_date)
        requested_end = datetime.fromisoformat(end_date)
        
        for booking in bookings_response['Items']:
            if booking['status'] != 'active':
                continue
                
            booking_start = datetime.fromisoformat(booking['start_date'])
            booking_end = datetime.fromisoformat(booking['end_date'])
            
            # Check for overlap
            if not (requested_end <= booking_start or requested_start >= booking_end):
                return False
        
        return True
        
    except Exception:
        return False
