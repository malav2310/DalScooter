# modules/virtual-assistant/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# DynamoDB table for storing bot knowledge base and FAQ
resource "aws_dynamodb_table" "bot_knowledge_base" {
  name           = "${var.project_name}-${var.environment}-bot-knowledge"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "question_id"

  attribute {
    name = "question_id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "CategoryIndex"
    hash_key        = "category"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-bot-knowledge"
    Environment = var.environment
    Project     = var.project_name
  }
}

# DynamoDB table for storing booking references and access codes
resource "aws_dynamodb_table" "booking_references" {
  name           = "${var.project_name}-${var.environment}-booking-references"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "booking_reference"

  attribute {
    name = "booking_reference"
    type = "S"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-booking-references"
    Environment = var.environment
    Project     = var.project_name
  }
}

# DynamoDB table for storing customer concerns/tickets
resource "aws_dynamodb_table" "customer_concerns" {
  name           = "${var.project_name}-${var.environment}-customer-concerns"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "concern_id"

  attribute {
    name = "concern_id"
    type = "S"
  }

  attribute {
    name = "booking_reference"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "BookingReferenceIndex"
    hash_key        = "booking_reference"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-customer-concerns"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Archive files for Lambda functions
data "archive_file" "faq_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/faq_handler.zip"
  source {
    content  = file("${path.module}/lambda_functions/faq_handler.py")
    filename = "faq_handler.py"
  }
}

data "archive_file" "booking_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/booking_handler.zip"
  source {
    content  = file("${path.module}/lambda_functions/booking_handler.py")
    filename = "booking_handler.py"
  }
}

data "archive_file" "concern_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/concern_handler.zip"
  source {
    content  = file("${path.module}/lambda_functions/concern_handler.py")
    filename = "index.py"
  }
}

