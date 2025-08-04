import json
import boto3
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['BOOKING_REFERENCES_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function to handle booking reference queries
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract information from Lex event
        session_attributes = event.get('sessionAttributes', {})
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent'].get('slots', {})
        
        # Get booking reference from slot
        booking_reference = None
        if 'BookingReference' in slots and slots['BookingReference'] and slots['BookingReference']['value']:
            booking_reference = slots['BookingReference']['value']['interpretedValue']
        
        if not booking_reference:
            response_message = "Please provide your booking reference number so I can help you get your bike access code and rental details."
        else:
            response_message = get_booking_details(booking_reference)
        
        # Prepare response for Lex
        response = {
            'sessionState': {
                'dialogAction': {
                    'type': 'Close'
                },
                'intent': {
                    'name': intent_name,
                    'state': 'Fulfilled'
                }
            },
            'messages': [
                {
                    'contentType': 'PlainText',
                    'content': response_message
                }
            ]
        }
        
        logger.info(f"Sending response: {json.dumps(response)}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        
        error_response = {
            'sessionState': {
                'dialogAction': {
                    'type': 'Close'
                },
                'intent': {
                    'name': intent_name,
                    'state': 'Failed'
                }
            },
            'messages': [
                {
                    'contentType': 'PlainText',
                    'content': "I'm sorry, I encountered an error while retrieving your booking details. Please try again or contact support."
                }
            ]
        }
        
        return error_response

def get_booking_details(booking_reference):
    """
    Retrieve booking details from DynamoDB
    """
    try:
        # Query the booking references table
        response = table.get_item(
            Key={
                'booking_reference': booking_reference
            }
        )
        
        if 'Item' in response:
            item = response['Item']
            
            # Extract booking details
            bike_type = item.get('bike_type', 'N/A')
            bike_number = item.get('bike_number', 'N/A')
            access_code = item.get('access_code', 'N/A')
            start_time = item.get('start_time', 'N/A')
            end_time = item.get('end_time', 'N/A')
            rental_duration = item.get('rental_duration', 'N/A')
            status = item.get('status', 'active')
            
            if status.lower() == 'active':
                message = f"""✅ **Booking Details Found**

🔖 **Booking Reference:** {booking_reference}
🚲 **Bike Type:** {bike_type}
🏷️ **Bike Number:** {bike_number}
🔐 **Access Code:** {access_code}
⏰ **Rental Period:** {start_time} to {end_time}
⏱️ **Duration:** {rental_duration}

**Instructions:**
1. Locate bike #{bike_number}
2. Enter access code: {access_code}
3. Enjoy your ride!

Need help finding your bike or have any issues? Just let me know!"""
            else:
                message = f"""📋 **Booking Status Update**

🔖 **Booking Reference:** {booking_reference}
📊 **Status:** {status.title()}

This booking is no longer active. If you need assistance, please contact our support team or make a new booking."""
                
        else:
            message = f"""❌ **Booking Not Found**

I couldn't find any booking with reference: **{booking_reference}**

Please check:
✓ Your booking reference is correct
✓ The booking is still active
✓ You're logged in to the correct account

If you're still having trouble, please contact our support team for assistance."""
            
        return message
        
    except Exception as e:
        logger.error(f"Error retrieving booking details: {str(e)}")
        return f"I'm sorry, I couldn't retrieve the details for booking reference {booking_reference}. Please try again or contact support if the issue persists."