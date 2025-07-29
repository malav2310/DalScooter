# main.tf
# IAM Role for Lambda Functions
resource "aws_iam_role" "notification_lambda_role" {
  name = "${var.project_name}-${var.environment}-notification-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]

  inline_policy {
    name = "NotificationPolicy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "sns:Publish"
          ]
          Resource = [
            aws_sns_topic.registration_notification.arn,
            aws_sns_topic.login_notification.arn,
            aws_sns_topic.booking_confirmation.arn,
            aws_sns_topic.booking_failure.arn
          ]
        },
        {
          Effect = "Allow"
          Action = [
            "sqs:SendMessage",
            "sqs:ReceiveMessage",
            "sqs:DeleteMessage",
            "sqs:GetQueueAttributes"
          ]
          Resource = aws_sqs_queue.notification_queue.arn
        },
        {
          Effect = "Allow"
          Action = [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ]
          Resource = aws_dynamodb_table.notification_logs.arn
        },
        {
          Effect = "Allow"
          Action = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Resource = "*"
        }
      ]
    })
  }
}

# SNS Topics
resource "aws_sns_topic" "registration_notification" {
  name         = "${var.project_name}-${var.environment}-registration-notifications"
  display_name = "DALScooter Registration Notifications"
}

resource "aws_sns_topic" "login_notification" {
  name         = "${var.project_name}-${var.environment}-login-notifications"
  display_name = "DALScooter Login Notifications"
}

resource "aws_sns_topic" "booking_confirmation" {
  name         = "${var.project_name}-${var.environment}-booking-confirmation"
  display_name = "DALScooter Booking Confirmation"
}

resource "aws_sns_topic" "booking_failure" {
  name         = "${var.project_name}-${var.environment}-booking-failure"
  display_name = "DALScooter Booking Failure"
}

# SQS Queues
resource "aws_sqs_queue" "notification_dead_letter_queue" {
  name                      = "${var.project_name}-${var.environment}-notification-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "notification_queue" {
  name                        = "${var.project_name}-${var.environment}-notification-queue"
  visibility_timeout_seconds  = 300
  message_retention_seconds   = 1209600 # 14 days
  receive_wait_time_seconds   = 20      # Enable long polling
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dead_letter_queue.arn
    maxReceiveCount     = 3
  })
}

# DynamoDB Table
resource "aws_dynamodb_table" "notification_logs" {
  name           = "${var.project_name}-${var.environment}-notification-logs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "notificationId"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "notificationId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name               = "UserNotificationsIndex"
    hash_key           = "userId"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}

# Lambda Function for Notification Processing
resource "aws_lambda_function" "notification_processor" {
  function_name = "${var.project_name}-${var.environment}-notification-processor"
  runtime       = "python3.9"
  handler       = "index.lambda_handler"
  role          = aws_iam_role.notification_lambda_role.arn
  timeout       = 30

  environment {
    variables = {
      REGISTRATION_TOPIC_ARN       = aws_sns_topic.registration_notification.arn
      LOGIN_TOPIC_ARN              = aws_sns_topic.login_notification.arn
      BOOKING_CONFIRMATION_TOPIC_ARN = aws_sns_topic.booking_confirmation.arn
      BOOKING_FAILURE_TOPIC_ARN     = aws_sns_topic.booking_failure.arn
      NOTIFICATION_LOGS_TABLE      = aws_dynamodb_table.notification_logs.name
      PROJECT_NAME                 = var.project_name
      ENVIRONMENT                  = var.environment
    }
  }

  # Inline code (same as CloudFormation)
  filename = data.archive_file.notification_processor_code.output_path
  source_code_hash = data.archive_file.notification_processor_code.output_base64sha256
}