# Router Lambda function archive
data "archive_file" "router_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/router_handler.zip"
  source {
    content  = <<EOF
import json
import boto3
import os
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Router function that directs intents to appropriate handlers
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        intent_name = event['sessionState']['intent']['name']
        
        if intent_name == 'FAQIntent':
            return handle_faq(event, context)
        elif intent_name == 'BookingIntent':
            return handle_booking(event, context)
        elif intent_name == 'ConcernIntent':
            return handle_concern(event, context)
        else:
            return default_response(event, intent_name)
            
    except Exception as e:
        logger.error(f"Router error: {str(e)}")
        return error_response(event.get('sessionState', {}).get('intent', {}).get('name', 'Unknown'))

def handle_faq(event, context):
    """Handle FAQ queries"""
    try:
        table = dynamodb.Table(os.environ['KNOWLEDGE_BASE_TABLE'])
        input_text = event.get('inputTranscript', '').lower()
        
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

What would you like to know more about?"""
        }
        
        # Try to find matching FAQ
        for keyword, response in faq_responses.items():
            if keyword in input_text:
                return create_response('FAQIntent', 'Fulfilled', response)
        
        # Default FAQ response
        return create_response('FAQIntent', 'Fulfilled', """I'd be happy to help! I can assist you with:

• How to register and create an account
• Information about our bike types (Gyroscooter, eBikes, Segway)
• Rental rates and pricing
• How to make bookings
• Getting your bike access code
• Reporting issues or problems
• General site navigation

Please ask me about any of these topics, or try rephrasing your question!""")
        
    except Exception as e:
        logger.error(f"FAQ handler error: {str(e)}")
        return error_response('FAQIntent')

def handle_booking(event, context):
    """Handle booking reference queries"""
    try:
        table = dynamodb.Table(os.environ['BOOKING_REFERENCES_TABLE'])
        slots = event['sessionState']['intent'].get('slots', {})
        
        # Get booking reference from slot
        booking_reference = None
        if 'BookingReference' in slots and slots['BookingReference'] and slots['BookingReference']['value']:
            booking_reference = slots['BookingReference']['value']['interpretedValue']
        
        if not booking_reference:
            return create_response('BookingIntent', 'Fulfilled', 
                "Please provide your booking reference number so I can help you get your bike access code and rental details.")
        
        # Query the booking references table
        response = table.get_item(Key={'booking_reference': booking_reference})
        
        if 'Item' in response:
            item = response['Item']
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
        
        return create_response('BookingIntent', 'Fulfilled', message)
        
    except Exception as e:
        logger.error(f"Booking handler error: {str(e)}")
        return error_response('BookingIntent')

def handle_concern(event, context):
    """Handle customer concerns"""
    try:
        table = dynamodb.Table(os.environ['CUSTOMER_CONCERNS_TABLE'])
        slots = event['sessionState']['intent'].get('slots', {})
        input_text = event.get('inputTranscript', '')
        
        # Get booking reference from slot if available
        booking_reference = None
        if 'BookingReference' in slots and slots['BookingReference'] and slots['BookingReference']['value']:
            booking_reference = slots['BookingReference']['value']['interpretedValue']
        
        # Use the full input text as issue description if no specific slot
        issue_description = input_text if input_text else "General issue reported"
        
        # Generate unique concern ID
        concern_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Determine priority and category
        priority = determine_priority(issue_description)
        category = determine_category(issue_description)
        
        # Create concern item
        concern_item = {
            'concern_id': concern_id,
            'booking_reference': booking_reference or 'N/A',
            'issue_description': issue_description,
            'status': 'open',
            'created_at': timestamp,
            'updated_at': timestamp,
            'priority': priority,
            'category': category
        }
        
        # Save to DynamoDB
        table.put_item(Item=concern_item)
        
        # Forward concern to operators via SNS
        forward_concern_to_operators(concern_id, booking_reference, issue_description, priority, category)
        
        message = f"""🎫 **Issue Ticket Created Successfully**

📋 **Ticket ID:** {concern_id[:8]}...
🔖 **Booking Reference:** {booking_reference or 'Not provided'}
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
        
        return create_response('ConcernIntent', 'Fulfilled', message)
        
    except Exception as e:
        logger.error(f"Concern handler error: {str(e)}")
        return error_response('ConcernIntent')

def forward_concern_to_operators(concern_id, booking_reference, issue_description, priority, category):
    """Forward concern to operators via SNS"""
    try:
        # Import SNS client
        sns_client = boto3.client('sns')
        
        # Prepare message for operators
        message_body = f"""
🚨 NEW CUSTOMER CONCERN REPORTED

📋 Concern ID: {concern_id}
🔖 Booking Reference: {booking_reference or 'Not provided'}
📝 Issue Description: {issue_description}
⚡ Priority: {priority.upper()}
🏷️ Category: {category.title()}
🕐 Reported At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Please investigate and respond accordingly.
        """.strip()
        
        # Publish to SNS topic
        response = sns_client.publish(
            TopicArn=os.environ['FEEDBACK_SNS_TOPIC_ARN'],
            Message=message_body,
            Subject=f"[{priority.upper()}] Customer Concern - {booking_reference or concern_id[:8]}",
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
    """Determine priority based on issue description"""
    issue_lower = issue_description.lower()
    high_priority_keywords = ['accident', 'injury', 'broken', 'damaged', 'safety', 'emergency', 'stuck', 'theft']
    medium_priority_keywords = ['battery', 'not working', 'malfunction', 'dead', 'cannot unlock', 'won\'t start']
    
    for keyword in high_priority_keywords:
        if keyword in issue_lower:
            return 'high'
    
    for keyword in medium_priority_keywords:
        if keyword in issue_lower:
            return 'medium'
    
    return 'low'

def determine_category(issue_description):
    """Determine category based on issue description"""
    issue_lower = issue_description.lower()
    categories = {
        'technical': ['battery', 'not working', 'malfunction', 'broken', 'dead', 'won\'t start', 'charging'],
        'access': ['cannot unlock', 'access code', 'locked', 'unlock'],
        'damage': ['damaged', 'broken', 'scratched', 'dent'],
        'safety': ['accident', 'injury', 'safety', 'emergency'],
        'theft': ['stolen', 'theft', 'missing'],
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in issue_lower:
                return category
    
    return 'other'

def create_response(intent_name, state, message):
    """Create standard Lex response"""
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'Close'
            },
            'intent': {
                'name': intent_name,
                'state': state
            }
        },
        'messages': [{
            'contentType': 'PlainText',
            'content': message
        }]
    }

def default_response(event, intent_name):
    """Default response for unknown intents"""
    return create_response(intent_name, 'Fulfilled', 
        "I'm sorry, I couldn't understand your request. Please try asking about registration, bike access codes, or reporting issues.")

def error_response(intent_name):
    """Error response"""
    return create_response(intent_name, 'Failed', 
        "I apologize, but I'm experiencing technical difficulties. Please try again or contact support.")
EOF
    filename = "index.py"
  }
}

