variable "aws_region" {
  type = string
}

variable "submit_feedback_lambda" {
  type = string
}

variable "get_feedback_lambda" {
  type = string
}

data "archive_file" "define_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/functions/define_auth_lambda.py"
  output_path = "./lambda_zip_archives/define_auth_lambda.zip"
}

data "archive_file" "create_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/functions/create_auth_lambda.py"
  output_path = "./lambda_zip_archives/create_auth_lambda.zip"
}

data "archive_file" "verify_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/functions/verify_auth_lambda.py"
  output_path = "./lambda_zip_archives/verify_auth_lambda.zip"
}

data "archive_file" "pre_sign_up_lambda" {
  type        = "zip"
  source_file = "./cognito/functions/pre_sign_up_lambda.py"
  output_path = "./lambda_zip_archives/pre_sign_up_lambda.zip"
}

data "aws_iam_policy_document" "cognito_lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "cognito_lambda_policies" {
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
      "cognito-idp:DescribeUserPool",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminInitiateAuth"
    ]
    resources = ["*"]
  }
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem"
    ]
    resources = [aws_dynamodb_table.challenge_table.arn]
  }
}

data "aws_iam_policy_document" "cognito_user_assume_document" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "cognito-identity.amazonaws.com:aud"

      values = [aws_cognito_identity_pool.user_identity_pool.id]
    }
  }
}

data "aws_iam_policy_document" "user_role_permissions" {
  statement {
    effect = "Allow"
    # Fill the rest with the permissions to be used with this role
    actions = ["lambda:InvokeFunction"]
    # resources = [
    #   # var.get_feedback_lambda,
    #   # var.submit_feedback_lambda
    # ]
    resources = ["*"]
  }
}

resource "aws_cognito_user_pool" "cognito_user_pool" {
  name = "CognitoUserPool"
  # auto_verified_attributes = ["email"]
  lambda_config {
    define_auth_challenge          = aws_lambda_function.define_auth_lambda.arn
    create_auth_challenge          = aws_lambda_function.create_auth_lambda.arn
    verify_auth_challenge_response = aws_lambda_function.verify_auth_lambda.arn
    pre_sign_up                    = aws_lambda_function.pre_sign_up_lambda.arn
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name                = "UserPoolClient"
  user_pool_id        = aws_cognito_user_pool.cognito_user_pool.id
  generate_secret     = false
  explicit_auth_flows = ["ALLOW_CUSTOM_AUTH", "ALLOW_ADMIN_USER_PASSWORD_AUTH"]
}

resource "aws_cognito_identity_pool" "user_identity_pool" {
  identity_pool_name               = "UserIdentityPool"
  allow_unauthenticated_identities = true
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.user_pool_client.id
    provider_name           = aws_cognito_user_pool.cognito_user_pool.endpoint
    server_side_token_check = true
  }
}

resource "aws_dynamodb_table" "challenge_table" {
  name         = "UserChallenges"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_iam_role" "user_role" {
  name               = "UserRole"
  assume_role_policy = data.aws_iam_policy_document.cognito_user_assume_document.json
}

resource "aws_iam_policy" "user_role_policy" {
  name   = "UserRolePolicy"
  policy = data.aws_iam_policy_document.user_role_permissions.json
}

resource "aws_iam_role_policy_attachment" "user_role_policy_attachment" {
  role       = aws_iam_role.user_role.name
  policy_arn = aws_iam_policy.user_role_policy.arn
}

resource "aws_cognito_identity_pool_roles_attachment" "user_role_identity_pool_attachment" {
  identity_pool_id = aws_cognito_identity_pool.user_identity_pool.id
  roles = {
    "authenticated" = aws_iam_role.user_role.arn
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name               = "LambdaExecRole"
  assume_role_policy = data.aws_iam_policy_document.cognito_lambda_assume_role.json
}

resource "aws_iam_policy" "lambda_cognito_policy" {
  name   = "LambdaCognitoPolicy"
  policy = data.aws_iam_policy_document.cognito_lambda_policies.json
}

resource "aws_iam_role_policy_attachment" "lambda_role_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_cognito_policy.arn
}

resource "aws_lambda_permission" "define_auth_permission" {
  function_name = aws_lambda_function.define_auth_lambda.arn
  action        = "lambda:InvokeFunction"
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.cognito_user_pool.arn
}

resource "aws_lambda_function" "define_auth_lambda" {
  function_name    = "DefineAuthLambda"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "define_auth_lambda.lambda_handler"
  filename         = data.archive_file.define_auth_lambda.output_path
  source_code_hash = data.archive_file.define_auth_lambda.output_base64sha256
  runtime          = "python3.11"
}

resource "aws_lambda_permission" "create_auth_permission" {
  function_name = aws_lambda_function.create_auth_lambda.arn
  action        = "lambda:InvokeFunction"
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.cognito_user_pool.arn
}

resource "aws_lambda_function" "create_auth_lambda" {
  function_name    = "CreateAuthLambda"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "create_auth_lambda.lambda_handler"
  filename         = data.archive_file.create_auth_lambda.output_path
  source_code_hash = data.archive_file.create_auth_lambda.output_base64sha256
  runtime          = "python3.11"
}

resource "aws_lambda_permission" "verify_auth_permission" {
  function_name = aws_lambda_function.verify_auth_lambda.arn
  action        = "lambda:InvokeFunction"
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.cognito_user_pool.arn
}

resource "aws_lambda_function" "verify_auth_lambda" {
  function_name    = "VerifyAuthLambda"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "verify_auth_lambda.lambda_handler"
  filename         = data.archive_file.verify_auth_lambda.output_path
  source_code_hash = data.archive_file.verify_auth_lambda.output_base64sha256
  runtime          = "python3.11"
}

resource "aws_lambda_permission" "pre_sign_up_permission" {
  function_name = aws_lambda_function.pre_sign_up_lambda.arn
  action        = "lambda:InvokeFunction"
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.cognito_user_pool.arn
}

resource "aws_lambda_function" "pre_sign_up_lambda" {
  function_name    = "PreSignUpLambda"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "pre_sign_up_lambda.lambda_handler"
  filename         = data.archive_file.pre_sign_up_lambda.output_path
  source_code_hash = data.archive_file.pre_sign_up_lambda.output_base64sha256
  runtime          = "python3.11"
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.cognito_user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "user_role_arn" {
  description = "User Role ARN"
  value       = aws_iam_role.user_role.arn
}

output "cognito_identity_id" {
  value = aws_cognito_identity_pool.user_identity_pool.id
}

# Data source to zip the notification processor Lambda code
data "archive_file" "frontend_test_lambda_code" {
  type        = "zip"
  output_path = "${path.module}/test_lambda.zip"

  source {
    content  = <<EOF
    def lambda_handler(event, context):
      print("hello, world!")

    EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "sqs_notification_processor" {
  function_name = "frontend-test"
  runtime       = "python3.9"
  handler       = "index.lambda_handler"
  role          = aws_iam_role.lambda_exec_role.arn
  timeout       = 30

  filename         = data.archive_file.frontend_test_lambda_code.output_path
  source_code_hash = data.archive_file.frontend_test_lambda_code.output_base64sha256
}
