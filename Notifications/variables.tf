# variables.tf
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dalscooter"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}