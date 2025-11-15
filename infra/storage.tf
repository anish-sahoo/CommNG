# ------------------------------------------------------------
# S3 Bucket for Application Files
# ------------------------------------------------------------

# Random suffix for unique bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "comm_ng_files" {
  bucket = "${local.name_prefix}-files-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-files"
  })
}

resource "aws_s3_bucket_versioning" "comm_ng_files_versioning" {
  bucket = aws_s3_bucket.comm_ng_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "comm_ng_files_sse" {
  bucket = aws_s3_bucket.comm_ng_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "comm_ng_files_lifecycle" {
  bucket = aws_s3_bucket.comm_ng_files.id

  rule {
    id     = "expire-old-objects"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 365
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "comm_ng_files_cors" {
  bucket = aws_s3_bucket.comm_ng_files.id

  cors_rule {
    id = "allow-presigned-uploads"

    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = [
      "http://localhost:3001",
      "http://localhost:3000",
      "http://${aws_lb.main.dns_name}",
      "https://${aws_lb.main.dns_name}"
    ]
    expose_headers  = ["ETag", "x-amz-version-id"]
    max_age_seconds = 3000
  }
}

# ------------------------------------------------------------
# VPC Endpoint for S3
# ------------------------------------------------------------

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = data.aws_route_tables.default_vpc.ids

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAppBucket"
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.comm_ng_files.arn,
          "${aws_s3_bucket.comm_ng_files.arn}/*"
        ]
      },
      {
        Sid       = "AllowEcrLayerBucket"
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${local.ecr_layer_bucket_arn}/*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# ------------------------------------------------------------
# ECR Repositories
# ------------------------------------------------------------

resource "aws_ecr_repository" "server" {
  name                 = "${var.project_name}-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-server"
  })
}

resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web"
  })
}

# ------------------------------------------------------------
# ECR Repository Policies for ECS Task Execution Role
# ------------------------------------------------------------

resource "aws_ecr_repository_policy" "server" {
  repository = aws_ecr_repository.server.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSTaskExecutionRole"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task_execution.arn
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

resource "aws_ecr_repository_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSTaskExecutionRole"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task_execution.arn
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# ------------------------------------------------------------
# Resource Group
# ------------------------------------------------------------

resource "aws_resourcegroups_group" "commng_dev" {
  name        = "${title(var.project_name)}_${title(var.environment)}"
  description = "Resource group for ${title(var.project_name)} ${title(var.environment)} environment"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [
        {
          Key    = "Project"
          Values = [var.project_name]
        },
        {
          Key    = "Environment"
          Values = [var.environment]
        }
      ]
    })
  }

  tags = merge(local.common_tags, {
    Name = "${title(var.project_name)}_${title(var.environment)}"
  })
}
