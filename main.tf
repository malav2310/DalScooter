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

  aws_region             = "us-east-1"
  submit_feedback_lambda = module.data_visualization_and_analytics.submit_feedback_lambda
  get_feedback_lambda    = module.data_visualization_and_analytics.get_feedback_lambda
}

module "message_passing" {
  source = "./message_passing"
}

module "data_visualization_and_analytics" {
  source = "./data_visualization_and_analytics"

  project_name = "dalscooter"
}

module "notifications" {
  source = "./Notifications"
}

module "virtual_assistant" {
  source = "./virtual_assistant"

  project_name = "dalscooter"
  environment  = "dev"

  # Pass message passing module outputs
  feedback_sns_topic_arn = module.message_passing.feedback_sns_topic_arn
  feedback_lambda_arn    = module.message_passing.feedback_lambda_function_arn
}

module "bike_management" {
  source = "./bike_management"

  environment                       = "dev"
  project_name                      = "dalscooter"
  booking_references_table_name     = module.virtual_assistant.booking_references_table_name
  booking_references_table_arn      = module.virtual_assistant.booking_references_table_arn
  notification_processor_lambda_arn = module.notifications.notification_processor_function_arn
}

module "frontend" {
  source = "./frontend"

  region                      = "us-east-1"
  cognito_client_id           = module.cognito.cognito_user_pool_client_id
  user_role_arn               = module.cognito.user_role_arn
  get_feedback_lambda_name    = module.data_visualization_and_analytics.get_feedback_lambda_name
  submit_feedback_lambda_name = module.data_visualization_and_analytics.submit_feedback_lambda_name
  cognito_identity_id         = module.cognito.cognito_identity_id
  cognito_user_pool_id        = module.cognito.cognito_user_pool_id
  chatbot_api_gateway_url     = module.virtual_assistant.api_gateway_url
}
