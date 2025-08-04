import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['KNOWLEDGE_BASE_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function to handle FAQ and navigation queries
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract information from Lex event
        session_attributes = event.get('sessionAttributes', {})
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent'].get('slots', {})
        
        # Get the user's input text
        input_text = event.get('inputTranscript', '').lower()
        
        # Handle different types of FAQ queries
        response_message = handle_faq_query(input_text)
        
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
                    'content': "I'm sorry, I encountered an error while processing your request. Please try again."
                }
            ]
        }
        
        return error_response

def handle_faq_query(input_text):
    """
    Handle FAQ queries based on input text
    """
    
    # Define FAQ responses
    faq_responses = {
        'register': """To register for DALScooter:
1. Visit our registration page
2. Fill in your personal details
3. Create a username and password
4. Verify your email address
5. Complete the multi-factor authentication setup
Once registered, you'll receive a confirmation notification!""",
        
        'bikes': """We offer three types of bikes:
1. **Gyroscooter** - Perfect for short city rides
2. **eBikes** - Electric bikes for longer distances
3. **Segway** - Self-balancing personal transporters

You can check availability and rates for each type on our main page.""",
        
        'cost': """Our rental rates vary by bike type:
- Gyroscooter: Starting from $5/hour
- eBikes: Starting from $8/hour  
- Segway: Starting from $10/hour

Registered customers may receive special discounts! Please check our rates page for current pricing.""",
        
        'booking': """To make a booking:
1. Register and log in to your account
2. Select your preferred bike type
3. Choose your rental period
4. Confirm your booking
5. You'll receive a booking reference code
6. Use this code to get your bike access code through me!""",
        
        'help': """I can help you with:
- Registration process
- Available bike types and rates
- How to make bookings
- Getting your bike access code (with booking reference)
- Reporting issues or concerns
- General navigation around the site

What would you like to know more about?""",
        
        'navigation': """Here's how to navigate DALScooter:
- **Home**: View available bikes and rates
- **Register**: Create your account
- **Login**: Access your account (with multi-factor auth)
- **Booking**: Reserve your bike
- **My Bookings**: View your reservations
- **Feedback**: Share your experience
- **Support**: Contact us for help

What section would you like to visit?"""
    }
    
    # Try to find matching FAQ
    for keyword, response in faq_responses.items():
        if keyword in input_text:
            return response
    
    # Try to query DynamoDB for more specific questions
    try:
        response = table.scan(
            FilterExpression='contains(#question, :query)',
            ExpressionAttributeNames={
                '#question': 'question'
            },
            ExpressionAttributeValues={
                ':query': input_text
            },
            Limit=1
        )
        
        if response['Items']:
            return response['Items'][0]['answer']
            
    except Exception as e:
        logger.error(f"Error querying knowledge base: {str(e)}")
    
    # Default response
    return """I'd be happy to help! I can assist you with:

• How to register and create an account
• Information about our bike types (Gyroscooter, eBikes, Segway)
• Rental rates and pricing
• How to make bookings
• Getting your bike access code
• Reporting issues or problems
• General site navigation

Please ask me about any of these topics, or try rephrasing your question!"""