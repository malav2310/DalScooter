# DynamoDB Table with sentiment-related attributes
resource "aws_dynamodb_table" "feedback_table" {
  name         = "BikeFeedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bike_id"
  range_key    = "feedback_id"

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "feedback_id"
    type = "S"
  }

  tags = {
    Name = "BikeFeedback"
  }
}


# IAM Role (LabRole)
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Zip Lambda Files
data "archive_file" "submit_feedback_zip" {
  type        = "zip"
  output_path = "submit_feedback.zip"
  source_file = "submit_feedback.py"
}

data "archive_file" "get_feedback_zip" {
  type        = "zip"
  output_path = "get_feedback.zip"
  source_file = "get_feedback.py"
}

# Lambda - Submit Feedback
resource "aws_lambda_function" "submit_feedback" {
  filename         = data.archive_file.submit_feedback_zip.output_path
  function_name    = "${var.project_name}-submit-feedback"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "submit_feedback.handler"
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = data.archive_file.submit_feedback_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.feedback_table.name
    }
  }
}

# Lambda - Get Feedback
resource "aws_lambda_function" "get_feedback" {
  filename         = data.archive_file.get_feedback_zip.output_path
  function_name    = "${var.project_name}-get-feedback"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "get_feedback.handler"
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = data.archive_file.get_feedback_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.feedback_table.name
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api"
  description = "API for submitting and retrieving feedback with sentiment"
}

resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "feedback"
}

# POST Method
resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.submit_feedback.invoke_arn
}

# GET Method
resource "aws_api_gateway_method" "get_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_feedback.invoke_arn
}

# Lambda Permissions
resource "aws_lambda_permission" "submit_feedback_api" {
  statement_id  = "AllowSubmitFeedbackInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_feedback_api" {
  statement_id  = "AllowGetFeedbackInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# Deployment
resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.post_integration,
    aws_api_gateway_integration.get_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"
}