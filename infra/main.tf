terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Whether to create a bucket policy and public-access-block allowing public reads.
# Default false because many orgs block public policies at account-level.
variable "create_public_bucket_policy" {
  type    = bool
  default = false
}

# Whether to create IAM resources (users, policies, roles, access keys).
# Default false to allow running Terraform with limited SSO permissions.
variable "create_iam_resources" {
  type    = bool
  default = false
}

# ------------------------------------------------------------
# Get default VPC and subnet group
# ------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_db_subnet_group" "default" {
  # Lookup the existing default VPC subnet group by its real name
  name = "default-vpc-059af42cd1884a8cc"
}

data "aws_subnets" "default_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_subnets" "default_vpc_supported_az" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = [
      "us-east-1a",
      "us-east-1b",
      "us-east-1c",
      "us-east-1d",
      "us-east-1f"
    ]
  }
}

resource "aws_security_group" "dev_db_public" {
  name        = "dev-db-comm-ng-public"
  description = "Allow public PostgreSQL access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL from anywhere"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dev-db-comm-ng-public"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_security_group" "dev_cache_public" {
  name        = "dev-comm-ng-cache-valkey-redis"
  description = "Allow public Valkey/Redis access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
  description = "Valkey/Redis from anywhere"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dev-comm-ng-cache-valkey-redis"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# RDS PostgreSQL instance (AWS-managed password)
# ------------------------------------------------------------
resource "aws_db_instance" "dev_db_comm_ng" {
  identifier             = "dev-db-comm-ng"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  db_name                = "comm_ng"

  # Storage
  allocated_storage      = 20
  max_allocated_storage  = 20 # disables autoscaling
  storage_type           = "gp3"

  # Authentication
  username                     = "comm_ng_dev_user"
  manage_master_user_password   = true   # <-- AWS generates & stores the password

  # Network
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.dev_db_public.id]
  db_subnet_group_name   = data.aws_db_subnet_group.default.name

  # Availability
  multi_az               = false

  # Monitoring & logs
  monitoring_interval    = 0  # standard monitoring only
  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "iam-db-auth-error"
  ]

  # Backups & maintenance (default)
  backup_retention_period = 0 # dev/test template
  skip_final_snapshot      = true
  deletion_protection      = false

  # Tags
  tags = {
    Name        = "dev-db-comm-ng"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# ElastiCache Valkey (Serverless)
# ------------------------------------------------------------
resource "aws_elasticache_serverless_cache" "dev_cache_valkey" {
  name                  = "dev-comm-ng-valkey-redis"
  description           = "Dev Valkey/Redis serverless cache"
  engine                = "valkey"
  major_engine_version  = "8"
  security_group_ids    = [aws_security_group.dev_cache_public.id]
  subnet_ids            = slice(data.aws_subnets.default_vpc_supported_az.ids, 0, 2) # Supported AZs only; AWS requires between 2 and 3 subnets
  user_group_id         = aws_elasticache_user_group.valkey_default.user_group_id

  cache_usage_limits {
    data_storage {
      unit    = "GB"
      maximum = 2
    }

    ecpu_per_second {
      maximum = 1000
    }
  }

  tags = {
    Name        = "dev-comm-ng-valkey-redis"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# Valkey authentication secret and IAM user group
# ------------------------------------------------------------
resource "random_password" "cache_auth" {
  length          = 32
  special         = true
  override_special = "!@#%^*+-_=~"
}

resource "aws_secretsmanager_secret" "cache_auth" {
  name        = "dev/comm-ng/cache-auth"
  description = "Cache AUTH token for dev environment"

  tags = {
    Name        = "dev-comm-ng-cache-auth"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_secretsmanager_secret_version" "cache_auth_current" {
  secret_id     = aws_secretsmanager_secret.cache_auth.id
  secret_string = random_password.cache_auth.result
}

resource "aws_elasticache_user" "valkey_default" {
  user_id       = "comm-ng-dev"
  user_name     = "default"
  engine        = "valkey"
  passwords     = [random_password.cache_auth.result]
  access_string = "on ~* +@all"

  tags = {
    Name        = "dev-comm-ng-cache-user"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_elasticache_user_group" "valkey_default" {
  user_group_id = "comm-ng-dev-group"
  engine        = "valkey"
  user_ids      = [aws_elasticache_user.valkey_default.user_id]

  tags = {
    Name        = "dev-comm-ng-cache-user-group"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# Output information
# ------------------------------------------------------------
output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.dev_db_comm_ng.endpoint
}

output "db_master_username" {
  description = "Master username"
  value       = aws_db_instance.dev_db_comm_ng.username
}

output "db_master_password_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret where the password is stored"
  value       = aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn
}

output "s3_bucket_name" {
  description = "S3 bucket name used for application files"
  value       = aws_s3_bucket.comm_ng_files.bucket
}

output "s3_bucket_domain" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.comm_ng_files.bucket_domain_name
}

output "s3_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret storing server S3 credentials"
  value       = var.create_iam_resources ? aws_secretsmanager_secret.comm_ng_s3_credentials[0].arn : null
}

output "s3_policy_arn" {
  description = "ARN of the IAM policy granting S3 access for CommNG"
  value       = var.create_iam_resources ? aws_iam_policy.comm_ng_s3_policy[0].arn : null
}

output "s3_task_role_arn" {
  description = "ARN of the IAM role to use for ECS tasks"
  value       = var.create_iam_resources ? aws_iam_role.comm_ng_task_role[0].arn : null
}

# ------------------------------------------------------------
# S3 bucket for application files (public view, server-only uploads)
# ------------------------------------------------------------

resource "aws_s3_bucket" "comm_ng_files" {
  bucket = "dev-comm-ng-files-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "dev-comm-ng-files"
    Environment = "dev"
    Project     = "comm_ng"
  }
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

# Allow public reads on objects, but keep writes restricted to the server IAM principal below
resource "aws_s3_bucket_policy" "comm_ng_files_public_read" {
  count  = var.create_public_bucket_policy ? 1 : 0
  bucket = aws_s3_bucket.comm_ng_files.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "AllowPublicReadGetObject"
        Effect = "Allow"
        Principal = "*"
        Action = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.comm_ng_files.arn}/*"]
      },
      {
        Sid = "DenyPublicPutObject"
        Effect = "Deny"
        Principal = "*"
        Action = ["s3:PutObject","s3:DeleteObject","s3:PutObjectAcl"]
        Resource = ["${aws_s3_bucket.comm_ng_files.arn}/*"]
        Condition = {
          Bool = {
            "aws:PrincipalIsAWSAccount" = false
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "comm_ng_files_cors" {
  bucket = aws_s3_bucket.comm_ng_files.id

  cors_rule {
    id = "allow-presigned-uploads"

    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["http://localhost:3001", "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}


# Public access block must allow public policies/ACLs for public reads to work
resource "aws_s3_bucket_public_access_block" "comm_ng_files" {
  count  = var.create_public_bucket_policy ? 1 : 0
  bucket = aws_s3_bucket.comm_ng_files.id

  block_public_acls   = false
  block_public_policy = false
  ignore_public_acls  = false
  restrict_public_buckets = false
}

# A tiny random id for a stable but unique bucket name in dev
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# IAM user for the server to perform uploads/deletes. The application should use these creds.
resource "aws_iam_user" "comm_ng_server" {
  count = var.create_iam_resources ? 1 : 0
  name = "comm-ng-server"
  tags = {
    Project = "comm_ng"
    Environment = "dev"
  }
}

resource "aws_iam_policy" "comm_ng_s3_policy" {
  count = var.create_iam_resources ? 1 : 0
  name        = "comm-ng-s3-policy"
  description = "Allow CommNG server or ECS tasks to manage objects in the CommNG files bucket"

  # Do not require PutObjectAcl — presigned uploads and private objects are used.
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.comm_ng_files.arn}/*",
          "${aws_s3_bucket.comm_ng_files.arn}"
        ]
      }
    ]
  })
  tags = {
    Project     = "comm_ng"
    Environment = "dev"
  }
}

# Attach the managed policy to the local IAM user (for dev using long-lived creds)
resource "aws_iam_policy_attachment" "comm_ng_user_attach" {
  count = var.create_iam_resources ? 1 : 0
  name       = "comm-ng-user-s3-attach"
  policy_arn = aws_iam_policy.comm_ng_s3_policy[0].arn
  users      = [aws_iam_user.comm_ng_server[0].name]
}

# IAM role for ECS tasks to assume when running in production; attach same S3 policy
resource "aws_iam_role" "comm_ng_task_role" {
  count = var.create_iam_resources ? 1 : 0
  name = "comm-ng-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project     = "comm_ng"
    Environment = "dev"
  }
}

resource "aws_iam_policy_attachment" "comm_ng_role_attach" {
  count = var.create_iam_resources ? 1 : 0
  name       = "comm-ng-role-s3-attach"
  policy_arn = aws_iam_policy.comm_ng_s3_policy[0].arn
  roles      = [aws_iam_role.comm_ng_task_role[0].name]
}

# Create access keys for the server IAM user and store them in Secrets Manager
resource "aws_iam_access_key" "comm_ng_server_key" {
  count = var.create_iam_resources ? 1 : 0
  user = aws_iam_user.comm_ng_server[0].name
}

resource "aws_secretsmanager_secret" "comm_ng_s3_credentials" {
  count = var.create_iam_resources ? 1 : 0
  name        = "dev/comm-ng/s3/credentials"
  description = "Access key for CommNG server to upload files to S3"

  tags = {
    Project     = "comm_ng"
    Environment = "dev"
  }
}

resource "aws_secretsmanager_secret_version" "comm_ng_s3_credentials_current" {
  count = var.create_iam_resources ? 1 : 0
  secret_id     = aws_secretsmanager_secret.comm_ng_s3_credentials[0].id
  secret_string = jsonencode({
    access_key_id     = aws_iam_access_key.comm_ng_server_key[0].id,
    secret_access_key = aws_iam_access_key.comm_ng_server_key[0].secret
  })
}

