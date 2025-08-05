# NEW: Add variables to receive ARNs and names from other modules
variable "booking_references_table_name" {
  description = "The name of the DynamoDB table for chatbot booking references."
  type        = string
}

variable "booking_references_table_arn" {
  description = "The ARN of the DynamoDB table for chatbot booking references."
  type        = string
}

variable "notification_processor_lambda_arn" {
  description = "The ARN of the notification processor Lambda function."
  type        = string
}

# DynamoDB table for bikes
resource "aws_dynamodb_table" "bikes" {
  name           = "dalscooter-bikes"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bike_id"

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "bike_type"
    type = "S"
  }

  attribute {
    name = "franchise_id"
    type = "S"
  }

  global_secondary_index {
    name               = "BikeTypeIndex"
    hash_key           = "bike_type"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "FranchiseIndex"
    hash_key           = "franchise_id"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "dalscooter-bikes"
    Environment = var.environment
  }
}

# DynamoDB table for bookings
resource "aws_dynamodb_table" "bookings" {
  name           = "dalscooter-bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "booking_id"

  attribute {
    name = "booking_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "booking_date"
    type = "S"
  }

  global_secondary_index {
    name               = "CustomerIndex"
    hash_key           = "customer_id"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "BikeIndex"
    hash_key           = "bike_id"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "DateIndex"
    hash_key           = "booking_date"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "dalscooter-bookings"
    Environment = var.environment
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "bike_lambda_role" {
  name = "dalscooter-bike-lambda-role"

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
}

# IAM policy for Lambda functions
resource "aws_iam_role_policy" "bike_lambda_policy" {
  name = "dalscooter-bike-lambda-policy"
  role = aws_iam_role.bike_lambda_role.id

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
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.bikes.arn,
          aws_dynamodb_table.bookings.arn,
          var.booking_references_table_arn, # NEW: Permission for chatbot reference table
          "${aws_dynamodb_table.bikes.arn}/index/*",
          "${aws_dynamodb_table.bookings.arn}/index/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = var.notification_processor_lambda_arn
      }
    ]
  })
}

# Lambda function for getting bikes (Guest functionality)
resource "aws_lambda_function" "get_bikes" {
  filename         = "bike_management/lambda_functions/get_bikes.zip"
  function_name    = "dalscooter-get-bikes"
  role             = aws_iam_role.bike_lambda_role.arn
  handler          = "get_bikes.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      BIKES_TABLE = aws_dynamodb_table.bikes.name
    }
  }

  depends_on = [data.archive_file.get_bikes_zip]
}

# Lambda function for bike booking (Customer functionality)
resource "aws_lambda_function" "book_bike" {
  filename         = "bike_management/lambda_functions/book_bike.zip"
  function_name    = "dalscooter-book-bike"
  role             = aws_iam_role.bike_lambda_role.arn
  handler          = "book_bike.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      BIKES_TABLE                     = aws_dynamodb_table.bikes.name
      BOOKINGS_TABLE                  = aws_dynamodb_table.bookings.name
      # NEW: Add environment variables for the updated Lambda code
      BOOKING_REFERENCES_TABLE        = var.booking_references_table_name
      NOTIFICATION_PROCESSOR_ARN      = var.notification_processor_lambda_arn
    }
  }

  depends_on = [data.archive_file.book_bike_zip]
}

# Lambda function for managing bikes (Franchise functionality)
resource "aws_lambda_function" "manage_bikes" {
  filename         = "bike_management/lambda_functions/manage_bikes.zip"
  function_name    = "dalscooter-manage-bikes"
  role             = aws_iam_role.bike_lambda_role.arn
  handler          = "manage_bikes.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      BIKES_TABLE = aws_dynamodb_table.bikes.name
    }
  }

  depends_on = [data.archive_file.manage_bikes_zip]
}

# Lambda function for checking availability
resource "aws_lambda_function" "check_availability" {
  filename         = "bike_management/lambda_functions/check_availability.zip"
  function_name    = "dalscooter-check-availability"
  role             = aws_iam_role.bike_lambda_role.arn
  handler          = "check_availability.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30

  environment {
    variables = {
      BIKES_TABLE    = aws_dynamodb_table.bikes.name
      BOOKINGS_TABLE = aws_dynamodb_table.bookings.name
    }
  }

  depends_on = [data.archive_file.check_availability_zip]
}

# Create ZIP files for Lambda functions
data "archive_file" "get_bikes_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/get_bikes.py"
  output_path = "${path.module}/lambda_functions/get_bikes.zip"
}

data "archive_file" "book_bike_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/book_bike.py"
  output_path = "${path.module}/lambda_functions/book_bike.zip"
}

data "archive_file" "manage_bikes_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/manage_bikes.py"
  output_path = "${path.module}/lambda_functions/manage_bikes.zip"
}

data "archive_file" "check_availability_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_functions/check_availability.py"
  output_path = "${path.module}/lambda_functions/check_availability.zip"
}
