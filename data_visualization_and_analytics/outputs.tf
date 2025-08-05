output "api_url" {
  value       = "${aws_api_gateway_stage.prod.invoke_url}/feedback"
  description = "API Gateway endpoint for feedback"
}

output "submit_feedback_lambda" {
  value = aws_lambda_function.submit_feedback.arn
}

output "get_feedback_lambda" {
  value = aws_lambda_function.get_feedback.arn
}

output "submit_feedback_lambda_name" {
  value = aws_lambda_function.submit_feedback.function_name
}

output "get_feedback_lambda_name" {
  value = aws_lambda_function.get_feedback.function_name
}

output "lambda_execution_role_arn" {
  value       = aws_iam_role.lambda_execution_role.arn
  description = "ARN of the Lambda execution role"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.feedback_table.name
  description = "Name of the DynamoDB table"
}
