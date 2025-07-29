# outputs.tf
output "notification_processor_function_arn" {
  description = "ARN of the main notification processor Lambda function"
  value       = aws_lambda_function.notification_processor.arn
}

output "notification_queue_url" {
  description = "URL of the notification SQS queue"
  value       = aws_sqs_queue.notification_queue.id
}

output "notification_queue_arn" {
  description = "ARN of the notification SQS queue"
  value       = aws_sqs_queue.notification_queue.arn
}

output "registration_topic_arn" {
  description = "ARN of the registration notification topic"
  value       = aws_sns_topic.registration_notification.arn
}

output "login_topic_arn" {
  description = "ARN of the login notification topic"
  value       = aws_sns_topic.login_notification.arn
}

output "booking_confirmation_topic_arn" {
  description = "ARN of the booking confirmation topic"
  value       = aws_sns_topic.booking_confirmation.arn
}

output "booking_failure_topic_arn" {
  description = "ARN of the booking failure topic"
  value       = aws_sns_topic.booking_failure.arn
}

output "notification_logs_table_name" {
  description = "Name of the notification logs DynamoDB table"
  value       = aws_dynamodb_table.notification_logs.name
}