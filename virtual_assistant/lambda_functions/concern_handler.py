import json
import boto3
import os
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')
lambda_client = boto3.client('lambda')

table_name = os.environ['CUSTOMER_CONCERNS_TABLE']
feedback_sns_topic_arn = os.environ['FEEDBACK_SNS_TOPIC_ARN']
feedback_lambda_arn = os.environ['FEEDBACK_LAMBDA_ARN']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function to handle customer concerns and issues
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract information from Lex event
        session_attributes = event.get('sessionAttributes', {})
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent'].get('slots', {})
        
        # Get booking reference and issue description from slots
        booking_reference = None
        issue_description = None
        
        if 'BookingReference' in slots and slots['BookingReference'] and slots['BookingReference']['value']:
            booking_reference = slots['BookingReference']['value']['interpretedValue']
            
        if 'IssueDescription' in slots and slots['IssueDescription'] and slots['IssueDescription']['value']:
            issue_description = slots['IssueDescription']['value']['interpretedValue']
        
        # Check if we have all required information
        if not booking_reference:
            response_message = "To help you report an issue, I'll need your booking reference number. Please provide it so I can assist you better."
        elif not issue_description:
            response_message = f"I have your booking reference ({booking_reference}). Please describe the issue you're experiencing with your bike."
        else:
            response_message = create_concern_ticket(booking_reference, issue_description)
        
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
                    'content': "I'm sorry, I encountered an error while processing your concern. Please try again or contact support directly."
                }
            ]
        }
        
        return error_response

def create_concern_ticket(booking_reference, issue_description):
    """
    Create a new concern ticket in DynamoDB and forward to operators
    """
    try:
        # Generate unique concern ID
        concern_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        priority = determine_priority(issue_description)
        category = determine_category(issue_description)
        
        # Create concern item
        concern_item = {
            'concern_id': concern_id,
            'booking_reference': booking_reference,
            'issue_description': issue_description,
            'status': 'open',
            'created_at': timestamp,
            'updated_at': timestamp,
            'priority': priority,
            'category': category
        }
        
        # Save to DynamoDB
        table.put_item(Item=concern_item)
        logger.info(f"Created concern ticket: {concern_id} for booking: {booking_reference}")
        
        # Forward concern to operators via SNS
        forward_concern_to_operators(concern_id, booking_reference, issue_description, priority, category)
        
        # Prepare response message
        message = f"""🎫 **Issue Ticket Created Successfully**

📋 **Ticket ID:** {concern_id[:8]}...
🔖 **Booking Reference:** {booking_reference}
📝 **Issue:** {issue_description}
📊 **Status:** Open
⚡ **Priority:** {priority.title()}

**What happens next:**
✅ Your concern has been logged and forwarded to our franchise operators
✅ You'll receive updates on the resolution progress
✅ Expected response time: 2-4 hours for urgent issues, 24 hours for others

**For immediate assistance:**
• If this is a safety issue, please contact emergency services
• For urgent bike problems, you can also call our 24/7 hotline

Thank you for reporting this issue. We'll resolve it as quickly as possible!"""

        return message
        
    except Exception as e:
        logger.error(f"Error creating concern ticket: {str(e)}")
        return f"I'm sorry, I couldn't create a ticket for your concern at this time. Please try again or contact our support team directly with booking reference {booking_reference} and describe your issue: '{issue_description}'"

def forward_concern_to_operators(concern_id, booking_reference, issue_description, priority, category):
    """
    Forward concern to operators via SNS
    """
    try:
        # Prepare message for operators
        message_body = f"""
🚨 NEW CUSTOMER CONCERN REPORTED

📋 Concern ID: {concern_id}
🔖 Booking Reference: {booking_reference}
📝 Issue Description: {issue_description}
⚡ Priority: {priority.upper()}
🏷️ Category: {category.title()}
🕐 Reported At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Please investigate and respond accordingly.
        """.strip()
        
        # Publish to SNS topic
        response = sns_client.publish(
            TopicArn=feedback_sns_topic_arn,
            Message=message_body,
            Subject=f"[{priority.upper()}] Customer Concern - {booking_reference}",
            MessageAttributes={
                'referenceCode': {
                    'DataType': 'String',
                    'StringValue': concern_id
                },
                'priority': {
                    'DataType': 'String',
                    'StringValue': priority
                },
                'category': {
                    'DataType': 'String',
                    'StringValue': category
                }
            }
        )
        
        logger.info(f"Successfully forwarded concern {concern_id} to operators via SNS. MessageId: {response.get('MessageId')}")
        
    except Exception as e:
        logger.error(f"Error forwarding concern {concern_id} to operators: {str(e)}")
        # Don't raise the error as the ticket was still created successfully

def determine_priority(issue_description):
    """
    Determine priority based on issue description
    """
    issue_lower = issue_description.lower()
    
    # High priority issues
    high_priority_keywords = ['accident', 'injury', 'broken', 'damaged', 'safety', 'emergency', 'stuck', 'theft']
    
    # Medium priority issues  
    medium_priority_keywords = ['battery', 'not working', 'malfunction', 'dead', 'cannot unlock', 'won\'t start']
    
    for keyword in high_priority_keywords:
        if keyword in issue_lower:
            return 'high'
    
    for keyword in medium_priority_keywords:
        if keyword in issue_lower:
            return 'medium'
    
    return 'low'

def determine_category(issue_description):
    """
    Determine category based on issue description
    """
    issue_lower = issue_description.lower()
    
    categories = {
        'technical': ['battery', 'not working', 'malfunction', 'broken', 'dead', 'won\'t start', 'charging'],
        'access': ['cannot unlock', 'access code', 'locked', 'unlock'],
        'damage': ['damaged', 'broken', 'scratched', 'dent'],
        'safety': ['accident', 'injury', 'safety', 'emergency'],
        'theft': ['stolen', 'theft', 'missing'],
        'other': []
    }
    
    for category, keywords in categories.items():
        if category != 'other':
            for keyword in keywords:
                if keyword in issue_lower:
                    return category
    
    return 'other'