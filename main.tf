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

# module "cognito" {
#   source = "./cognito"
# }

# module "message_passing" {
#   source = "./message_passing"
# }

module "frontend" {
  source="./Frontend"

  # cognito_user_pool_id = module.cognito.cognito_user_pool_id
  # cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
}
