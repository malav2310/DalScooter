########################
# API - WIDE RESOURCES #
########################

resource "aws_api_gateway_rest_api" "bike_api" {
  name        = "dalscooter-bike-api"
  description = "API for DALScooter bike management"
  endpoint_configuration { types = ["REGIONAL"] }
}

#####################################
# CLOUDWATCH LOGGING CONFIGURATION  #
#####################################

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/dalscooter-bike-api"
  retention_in_days = 14
}

resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "dalscooter-api-gw-cw-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cw_attach" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

######################
# API RESOURCES      #
######################

resource "aws_api_gateway_resource" "bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_rest_api.bike_api.root_resource_id
  path_part   = "bikes"
}

resource "aws_api_gateway_resource" "availability" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_resource.bikes.id
  path_part   = "availability"
}

resource "aws_api_gateway_resource" "bookings" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_rest_api.bike_api.root_resource_id
  path_part   = "bookings"
}

############################
# METHODS & INTEGRATIONS   #
############################

# ---------- GET /bikes ----------
resource "aws_api_gateway_method" "get_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_bikes_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bike_api.id
  resource_id             = aws_api_gateway_resource.bikes.id
  http_method             = aws_api_gateway_method.get_bikes.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_bikes.invoke_arn
}

# Add method response for GET /bikes
resource "aws_api_gateway_method_response" "get_bikes_response" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.get_bikes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "get_bikes_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.get_bikes.http_method
  status_code = aws_api_gateway_method_response.get_bikes_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.get_bikes_integration]
}

# ---------- POST /bikes (add) ----------
resource "aws_api_gateway_method" "manage_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "manage_bikes_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bike_api.id
  resource_id             = aws_api_gateway_resource.bikes.id
  http_method             = aws_api_gateway_method.manage_bikes.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.manage_bikes.invoke_arn
}

resource "aws_api_gateway_method_response" "manage_bikes_response" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.manage_bikes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "manage_bikes_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.manage_bikes.http_method
  status_code = aws_api_gateway_method_response.manage_bikes_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.manage_bikes_integration]
}

# ---------- PUT /bikes (update) ----------
resource "aws_api_gateway_method" "update_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_bikes_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bike_api.id
  resource_id             = aws_api_gateway_resource.bikes.id
  http_method             = aws_api_gateway_method.update_bikes.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.manage_bikes.invoke_arn
}

resource "aws_api_gateway_method_response" "update_bikes_response" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.update_bikes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "update_bikes_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.update_bikes.http_method
  status_code = aws_api_gateway_method_response.update_bikes_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.update_bikes_integration]
}

# ---------- GET /bikes/availability ----------
resource "aws_api_gateway_method" "check_availability" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "check_availability_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bike_api.id
  resource_id             = aws_api_gateway_resource.availability.id
  http_method             = aws_api_gateway_method.check_availability.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.check_availability.invoke_arn
}

# Add method response for GET /bikes/availability
resource "aws_api_gateway_method_response" "check_availability_response" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.check_availability.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "check_availability_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.check_availability.http_method
  status_code = aws_api_gateway_method_response.check_availability_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.check_availability_integration]
}

# ---------- POST /bookings ----------
resource "aws_api_gateway_method" "book_bike" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "book_bike_integration" {
  rest_api_id             = aws_api_gateway_rest_api.bike_api.id
  resource_id             = aws_api_gateway_resource.bookings.id
  http_method             = aws_api_gateway_method.book_bike.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.book_bike.invoke_arn
}

resource "aws_api_gateway_method_response" "book_bike_response" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.book_bike.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "book_bike_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.book_bike.http_method
  status_code = aws_api_gateway_method_response.book_bike_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.book_bike_integration]
}

#####################################
# LAMBDA PERMISSIONS FOR API GATEWAY
#####################################

resource "aws_lambda_permission" "perm_get_bikes" {
  statement_id  = "AllowGetBikes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_bikes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "perm_manage_bikes" {
  statement_id  = "AllowManageBikes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.manage_bikes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "perm_check_avail" {
  statement_id  = "AllowCheckAvailability"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_availability.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "perm_book_bike" {
  statement_id  = "AllowBookBike"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.book_bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

#############################
# DEPLOYMENT & STAGE         #
#############################

resource "aws_api_gateway_deployment" "bike_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id

  depends_on = [
    aws_api_gateway_method.get_bikes,
    aws_api_gateway_method.manage_bikes,
    aws_api_gateway_method.update_bikes,
    aws_api_gateway_method.check_availability,
    aws_api_gateway_method.book_bike,
    aws_api_gateway_integration.get_bikes_integration,
    aws_api_gateway_integration.manage_bikes_integration,
    aws_api_gateway_integration.update_bikes_integration,
    aws_api_gateway_integration.check_availability_integration,
    aws_api_gateway_integration.book_bike_integration,
    # Add CORS methods
    aws_api_gateway_method.bikes_options,
    aws_api_gateway_method.bookings_options,
    aws_api_gateway_method.availability_options
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.bikes.id,
      aws_api_gateway_resource.availability.id,
      aws_api_gateway_resource.bookings.id,
      aws_api_gateway_method.update_bikes.id,
      aws_api_gateway_method.get_bikes.id,
      aws_api_gateway_method.check_availability.id,
      aws_api_gateway_method.book_bike.id
    ]))
  }

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "bike_api_stage" {
  deployment_id = aws_api_gateway_deployment.bike_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      status      = "$context.status"
      requestId   = "$context.requestId"
      resource    = "$context.resourcePath"
      method      = "$context.httpMethod"
      ip          = "$context.identity.sourceIp"
      userAgent   = "$context.identity.userAgent"
      responseLen = "$context.responseLength"
    })
  }

  depends_on = [
    aws_cloudwatch_log_group.api_gateway_logs,
    aws_api_gateway_account.api_gateway_account
  ]
}

#############################
#           CORS            #
#############################

# OPTIONS /bikes
resource "aws_api_gateway_method" "bikes_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "bikes_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  type        = "MOCK"
  request_templates = { "application/json" = "{\"statusCode\":200}" }
}

resource "aws_api_gateway_method_response" "bikes_options_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "bikes_options_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = aws_api_gateway_method_response.bikes_options_resp.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.bikes_options_integration]
}

# OPTIONS /bookings
resource "aws_api_gateway_method" "bookings_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "bookings_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  type        = "MOCK"
  request_templates = { "application/json" = "{\"statusCode\":200}" }
}

resource "aws_api_gateway_method_response" "bookings_options_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "bookings_options_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  status_code = aws_api_gateway_method_response.bookings_options_resp.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.bookings_options_integration]
}

# OPTIONS /bikes/availability
resource "aws_api_gateway_method" "availability_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "availability_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  type        = "MOCK"
  request_templates = { "application/json" = "{\"statusCode\":200}" }
}

resource "aws_api_gateway_method_response" "availability_options_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "availability_options_integ_resp" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  status_code = aws_api_gateway_method_response.availability_options_resp.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.availability_options_integration]
}