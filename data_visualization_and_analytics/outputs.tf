output "api_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/feedback"
  description = "API Gateway endpoint for feedback"
}

output "submit_feedback_lambda" {
  value = aws_lambda_function.submit_feedback.arn
}

output "get_feedback_lambda" {
  value = aws_lambda_function.get_feedback.arn
}