# Data source to zip the notification processor Lambda code
data "archive_file" "notification_processor_code" {
  type        = "zip"
  output_path = "${path.module}/notification_processor.zip"

  source {
    content  = <<EOF
import json
import boto3
import os
import uuid
from datetime import datetime

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

# Environment variables
REGISTRATION_TOPIC_ARN = os.environ['REGISTRATION_TOPIC_ARN']
LOGIN_TOPIC_ARN = os.environ['LOGIN_TOPIC_ARN']
BOOKING_CONFIRMATION_TOPIC_ARN = os.environ['BOOKING_CONFIRMATION_TOPIC_ARN']
BOOKING_FAILURE_TOPIC_ARN = os.environ['BOOKING_FAILURE_TOPIC_ARN']
NOTIFICATION_LOGS_TABLE = os.environ['NOTIFICATION_LOGS_TABLE']

def lambda_handler(event, context):
    try:
        # Parse the incoming event
        notification_type = event.get('notificationType')
        user_email = event.get('userEmail')
        user_id = event.get('userId')
        message_data = event.get('messageData', {})

        # Determine the appropriate topic based on notification type
        topic_arn = None
        subject = None
        message = None

        if notification_type == 'REGISTRATION_SUCCESS':
            topic_arn = REGISTRATION_TOPIC_ARN
            subject = 'Welcome to DALScooter!'
            message = f"Hello {message_data.get('userName', 'User')},\n\nYour registration with DALScooter has been completed successfully!\n\nYou can now log in to your account and start booking bikes.\n\nBest regards,\nDALScooter Team"

        elif notification_type == 'LOGIN_SUCCESS':
            topic_arn = LOGIN_TOPIC_ARN
            subject = 'Successful Login - DALScooter'
            message = f"Hello {message_data.get('userName', 'User')},\n\nYou have successfully logged into your DALScooter account.\n\nLogin Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nIf this wasn't you, please contact support immediately.\n\nBest regards,\nDALScooter Team"

        elif notification_type == 'BOOKING_CONFIRMATION':
            topic_arn = BOOKING_CONFIRMATION_TOPIC_ARN
            subject = 'Booking Confirmed - DALScooter'
            bike_type = message_data.get('bikeType', 'Bike')
            booking_ref = message_data.get('bookingReference', 'N/A')
            start_time = message_data.get('startTime', 'N/A')
            end_time = message_data.get('endTime', 'N/A')
            message = f"Hello {message_data.get('userName', 'User')},\n\nYour {bike_type} booking has been confirmed!\n\nBooking Reference: {booking_ref}\nStart Time: {start_time}\nEnd Time: {end_time}\n\nPlease save this reference for your records.\n\nBest regards,\nDALScooter Team"

        elif notification_type == 'BOOKING_FAILURE':
            topic_arn = BOOKING_FAILURE_TOPIC_ARN
            subject = 'Booking Failed - DALScooter'
            reason = message_data.get('reason', 'Unknown error')
            message = f"Hello {message_data.get('userName', 'User')},\n\nUnfortunately, your booking request could not be processed.\n\nReason: {reason}\n\nPlease try again or contact support if the issue persists.\n\nBest regards,\nDALScooter Team"

        else:
            raise ValueError(f"Unknown notification type: {notification_type}")

        # Create SNS message
        sns_message = {
            'default': message,
            'email': message
        }

        # Publish to SNS topic
        response = sns.publish(
            TopicArn=topic_arn,
            Message=json.dumps(sns_message),
            Subject=subject,
            MessageStructure='json'
        )

        # Log notification in DynamoDB
        notification_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        table = dynamodb.Table(NOTIFICATION_LOGS_TABLE)
        table.put_item(
            Item={
                'notificationId': notification_id,
                'userId': user_id,
                'timestamp': timestamp,
                'notificationType': notification_type,
                'userEmail': user_email,
                'subject': subject,
                'message': message,
                'snsMessageId': response['MessageId'],
                'status': 'SENT'
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notification sent successfully',
                'notificationId': notification_id,
                'snsMessageId': response['MessageId']
            })
        }

    except Exception as e:
        print(f"Error sending notification: {str(e)}")

        # Log error in DynamoDB
        try:
            error_notification_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            table = dynamodb.Table(NOTIFICATION_LOGS_TABLE)
            table.put_item(
                Item={
                    'notificationId': error_notification_id,
                    'userId': user_id,
                    'timestamp': timestamp,
                    'notificationType': notification_type,
                    'userEmail': user_email,
                    'error': str(e),
                    'status': 'FAILED'
                }
            )
        except Exception as log_error:
            print(f"Error logging to DynamoDB: {str(log_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to send notification',
                'details': str(e)
            })
        }
EOF
    filename = "index.py"
  }
}

# Lambda Function for SQS Processing
resource "aws_lambda_function" "sqs_notification_processor" {
  function_name = "${var.project_name}-${var.environment}-sqs-notification-processor"
  runtime       = "python3.9"
  handler       = "index.lambda_handler"
  role          = aws_iam_role.notification_lambda_role.arn
  timeout       = 30

  environment {
    variables = {
      MAIN_LAMBDA_ARN = aws_lambda_function.notification_processor.arn
    }
  }

  # Inline code (same as CloudFormation)
  filename = data.archive_file.sqs_processor_code.output_path
  source_code_hash = data.archive_file.sqs_processor_code.output_base64sha256
}

# Data source to zip the SQS processor Lambda code
data "archive_file" "sqs_processor_code" {
  type        = "zip"
  output_path = "${path.module}/sqs_processor.zip"

  source {
    content  = <<EOF
import json
import boto3

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    try:
        for record in event['Records']:
            # Parse SQS message
            message_body = json.loads(record['body'])

            # Invoke main notification processor
            response = lambda_client.invoke(
                FunctionName=os.environ['MAIN_LAMBDA_ARN'],
                InvocationType='Event',  # Asynchronous invocation
                Payload=json.dumps(message_body)
            )

            print(f"Processed notification: {message_body.get('notificationType')}")

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed SQS messages')
        }

    except Exception as e:
        print(f"Error processing SQS messages: {str(e)}")
        raise e
EOF
    filename = "index.py"
  }
}

# Event Source Mapping for SQS to Lambda
resource "aws_lambda_event_source_mapping" "sqs_event_source" {
  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.sqs_notification_processor.arn
  batch_size       = 10
  maximum_batching_window_in_seconds = 5
}