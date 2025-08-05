# modules/virtual-assistant/variables.tf

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "feedback_sns_topic_arn" {
  description = "ARN of the SNS topic for forwarding concerns"
  type        = string
}

variable "feedback_lambda_arn" {
  description = "ARN of the feedback lambda function"
  type        = string
}