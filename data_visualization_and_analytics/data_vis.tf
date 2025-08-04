data "aws_iam_policy_document" "data_vis_lambda_exec_policy_document" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_dynamodb_table" "feedback_table" {
  name = "BikeFeedback"
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

resource "aws_iam_role" "data_vis_lambda_exec_role" {
  name = "${var.project_name}-DataVisLambdaExecRole"
  assume_role_policy = data.aws_iam_policy_document.data_vis_lambda_exec_policy_document
}