# API Gateway Proxy Lambda function archive
data "archive_file" "api_proxy_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/api_proxy_handler.zip"
  source {
    content  = <<EOF
import json
import boto3
import os
import logging
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

lex_client = boto3.client('lexv2-runtime')

def handler(event, context):
    """
    API Gateway proxy function that communicates with Lex V2
    """
    logger.info(f"Received API Gateway event: {json.dumps(event)}")
    
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': ''
            }
        
        # Parse request body
        if event.get('body'):
            if event.get('isBase64Encoded'):
                body = json.loads(base64.b64decode(event['body']).decode('utf-8'))
            else:
                body = json.loads(event['body'])
        else:
            return create_error_response(400, "Missing request body")
        
        # Extract required parameters
        message = body.get('message', '')
        session_id = body.get('sessionId', str(uuid.uuid4()))
        
        if not message:
            return create_error_response(400, "Message is required")
        
        # Call Lex V2 RecognizeText API
        response = lex_client.recognize_text(
            botId=os.environ['BOT_ID'],
            botAliasId=os.environ['BOT_ALIAS_ID'],
            localeId='en_US',
            sessionId=session_id,
            text=message
        )
        
        # Extract response message
        bot_response = ""
        if 'messages' in response and response['messages']:
            bot_response = response['messages'][0].get('content', '')
        
        # Return formatted response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': bot_response,
                'sessionId': session_id,
                'dialogState': response.get('sessionState', {}).get('dialogAction', {}).get('type', ''),
                'intentName': response.get('sessionState', {}).get('intent', {}).get('name', ''),
                'slotToElicit': response.get('sessionState', {}).get('dialogAction', {}).get('slotToElicit', ''),
                'sessionAttributes': response.get('sessionState', {}).get('sessionAttributes', {}),
                'requestAttributes': response.get('requestAttributes', {})
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def create_error_response(status_code, message):
    """Create error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'error': message
        })
    }
EOF
    filename = "index.py"
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-virtual-assistant-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for Lambda functions - UPDATED WITH NEW PERMISSIONS
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-virtual-assistant-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.bot_knowledge_base.arn,
          "${aws_dynamodb_table.bot_knowledge_base.arn}/index/*",
          aws_dynamodb_table.booking_references.arn,
          "${aws_dynamodb_table.booking_references.arn}/index/*",
          aws_dynamodb_table.customer_concerns.arn,
          "${aws_dynamodb_table.customer_concerns.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lex:RecognizeText",
          "lex:RecognizeUtterance"
        ]
        Resource = [
          "arn:aws:lex:*:*:bot-alias/${aws_lexv2models_bot.dalscooter_bot.id}/*"
        ]
      },
      # NEW: SNS permissions for forwarding concerns
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          var.feedback_sns_topic_arn
        ]
      },
      # NEW: Lambda invoke permissions for message passing
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          var.feedback_lambda_arn
        ]
      }
    ]
  })
}

# Individual Lambda functions (kept for reference/debugging)
resource "aws_lambda_function" "faq_handler" {
  filename         = data.archive_file.faq_handler_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-faq-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "faq_handler.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.faq_handler_zip.output_base64sha256

  environment {
    variables = {
      KNOWLEDGE_BASE_TABLE = aws_dynamodb_table.bot_knowledge_base.name
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-faq-handler"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "booking_handler" {
  filename         = data.archive_file.booking_handler_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-booking-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "booking_handler.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.booking_handler_zip.output_base64sha256

  environment {
    variables = {
      BOOKING_REFERENCES_TABLE = aws_dynamodb_table.booking_references.name
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-booking-handler"
    Environment = var.environment
    Project     = var.project_name
  }
}

# UPDATED: Concern handler with new environment variables
resource "aws_lambda_function" "concern_handler" {
  filename         = data.archive_file.concern_handler_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-concern-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "concern_handler.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.concern_handler_zip.output_base64sha256

  environment {
    variables = {
      CUSTOMER_CONCERNS_TABLE = aws_dynamodb_table.customer_concerns.name
      # NEW: Add message passing variables
      FEEDBACK_SNS_TOPIC_ARN = var.feedback_sns_topic_arn
      FEEDBACK_LAMBDA_ARN    = var.feedback_lambda_arn
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-concern-handler"
    Environment = var.environment
    Project     = var.project_name
  }
}

# UPDATED: Router Lambda function (main function for Lex) with new environment variables
resource "aws_lambda_function" "router_handler" {
  filename         = data.archive_file.router_handler_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-router-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.router_handler_zip.output_base64sha256

  environment {
    variables = {
      KNOWLEDGE_BASE_TABLE = aws_dynamodb_table.bot_knowledge_base.name
      BOOKING_REFERENCES_TABLE = aws_dynamodb_table.booking_references.name
      CUSTOMER_CONCERNS_TABLE = aws_dynamodb_table.customer_concerns.name
      # NEW: Add message passing variables
      FEEDBACK_SNS_TOPIC_ARN = var.feedback_sns_topic_arn
      FEEDBACK_LAMBDA_ARN    = var.feedback_lambda_arn
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-router-handler"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway Proxy Lambda function
resource "aws_lambda_function" "api_proxy_handler" {
  filename         = data.archive_file.api_proxy_handler_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-api-proxy-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.api_proxy_handler_zip.output_base64sha256

  environment {
    variables = {
      BOT_ID = aws_lexv2models_bot.dalscooter_bot.id
      BOT_ALIAS_ID = "TSTALIASID"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-proxy-handler"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM role for Lex bot
resource "aws_iam_role" "lex_role" {
  name = "${var.project_name}-${var.environment}-lex-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lexv2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lex-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for Lex bot
resource "aws_iam_role_policy" "lex_policy" {
  name = "${var.project_name}-${var.environment}-lex-policy"
  role = aws_iam_role.lex_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.router_handler.arn,
          aws_lambda_function.faq_handler.arn,
          aws_lambda_function.booking_handler.arn,
          aws_lambda_function.concern_handler.arn
        ]
      }
    ]
  })
}

# Lambda permissions for Lex
resource "aws_lambda_permission" "lex_router_invoke" {
  statement_id  = "AllowExecutionFromLex"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.router_handler.function_name
  principal     = "lexv2.amazonaws.com"
}

resource "aws_lambda_permission" "lex_faq_invoke" {
  statement_id  = "AllowExecutionFromLex"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.faq_handler.function_name
  principal     = "lexv2.amazonaws.com"
}

resource "aws_lambda_permission" "lex_booking_invoke" {
  statement_id  = "AllowExecutionFromLex"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.booking_handler.function_name
  principal     = "lexv2.amazonaws.com"
}

resource "aws_lambda_permission" "lex_concern_invoke" {
  statement_id  = "AllowExecutionFromLex"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.concern_handler.function_name
  principal     = "lexv2.amazonaws.com"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_proxy_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.chatbot_api.execution_arn}/*/*"
}

# Lex Bot
resource "aws_lexv2models_bot" "dalscooter_bot" {
  name     = "${var.project_name}-${var.environment}-assistant"
  role_arn = aws_iam_role.lex_role.arn

  idle_session_ttl_in_seconds = 300

  data_privacy {
    child_directed = false
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-assistant"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lex Bot Locale
resource "aws_lexv2models_bot_locale" "dalscooter_bot_locale" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = "en_US"
  n_lu_intent_confidence_threshold = 0.40

  voice_settings {
    voice_id = "Joanna"
  }
}

# Intent 1: FAQ Intent
resource "aws_lexv2models_intent" "faq_intent" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.dalscooter_bot_locale.locale_id
  name        = "FAQIntent"
  description = "Handle FAQ and navigation queries"

  sample_utterance {
    utterance = "How do I register"
  }
  sample_utterance {
    utterance = "What bikes are available"
  }
  sample_utterance {
    utterance = "How much does it cost"
  }
  sample_utterance {
    utterance = "What are your prices"
  }
  sample_utterance {
    utterance = "How to book a bike"
  }
  sample_utterance {
    utterance = "Tell me about registration"
  }
  sample_utterance {
    utterance = "What types of bikes do you have"
  }
  sample_utterance {
    utterance = "Help me navigate"
  }
  sample_utterance {
    utterance = "I need help"
  }
  sample_utterance {
    utterance = "How do I sign up"
  }

  fulfillment_code_hook {
    enabled = true
  }
}

# Intent 2: Booking Intent
resource "aws_lexv2models_intent" "booking_intent" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.dalscooter_bot_locale.locale_id
  name        = "BookingIntent"
  description = "Handle booking reference queries"

  sample_utterance {
    utterance = "Get access code for {BookingReference}"
  }
  sample_utterance {
    utterance = "My booking reference is {BookingReference}"
  }
  sample_utterance {
    utterance = "I need the access code for booking {BookingReference}"
  }
  sample_utterance {
    utterance = "Show me details for {BookingReference}"
  }
  sample_utterance {
    utterance = "What's my access code for {BookingReference}"
  }
  sample_utterance {
    utterance = "Booking reference {BookingReference}"
  }
  sample_utterance {
    utterance = "Access code for {BookingReference}"
  }

  fulfillment_code_hook {
    enabled = true
  }
}

# Intent 3: Concern Intent
resource "aws_lexv2models_intent" "concern_intent" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.dalscooter_bot_locale.locale_id
  name        = "ConcernIntent"
  description = "Handle customer concerns and issues"

  sample_utterance {
    utterance = "I have a problem with my bike"
  }
  sample_utterance {
    utterance = "My bike is not working"
  }
  sample_utterance {
    utterance = "I need to report an issue"
  }
  sample_utterance {
    utterance = "There's something wrong with booking {BookingReference}"
  }
  sample_utterance {
    utterance = "I want to report a concern"
  }
  sample_utterance {
    utterance = "The bike is damaged"
  }
  sample_utterance {
    utterance = "I can't unlock the bike"
  }
  sample_utterance {
    utterance = "Contact support"
  }
  sample_utterance {
    utterance = "I have an issue"
  }
  sample_utterance {
    utterance = "Something is wrong"
  }

  fulfillment_code_hook {
    enabled = true
  }
}

# Slot for BookingReference in Booking Intent
resource "aws_lexv2models_slot" "booking_reference_slot" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.dalscooter_bot_locale.locale_id
  intent_id   = aws_lexv2models_intent.booking_intent.intent_id
  name        = "BookingReference"
  slot_type_id = "AMAZON.AlphaNumeric"

  value_elicitation_setting {
    slot_constraint = "Required"
    
    prompt_specification {
      max_retries = 2
      allow_interrupt = true
      message_selection_strategy = "Random"
      
      message_group {
        message {
          plain_text_message {
            value = "Please provide your booking reference number."
          }
        }
      }
    }
  }

  depends_on = [aws_lexv2models_intent.booking_intent]
}

# Slot for BookingReference in Concern Intent (Optional)
resource "aws_lexv2models_slot" "concern_booking_reference_slot" {
  bot_id      = aws_lexv2models_bot.dalscooter_bot.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.dalscooter_bot_locale.locale_id
  intent_id   = aws_lexv2models_intent.concern_intent.intent_id
  name        = "BookingReference"
  slot_type_id = "AMAZON.AlphaNumeric"

  value_elicitation_setting {
    slot_constraint = "Optional"
    
    prompt_specification {
      max_retries = 2
      allow_interrupt = true
      message_selection_strategy = "Random"
      
      message_group {
        message {
          plain_text_message {
            value = "What's your booking reference number? (This helps us assist you better, but it's optional)"
          }
        }
      }
    }
  }

  depends_on = [aws_lexv2models_intent.concern_intent]
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "chatbot_api" {
  name        = "${var.project_name}-${var.environment}-chatbot-api"
  description = "API Gateway for DALScooter Virtual Assistant"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-chatbot-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "chat_resource" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  parent_id   = aws_api_gateway_rest_api.chatbot_api.root_resource_id
  path_part   = "chat"
}

# API Gateway Method (POST)
resource "aws_api_gateway_method" "chat_post" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  resource_id   = aws_api_gateway_resource.chat_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Method (OPTIONS for CORS)
resource "aws_api_gateway_method" "chat_options" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  resource_id   = aws_api_gateway_resource.chat_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# API Gateway Integration for POST
resource "aws_api_gateway_integration" "chat_integration" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chat_resource.id
  http_method = aws_api_gateway_method.chat_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_proxy_handler.invoke_arn
}

# API Gateway Integration for OPTIONS (CORS)
resource "aws_api_gateway_integration" "chat_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chat_resource.id
  http_method = aws_api_gateway_method.chat_options.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_proxy_handler.invoke_arn
}

# API Gateway Deployment (without stage_name)
resource "aws_api_gateway_deployment" "chatbot_deployment" {
  depends_on = [
    aws_api_gateway_integration.chat_integration,
    aws_api_gateway_integration.chat_options_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.chat_resource.id,
      aws_api_gateway_method.chat_post.id,
      aws_api_gateway_method.chat_options.id,
      aws_api_gateway_integration.chat_integration.id,
      aws_api_gateway_integration.chat_options_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create API Gateway Stage separately
resource "aws_api_gateway_stage" "chatbot_stage" {
  deployment_id = aws_api_gateway_deployment.chatbot_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.chatbot_api.id
  stage_name    = var.environment

  tags = {
    Name        = "${var.project_name}-${var.environment}-chatbot-stage"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Enable CORS for API Gateway - Corrected Method Response
resource "aws_api_gateway_method_response" "chat_post_200" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chat_resource.id
  http_method = aws_api_gateway_method.chat_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_method_response" "chat_options_200" {
  rest_api_id = aws_api_gateway_rest_api.chatbot_api.id
  resource_id = aws_api_gateway_resource.chat_resource.id
  http_method = aws_api_gateway_method.chat_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

# Add data source for region
data "aws_region" "current" {}
