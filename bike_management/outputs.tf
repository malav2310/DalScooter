data "aws_region" "current" {}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}"
}

output "bikes_table_name" {
  description = "Name of the bikes DynamoDB table"
  value       = aws_dynamodb_table.bikes.name
}

output "bookings_table_name" {
  description = "Name of the bookings DynamoDB table"
  value       = aws_dynamodb_table.bookings.name
}

output "api_endpoints" {
  description = "API endpoints for frontend integration"
  value = {
    get_bikes         = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes"
    check_availability = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes/availability"
    manage_bikes      = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes"
    book_bike         = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bookings"
  }
}
