data "archive_file" "define_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/define_auth_lambda.py"
  output_path = "./lambda_zip_archives/define_auth_lambda.zip"
}

data "archive_file" "create_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/create_auth_lambda.py"
  output_path = "./lambda_zip_archives/create_auth_lambda.zip"
}

data "archive_file" "verify_auth_lambda" {
  type        = "zip"
  source_file = "./cognito/verify_auth_lambda.py"
  output_path = "./lambda_zip_archives/verify_auth_lambda.zip"
}

data "archive_file" "pre_sign_up_lambda" {
  type        = "zip"
  source_file = "./cognito/pre_sign_up_lambda.py"
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

resource "aws_cognito_user_pool" "cognito_user_pool" {
  name = "CognitoUserPool"
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

resource "aws_dynamodb_table" "challenge_table" {
  name         = "UserChallenges"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  attribute {
    name = "userId"
    type = "S"
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
  value = aws_cognito_user_pool.cognito_user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value = aws_cognito_user_pool_client.user_pool_client.id
}
