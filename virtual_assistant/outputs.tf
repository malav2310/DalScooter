# modules/virtual-assistant/outputs.tf

output "bot_id" {
  description = "The ID of the Lex bot"
  value       = aws_lexv2models_bot.dalscooter_bot.id
}

output "bot_name" {
  description = "The name of the Lex bot"
  value       = aws_lexv2models_bot.dalscooter_bot.name
}

output "bot_arn" {
  description = "The ARN of the Lex bot"
  value       = aws_lexv2models_bot.dalscooter_bot.arn
}

output "api_gateway_url" {
  description = "The API Gateway endpoint URL for the chatbot"
  value       = "https://${aws_api_gateway_rest_api.chatbot_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${var.environment}/chat"
}

output "api_gateway_id" {
  description = "The ID of the API Gateway"
  value       = aws_api_gateway_rest_api.chatbot_api.id
}

output "api_gateway_stage_name" {
  description = "The name of the API Gateway stage"
  value       = aws_api_gateway_stage.chatbot_stage.stage_name
}

output "router_lambda_arn" {
  description = "ARN of the router Lambda function"
  value       = aws_lambda_function.router_handler.arn
}

output "api_proxy_lambda_arn" {
  description = "ARN of the API proxy Lambda function"
  value       = aws_lambda_function.api_proxy_handler.arn
}

output "knowledge_base_table_name" {
  description = "Name of the DynamoDB knowledge base table"
  value       = aws_dynamodb_table.bot_knowledge_base.name
}

output "booking_references_table_name" {
  description = "Name of the DynamoDB booking references table"
  value       = aws_dynamodb_table.booking_references.name
}

output "customer_concerns_table_name" {
  description = "Name of the DynamoDB customer concerns table"
  value       = aws_dynamodb_table.customer_concerns.name
}

output "lambda_functions" {
  description = "Lambda function ARNs"
  value = {
    router_handler    = aws_lambda_function.router_handler.arn
    api_proxy_handler = aws_lambda_function.api_proxy_handler.arn
    faq_handler       = aws_lambda_function.faq_handler.arn
    booking_handler   = aws_lambda_function.booking_handler.arn
    concern_handler   = aws_lambda_function.concern_handler.arn
  }
}
