
data "archive_file" "forward_message_lambda" {
  type = "zip"
  source_file = "./message_passing/forward_message_lambda.py"
  output_path = "./lambda_zip_archives/forward_message_lambda.zip"
}

data "aws_iam_policy_document" "sns_lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "sns_lambda_policies" {
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
    resources = []
  }
}

resource "aws_dynamodb_table" "communication_log_table" {
  name = "CommunicationLogTable"
  billing_mode = "PAY_PER_REQUEST"
}

resource "aws_sns_topic" "feedback_sns" {
  name = "FeedbackSNS"
}

resource "aws_sqs_queue" "feedback_sqs" {
  name = "FeedbackSQS"
}
