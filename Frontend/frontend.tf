
# variable "cognito_user_pool_id" {
#   description = "ID of the Cognito User Pool"
#   type        = string
# }

# variable "cognito_user_pool_client_id" {
#   description = "ID of the Cognito User Pool Client"
#   type        = string
# }

data "external" "frontend_build" {
  program = ["bash", "-c", <<EOF
  npm run build >&2 && echo "{\"build\": \"./build\"}"
  EOF
  ]
  working_dir = "${path.module}/cognito-auth-frontend"
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "sdp-frontend-bucket"
}

resource "aws_s3_bucket_ownership_controls" "frontend_ownership_ctl" {
  bucket = aws_s3_bucket.frontend_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_access_block" {
  bucket = aws_s3_bucket.frontend_bucket.id
  block_public_acls = false
  block_public_policy = false
}

resource "aws_s3_bucket_acl" "frontend_acl" {
  bucket = aws_s3_bucket.frontend_bucket.id
  acl = "public-read"

  depends_on = [ aws_s3_bucket_public_access_block.frontend_access_block ]
}

resource "aws_s3_object" "frontend_objects" {
  bucket = aws_s3_bucket.frontend_bucket.id

  for_each = fileset("${path.module}/cognito-auth-frontend/build/", "**/*")
  key = each.value
  source = "${path.module}/cognito-auth-frontend/${data.external.frontend_build.result.build}/${each.value}"
  content_type = "text/html"
}

resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
        {
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        }
    ]
  })
  depends_on = [ aws_s3_bucket_public_access_block.frontend_access_block ]
}

resource "aws_s3_bucket_website_configuration" "frontend_website_conf" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }
}
