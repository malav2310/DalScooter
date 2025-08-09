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
    print(f"🔍 HANDLER START - Received event: {json.dumps(event)}")
    
    try:
        # Extract information from Lex event
        session_attributes = event.get('sessionAttributes', {})
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent'].get('slots', {})
        
        print(f"📋 INTENT NAME: {intent_name}")
        print(f"📋 ALL SLOTS: {json.dumps(slots)}")
        
        # Get booking reference from slot
        booking_reference = None
        if 'BookingReference' in slots and slots['BookingReference'] and slots['BookingReference']['value']:
            booking_reference = slots['BookingReference']['value']['interpretedValue']
            print(f"✅ BOOKING REFERENCE EXTRACTED: '{booking_reference}'")
            print(f"✅ BOOKING REFERENCE TYPE: {type(booking_reference)}")
            print(f"✅ BOOKING REFERENCE LENGTH: {len(booking_reference)}")
        else:
            print("❌ NO BOOKING REFERENCE FOUND IN SLOTS")
        
        if not booking_reference:
            response_message = "Please provide your booking reference number so I can help you get your bike access code and rental details."
            print(f"🚫 NO BOOKING REF - Response: {response_message}")
        else:
            print(f"🔄 CALLING get_booking_details with: '{booking_reference}'")
            response_message = get_booking_details(booking_reference)
            print(f"📤 RESPONSE FROM get_booking_details: {response_message}")
        
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
        
        print(f"📨 FINAL LEX RESPONSE: {json.dumps(response)}")
        return response
        
    except Exception as e:
        print(f"💥 ERROR IN HANDLER: {str(e)}")
        print(f"💥 ERROR TYPE: {type(e)}")
        import traceback
        print(f"💥 FULL TRACEBACK: {traceback.format_exc()}")
        
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
    Retrieve booking details from DynamoDB using case-insensitive matching
    by scanning the table and comparing lowercase versions
    """
    print(f"🔍 GET_BOOKING_DETAILS START - Input: '{booking_reference}'")
    
    try:
        # Clean up input and convert to lowercase for comparison
        input_ref_lower = booking_reference.strip().lower()
        print(f"🧹 CLEANED INPUT: '{input_ref_lower}'")
        print(f"🏢 TABLE NAME: {table_name}")
        
        # Since we need case-insensitive matching on partition key, we need to scan
        print("🔄 STARTING TABLE SCAN...")
        response = table.scan()
        print(f"📊 SCAN RESPONSE KEYS: {list(response.keys())}")
        print(f"📊 ITEMS COUNT IN FIRST PAGE: {len(response.get('Items', []))}")
        
        if 'Items' in response:
            print(f"📋 FIRST FEW ITEMS SAMPLE:")
            for i, item in enumerate(response['Items'][:3]):  # Show first 3 items
                stored_ref = item.get('booking_reference', 'NO_REF')
                print(f"   Item {i}: booking_reference = '{stored_ref}' (lowercase: '{stored_ref.lower()}')")
        
        # Search through all items for case-insensitive match
        matching_item = None
        items_checked = 0
        
        for item in response.get('Items', []):
            items_checked += 1
            stored_ref = item.get('booking_reference', '')
            stored_ref_lower = stored_ref.lower()
            
            if items_checked <= 5:  # Log first 5 comparisons
                print(f"🔍 COMPARING: '{input_ref_lower}' == '{stored_ref_lower}' ? {input_ref_lower == stored_ref_lower}")
            
            if stored_ref_lower == input_ref_lower:
                matching_item = item
                print(f"✅ MATCH FOUND! Stored: '{stored_ref}' matches input: '{booking_reference}'")
                print(f"✅ MATCHING ITEM: {json.dumps(matching_item, default=str)}")
                break
        
        print(f"📊 TOTAL ITEMS CHECKED IN FIRST PAGE: {items_checked}")
        
        # Handle pagination if table has more than 1MB of data
        pages_scanned = 1
        while 'LastEvaluatedKey' in response and not matching_item:
            print(f"📄 SCANNING PAGE {pages_scanned + 1}...")
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            pages_scanned += 1
            
            for item in response.get('Items', []):
                items_checked += 1
                stored_ref = item.get('booking_reference', '')
                stored_ref_lower = stored_ref.lower()
                
                if stored_ref_lower == input_ref_lower:
                    matching_item = item
                    print(f"✅ MATCH FOUND ON PAGE {pages_scanned}! Stored: '{stored_ref}' matches input: '{booking_reference}'")
                    print(f"✅ MATCHING ITEM: {json.dumps(matching_item, default=str)}")
                    break
        
        print(f"📊 TOTAL PAGES SCANNED: {pages_scanned}")
        print(f"📊 TOTAL ITEMS CHECKED: {items_checked}")
        
        if not matching_item:
            print("❌ NO MATCHING ITEM FOUND")
            return (
                f"❌ **Booking Not Found**\n\n"
                f"I couldn't find any booking with reference: **{booking_reference}**\n\n"
                "Please check:\n"
                "✓ Your booking reference is correct\n"
                "✓ The booking is still active\n"
                "✓ You're logged in to the correct account\n\n"
                "If you're still having trouble, please contact our support team for assistance."
            )
        
        print("🎯 EXTRACTING BOOKING DETAILS...")
        
        # Extract booking details from matching item
        bike_type = matching_item.get('bike_type', 'N/A')
        bike_number = matching_item.get('bike_number', 'N/A')
        access_code = matching_item.get('access_code', 'N/A')
        start_time = matching_item.get('start_time', 'N/A')
        end_time = matching_item.get('end_time', 'N/A')
        rental_duration = matching_item.get('rental_duration', 'N/A')
        status = matching_item.get('status', 'active').lower()
        
        print(f"🚲 EXTRACTED - bike_type: {bike_type}")
        print(f"🚲 EXTRACTED - bike_number: {bike_number}")
        print(f"🚲 EXTRACTED - access_code: {access_code}")
        print(f"🚲 EXTRACTED - status: {status}")
        
        # Use the original stored booking reference in response
        original_booking_ref = matching_item.get('booking_reference', booking_reference)
        print(f"🔖 ORIGINAL BOOKING REF: {original_booking_ref}")
        
        if status == 'active':
            success_message = (
                f"✅ **Booking Details Found**\n\n"
                f"🔖 **Booking Reference:** {original_booking_ref}\n"
                f"🚲 **Bike Type:** {bike_type}\n"
                f"🏷️ **Bike Number:** {bike_number}\n"
                f"🔐 **Access Code:** {access_code}\n"
                f"⏰ **Rental Period:** {start_time} to {end_time}\n"
                f"⏱️ **Duration:** {rental_duration}\n\n"
                "**Instructions:**\n"
                f"1. Locate bike #{bike_number}\n"
                f"2. Enter access code: {access_code}\n"
                "3. Enjoy your ride!\n\n"
                "Need help finding your bike or have any issues? Just let me know!"
            )
            print(f"✅ SUCCESS MESSAGE CREATED: {success_message}")
            return success_message
        else:
            inactive_message = (
                f"📋 **Booking Status Update**\n\n"
                f"🔖 **Booking Reference:** {original_booking_ref}\n"
                f"📊 **Status:** {status.title()}\n\n"
                "This booking is no longer active. If you need assistance, "
                "please contact our support team or make a new booking."
            )
            print(f"📋 INACTIVE MESSAGE CREATED: {inactive_message}")
            return inactive_message
            
    except Exception as e:
        print(f"💥 ERROR IN get_booking_details: {str(e)}")
        print(f"💥 ERROR TYPE: {type(e)}")
        import traceback
        print(f"💥 FULL TRACEBACK: {traceback.format_exc()}")
        
        return (
            f"I'm sorry, I couldn't retrieve the details for booking reference "
            f"{booking_reference}. Please try again or contact support if the issue persists."
        )
