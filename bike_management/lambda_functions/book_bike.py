import json
import boto3
from datetime import datetime, timedelta
import uuid
import os
from decimal import Decimal, ROUND_HALF_UP

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

# Custom JSON encoder to handle Decimal types for the final response
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            # Convert Decimal to a float for the JSON response to the frontend
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        bike_id = body['bike_id']
        customer_id = body['customer_id']
        start_date = body['start_date']
        end_date = body['end_date']
        
        # 1. Check if the bike exists
        bike_response = bikes_table.get_item(Key={'bike_id': bike_id})
        
        if 'Item' not in bike_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bike not found'})
            }
        
        bike = bike_response['Item']
        
        # 2. Check if the bike is marked as available
        if not bike.get('available', False):
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bike is currently unavailable for booking'})
            }
        
        # 3. Check for any conflicting bookings for the requested period
        booking_response = bookings_table.query(
            IndexName='BikeIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('bike_id').eq(bike_id)
        )
        
        requested_start = datetime.fromisoformat(start_date)
        requested_end = datetime.fromisoformat(end_date)

        for booking in booking_response['Items']:
            if booking.get('status') == 'active':
                booking_start = datetime.fromisoformat(booking['start_date'])
                booking_end = datetime.fromisoformat(booking['end_date'])
                
                # Check for time overlap
                if not (requested_end <= booking_start or requested_start >= booking_end):
                    return {
                        'statusCode': 409, # 409 Conflict is a better status code here
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Bike is already booked for this period'})
                    }
        
        # 4. Create the booking item using Decimal for numbers
        booking_id = str(uuid.uuid4())
        booking_reference = f"BOOK-{booking_id[:8].upper()}"
        
        # --- FIX: Perform calculations using Decimal ---
        
        # Calculate duration in hours as a Decimal
        duration_in_seconds = (requested_end - requested_start).total_seconds()
        duration_hours = Decimal(str(duration_in_seconds / 3600))
        
        # The hourly_rate from DynamoDB is already a Decimal.
        # Multiply two Decimal types for an exact result.
        total_cost = duration_hours * bike['hourly_rate']

        # Quantize to 2 decimal places for currency
        total_cost = total_cost.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        duration_hours = duration_hours.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # --- END OF FIX ---
        
        booking_item = {
            'booking_id': booking_id,
            'booking_reference': booking_reference,
            'customer_id': customer_id,
            'bike_id': bike_id,
            'start_date': start_date,
            'end_date': end_date,
            'booking_date': datetime.now().isoformat(),
            'duration_hours': duration_hours,  # This is a Decimal
            'total_cost': total_cost,          # This is a Decimal
            'status': 'active',
            'bike_type': bike.get('bike_type', 'N/A'),
            'access_code': bike.get('access_code', 'N/A')
        }
        
        bookings_table.put_item(Item=booking_item)
        
        # 5. Return a successful response
        return {
            'statusCode': 201, # 201 Created is the correct status code for a new resource
            'headers': {'Access-Control-Allow-Origin': '*'},
            # Use the custom DecimalEncoder to format the response for the frontend
            'body': json.dumps({
                'booking_id': booking_id,
                'booking_reference': booking_reference,
                'message': 'Booking created successfully',
                'total_cost': total_cost,
                'duration_hours': duration_hours,
                'access_code': bike.get('access_code')
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        # Log the full error for debugging
        print(f"An error occurred: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'An internal server error occurred.', 'details': str(e)})
        }
