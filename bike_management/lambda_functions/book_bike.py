import json
import boto3
from datetime import datetime, timedelta
import uuid
import os

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        bike_id = body['bike_id']
        customer_id = body['customer_id']
        start_date = body['start_date']
        end_date = body['end_date']
        
        # Check if bike exists and is available
        bike_response = bikes_table.get_item(Key={'bike_id': bike_id})
        
        if 'Item' not in bike_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bike not found'})
            }
        
        bike = bike_response['Item']
        
        if not bike.get('available', False):
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bike not available'})
            }
        
        # Check for conflicting bookings
        booking_response = bookings_table.query(
            IndexName='BikeIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_id').eq(bike_id)
        )
        
        for booking in booking_response['Items']:
            if booking['status'] == 'active':
                booking_start = datetime.fromisoformat(booking['start_date'])
                booking_end = datetime.fromisoformat(booking['end_date'])
                requested_start = datetime.fromisoformat(start_date)
                requested_end = datetime.fromisoformat(end_date)
                
                if not (requested_end <= booking_start or requested_start >= booking_end):
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Bike already booked for this period'})
                    }
        
        # Create booking
        booking_id = str(uuid.uuid4())
        booking_reference = f"BOOK-{booking_id[:8].upper()}"
        
        # Calculate duration and total cost
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        duration_hours = (end_dt - start_dt).total_seconds() / 3600
        total_cost = duration_hours * float(bike['hourly_rate'])
        
        booking_item = {
            'booking_id': booking_id,
            'booking_reference': booking_reference,
            'customer_id': customer_id,
            'bike_id': bike_id,
            'start_date': start_date,
            'end_date': end_date,
            'booking_date': datetime.now().isoformat(),
            'duration_hours': duration_hours,
            'total_cost': total_cost,
            'status': 'active',
            'bike_type': bike['bike_type'],
            'access_code': bike['access_code']
        }
        
        bookings_table.put_item(Item=booking_item)
        
        return {
            'statusCode': 201,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'booking_id': booking_id,
                'booking_reference': booking_reference,
                'message': 'Booking created successfully',
                'total_cost': total_cost,
                'duration_hours': duration_hours,
                'access_code': bike['access_code']
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
