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
}

module "message_passing" {
  source = "./message_passing"
}

module "frontend" {
  source="./Frontend"

  cognito_user_pool_id = module.cognito.cognito_user_pool_id
  cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
}

module "data_visualization_and_analytics" {
  source = "./data_visualization_and_analytics"
}
