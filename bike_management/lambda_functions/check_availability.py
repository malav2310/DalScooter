import json
import boto3
from datetime import datetime
import os
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

# Custom JSON encoder to handle Decimal types for the final response
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        bike_type = query_params.get('type')
        start_date = query_params.get('start_date')
        end_date = query_params.get('end_date')
        
        # Query for bikes based on type or get all bikes
        if bike_type:
            bikes_response = bikes_table.query(
                IndexName='BikeTypeIndex',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_type').eq(bike_type)
            )
        else:
            bikes_response = bikes_table.scan()
        
        available_bikes = []
        
        for bike in bikes_response['Items']:
            # FIX 1: Safely get the bike_id and skip if it's missing (corrupted data)
            bike_id = bike.get('bike_id')
            if not bike_id:
                print(f"Skipping corrupted item without bike_id: {bike}")
                continue

            # Skip if the bike is explicitly marked as unavailable
            if not bike.get('available', False):
                continue
                
            # If dates are provided, check for booking conflicts
            if start_date and end_date:
                is_available_in_period = check_bike_availability(bike_id, start_date, end_date)
                if not is_available_in_period:
                    continue
            
            # FIX 2: Use .get() for all attributes to prevent KeyErrors
            available_bikes.append({
                'bike_id': bike_id,
                'bike_type': bike.get('bike_type', 'N/A'),
                'hourly_rate': bike.get('hourly_rate', 0),
                'location': bike.get('location', ''),
                'features': bike.get('features', []),
                'battery_life': bike.get('battery_life', 'Standard'),
                'height_adjustment': bike.get('height_adjustment', False)
            })
        
        # FIX 3: Use the custom DecimalEncoder in the JSON response
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'available_bikes': available_bikes,
                'count': len(available_bikes)
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'An internal server error occurred.', 'details': str(e)})
        }


def check_bike_availability(bike_id, start_date, end_date):
    """
    Checks if a specific bike has any conflicting active bookings in the given time range.
    Returns True if available, False otherwise.
    """
    try:
        bookings_response = bookings_table.query(
            IndexName='BikeIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_id').eq(bike_id)
        )
        
        requested_start = datetime.fromisoformat(start_date)
        requested_end = datetime.fromisoformat(end_date)
        
        for booking in bookings_response['Items']:
            if booking.get('status') != 'active':
                continue
                
            booking_start = datetime.fromisoformat(booking['start_date'])
            booking_end = datetime.fromisoformat(booking['end_date'])
            
            # Check for overlap: it's booked if the requested period is not completely
            # before or completely after the existing booking.
            if not (requested_end <= booking_start or requested_start >= booking_end):
                return False # Found a conflict, so it's not available
        
        return True # No conflicts found
        
    except Exception as e:
        print(f"Error checking bike availability for {bike_id}: {e}")
        return False # Assume not available if an error occurs
