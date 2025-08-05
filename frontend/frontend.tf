variable "region" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_identity_id" {
  type = string
}

variable "user_role_arn" {
  type = string
}

variable "get_feedback_lambda_name" {
  type = string
}

variable "submit_feedback_lambda_name" {
  type = string
}

data "external" "set_environment" {
  program = ["bash", "-c", <<EOF
  echo NEXT_PUBLIC_REGION = \'${var.region}\' > .env
  echo NEXT_PUBLIC_COGNITO_CLIENT_ID = \'${var.cognito_client_id}\' >> .env
  echo NEXT_PUBLIC_GET_FEEDBACK_LAMBDA_NAME = \'${var.get_feedback_lambda_name}\' >> .env
  echo NEXT_PUBLIC_SUBMIT_FEEDBACK_LAMBDA_NAME = \'${var.submit_feedback_lambda_name}\' >> .env
  echo NEXT_PUBLIC_USER_ROLE_ARN = \'${var.user_role_arn}\' >> .env
  echo NEXT_PUBLIC_IDENTITY_ID = \'${var.cognito_identity_id}\' >> .env
  echo NEXT_PUBLIC_USER_POOL_ID = \'${var.cognito_user_pool_id}\' >> .env
  echo "{\"status\": \"ok\"}"
  EOF
  ]

  working_dir = "${path.module}/"
}

data "external" "build_next" {
  depends_on = [ data.external.set_environment ]
  program=["bash", "-c", <<EOF
  echo ${data.external.set_environment.id} >&2 /dev/null
  npm run build >&2 && echo "{\"build\": \".next\"}"
  EOF
  ]

  working_dir = "${path.module}/"
}

