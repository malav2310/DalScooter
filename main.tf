terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "cognito" {
  source = "./cognito"

  aws_region = "us-east-1"
  # submit_feedback_lambda = module.data_visualization_and_analytics.submit_feedback_lambda
  # get_feedback_lambda    = module.data_visualization_and_analytics.get_feedback_lambda

  submit_feedback_lambda = ""
  get_feedback_lambda    = ""
}

# module "message_passing" {
#   source = "./message_passing"
# }

#module "frontend" {
#  source="./Frontend"
#
#  cognito_user_pool_id = module.cognito.cognito_user_pool_id
#  cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
#}

# module "data_visualization_and_analytics" {
#   source = "./data_visualization_and_analytics"

#   project_name = "dalscooter"
# }

# module "notifications" {
#   source = "./Notifications"
# }

# module "virtual_assistant" {
#   source = "./virtual_assistant"

#   project_name = "dalscooter"
#   environment  = "dev"
# }

# module "bike_management" {
#   source = "./bike_management"

#   environment  = "dev"
#   project_name = "dalscooter"
# }

module "frontend" {
  source = "./frontend"

  region            = "us-east-1"
  cognito_client_id = module.cognito.cognito_user_pool_client_id
  user_role_arn     = module.cognito.user_role_arn
  # get_feedback_lambda_name = module.data_visualization_and_analytics.get_feedback_lambda_name
  # submit_feedback_lambda_name = module.data_visualization_and_analytics.submit_feedback_lambda_name

  get_feedback_lambda_name    = ""
  submit_feedback_lambda_name = ""
  cognito_identity_id         = module.cognito.cognito_identity_id
  cognito_user_pool_id        = module.cognito.cognito_user_pool_id
}
