output "feedback_sns_topic_arn" {
  description = "ARN of the SNS topic for feedback/concerns"
  value       = aws_sns_topic.feedback_sns.arn
}

output "feedback_lambda_function_name" {
  description = "Name of the feedback lambda function"
  value       = aws_lambda_function.feedback_lambda.function_name
}

output "feedback_lambda_function_arn" {
  description = "ARN of the feedback lambda function"
  value       = aws_lambda_function.feedback_lambda.arn
}

output "communication_log_table_name" {
  description = "Name of the communication log DynamoDB table"
  value       = aws_dynamodb_table.communication_log_table.name
}
