import json
import boto3
from datetime import datetime
import uuid
import os
from decimal import Decimal, ROUND_HALF_UP

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Initialize DynamoDB tables from environment variables
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])
# NEW: Table for chatbot booking references
booking_refs_table = dynamodb.Table(os.environ['BOOKING_REFERENCES_TABLE'])

# NEW: ARN for the notification Lambda
NOTIFICATION_PROCESSOR_ARN = os.environ['NOTIFICATION_PROCESSOR_ARN']


# Custom JSON encoder to handle Decimal types for the final response
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)


def send_booking_notification(booking_details):
    """
    Asynchronously invokes the notification Lambda to send a booking confirmation.
    """
    try:
        payload = {
            'notificationType': 'BOOKING_CONFIRMATION',
            'userId': booking_details['customer_id'],
            'userEmail': booking_details['customer_email'],
            'messageData': {
                'userName': booking_details.get('customer_name', 'Customer'), # Assuming you might pass a name
                'bookingReference': booking_details['booking_reference'],
                'bikeType': booking_details['bike_type'],
                'startTime': booking_details['start_date'],
                'endTime': booking_details['end_date']
            }
        }
        
        lambda_client.invoke(
            FunctionName=NOTIFICATION_PROCESSOR_ARN,
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(payload)
        )
        print(f"Successfully invoked notification lambda for booking: {booking_details['booking_reference']}")
        
    except Exception as e:
        # Log the error but do not fail the main booking process
        print(f"ERROR: Failed to invoke notification lambda: {e}")


def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        bike_id = body['bike_id']
        customer_id = body['customer_id']
        # NEW: Email is required for notifications
        customer_email = body['customer_email'] 
        start_date = body['start_date']
        end_date = body['end_date']
        
        # 1. Check if the bike exists
        bike_response = bikes_table.get_item(Key={'bike_id': bike_id})
        
        if 'Item' not in bike_response:
            return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Bike not found'})}
        
        bike = bike_response['Item']
        
        # 2. Check if the bike is marked as available
        if not bike.get('available', False):
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Bike is currently unavailable for booking'})}
        
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
                
                if not (requested_end <= booking_start or requested_start >= booking_end):
                    return {'statusCode': 409, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Bike is already booked for this period'})}
        
        # 4. Create the booking item
        booking_id = str(uuid.uuid4())
        booking_reference = f"BOOK-{booking_id[:8].upper()}"
        
        duration_in_seconds = (requested_end - requested_start).total_seconds()
        duration_hours = Decimal(str(duration_in_seconds / 3600)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_cost = (duration_hours * bike['hourly_rate']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

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
            'bike_type': bike.get('bike_type', 'N/A'),
            'access_code': bike.get('access_code', 'N/A')
        }
        
        # --- DATABASE WRITE 1: Main bookings table ---
        bookings_table.put_item(Item=booking_item)
        
        # --- DATABASE WRITE 2: Chatbot reference table ---
        booking_reference_item = {
            'booking_reference': booking_reference, # Partition Key
            'bike_type': bike.get('bike_type', 'N/A'),
            'bike_number': bike.get('bike_number', bike_id),
            'access_code': bike.get('access_code', 'N/A'),
            'start_time': start_date,
            'end_time': end_date,
            'rental_duration': f"{duration_hours} hours",
            'status': 'active'
        }
        booking_refs_table.put_item(Item=booking_reference_item)
        
        # --- SEND NOTIFICATION ---
        notification_details = {
            'customer_id': customer_id,
            'customer_email': customer_email,
            'booking_reference': booking_reference,
            'bike_type': bike.get('bike_type', 'N/A'),
            'start_date': start_date,
            'end_date': end_date
        }
        send_booking_notification(notification_details)

        # 5. Return a successful response
        return {
            'statusCode': 201,
            'headers': {'Access-Control-Allow-Origin': '*'},
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
        print(f"An error occurred: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'An internal server error occurred.', 'details': str(e)})
        }
