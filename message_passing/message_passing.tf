
data "archive_file" "forward_message_lambda" {
  type        = "zip"
  source_file = "./message_passing/forward_message_lambda.py"
  output_path = "./lambda_zip_archives/forward_message_lambda.zip"
}

data "aws_iam_policy_document" "feedback_lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "feedback_lambda_policies" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem"
    ]
    resources = [aws_dynamodb_table.communication_log_table.arn]
  }
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.feedback_sqs.arn]
  }
}

resource "aws_iam_role" "feedback_lambda_role" {
  name               = "SnsLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.feedback_lambda_assume_role.json
}

resource "aws_iam_policy" "feedback_policy" {
  name   = "FeedbackLambdaPolicy"
  policy = data.aws_iam_policy_document.feedback_lambda_policies.json
}

resource "aws_iam_role_policy_attachment" "sns_lambda_policy_attachment" {
  role       = aws_iam_role.feedback_lambda_role.name
  policy_arn = aws_iam_policy.feedback_policy.arn
}

resource "aws_dynamodb_table" "communication_log_table" {
  name         = "CommunicationLogTable"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "referenceCode"

  attribute {
    name = "referenceCode"
    type = "S"
  }
}

resource "aws_sns_topic" "feedback_sns" {
  name = "FeedbackSNS"
}

resource "aws_sqs_queue" "feedback_sqs" {
  name = "FeedbackSQS"
}

resource "aws_lambda_function" "feedback_lambda" {
  function_name    = "FeedbackLambda"
  role             = aws_iam_role.feedback_lambda_role.arn
  handler          = "forward_message_lambda.lambda_handler"
  filename         = data.archive_file.forward_message_lambda.output_path
  source_code_hash = data.archive_file.forward_message_lambda.output_base64sha256
  runtime          = "python3.11"

  environment {
    variables = {
      "dynamodb_table_name" = aws_dynamodb_table.communication_log_table.name
    }
  }
}

resource "aws_lambda_permission" "feedback_sns_lambda_permission" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_lambda.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.feedback_sns.arn
}

resource "aws_sns_topic_subscription" "feedback_sns_lambda_subscription" {
  topic_arn  = aws_sns_topic.feedback_sns.arn
  protocol   = "lambda"
  endpoint   = aws_lambda_function.feedback_lambda.arn
  depends_on = [aws_lambda_permission.feedback_sns_lambda_permission]
}

resource "aws_lambda_function_event_invoke_config" "feedback_sqs_lambda_destination" {
  function_name = aws_lambda_function.feedback_lambda.function_name
  
  destination_config {
    on_success {
      destination = aws_sqs_queue.feedback_sqs.arn
    }
  }
}
