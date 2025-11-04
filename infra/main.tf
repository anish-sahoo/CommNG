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

# ------------------------------------------------------------
# VAPID Keys Secret (manually populated)
# ------------------------------------------------------------
resource "aws_secretsmanager_secret" "vapid_keys" {
  name        = "dev/comm-ng/vapid-keys"
  description = "VAPID keys for push notifications - manually populate after creation"

  tags = {
    Name        = "dev-comm-ng-vapid-keys"
    Environment = "dev"
    Project     = "comm_ng"
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to the secret value since it's manually managed
      recovery_window_in_days
    ]
  }
}

# Note: Secret value must be manually added in JSON format:
# {
#   "publicKey": "your-vapid-public-key",
#   "privateKey": "your-vapid-private-key",
#   "contactEmail": "mailto:admin@example.com"
# }

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

output "ecr_server_repository_url" {
  description = "ECR repository URL for server"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR repository URL for web"
  value       = aws_ecr_repository.web.repository_url
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_server_service_name" {
  description = "Name of the server ECS service"
  value       = aws_ecs_service.server.name
}

output "ecs_web_service_name" {
  description = "Name of the web ECS service"
  value       = aws_ecs_service.web.name
}

output "cache_endpoint" {
  description = "Valkey/Redis cache endpoint"
  value       = aws_elasticache_serverless_cache.dev_cache_valkey.endpoint[0].address
}

output "cache_auth_secret_arn" {
  description = "ARN of the cache authentication secret"
  value       = aws_secretsmanager_secret.cache_auth.arn
}

output "vapid_keys_secret_arn" {
  description = "ARN of the VAPID keys secret (manually populate after creation)"
  value       = aws_secretsmanager_secret.vapid_keys.arn
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


# A tiny random id for a stable but unique bucket name in dev
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ------------------------------------------------------------
# ECR Repositories for Docker Images
# ------------------------------------------------------------
resource "aws_ecr_repository" "server" {
  name                 = "comm-ng-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "comm-ng-server"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_ecr_repository" "web" {
  name                 = "comm-ng-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "comm-ng-web"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# Security Groups for ALB and ECS Tasks
# ------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "dev-comm-ng-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
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
    Name        = "dev-comm-ng-alb"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "dev-comm-ng-ecs-tasks"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dev-comm-ng-ecs-tasks"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# Application Load Balancer
# ------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "dev-comm-ng-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default_vpc.ids

  enable_deletion_protection = false

  tags = {
    Name        = "dev-comm-ng-alb"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# Target Groups
resource "aws_lb_target_group" "server" {
  name        = "dev-comm-ng-server-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name        = "dev-comm-ng-server-tg"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_lb_target_group" "web" {
  name        = "dev-comm-ng-web-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name        = "dev-comm-ng-web-tg"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# ALB Listener Rules for routing
resource "aws_lb_listener_rule" "server" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.server.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/trpc/*"]
    }
  }
}

# ------------------------------------------------------------
# ECS Cluster
# ------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "dev-comm-ng-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "dev-comm-ng-cluster"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# CloudWatch Log Groups
# ------------------------------------------------------------
resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/dev-comm-ng-server"
  retention_in_days = 7

  tags = {
    Name        = "dev-comm-ng-server-logs"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/dev-comm-ng-web"
  retention_in_days = 7

  tags = {
    Name        = "dev-comm-ng-web-logs"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# IAM Roles for ECS Tasks
# ------------------------------------------------------------
resource "aws_iam_role" "ecs_task_execution" {
  name = "dev-comm-ng-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "dev-comm-ng-ecs-task-execution-role"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets_access" {
  name = "ecs-secrets-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn,
          aws_secretsmanager_secret.cache_auth.arn,
          aws_secretsmanager_secret.vapid_keys.arn
        ]
      }
    ]
  })
}

# Task role for application permissions (S3, etc.)
resource "aws_iam_role" "ecs_task" {
  name = "dev-comm-ng-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "dev-comm-ng-ecs-task-role"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# S3 access policy for the task role
resource "aws_iam_role_policy" "ecs_task_s3_access" {
  name = "ecs-task-s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.comm_ng_files.arn,
          "${aws_s3_bucket.comm_ng_files.arn}/*"
        ]
      }
    ]
  })
}

# ------------------------------------------------------------
# ECS Task Definitions
# ------------------------------------------------------------
resource "aws_ecs_task_definition" "server" {
  family                   = "dev-comm-ng-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # 0.25 vCPU
  memory                   = "512"  # 512 MB
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "server"
      image     = "${aws_ecr_repository.server.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_serverless_cache.dev_cache_valkey.endpoint[0].address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "DATABASE_HOST"
          value = split(":", aws_db_instance.dev_db_comm_ng.endpoint)[0]
        },
        {
          name  = "DATABASE_PORT"
          value = "5432"
        },
        {
          name  = "S3_BUCKET"
          value = aws_s3_bucket.comm_ng_files.bucket
        },
        {
          name  = "AWS_REGION"
          value = "us-east-1"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn
        },
        {
          name      = "REDIS_AUTH"
          valueFrom = aws_secretsmanager_secret.cache_auth.arn
        },
        {
          name      = "VAPID_PUBLIC_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:publicKey::"
        },
        {
          name      = "VAPID_PRIVATE_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:privateKey::"
        },
        {
          name      = "VAPID_CONTACT_EMAIL"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:contactEmail::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.server.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "dev-comm-ng-server-task"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_ecs_task_definition" "web" {
  family                   = "dev-comm-ng-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # 0.25 vCPU
  memory                   = "512"  # 512 MB
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "web"
      image     = "${aws_ecr_repository.web.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "NEXT_PUBLIC_API_BASE_URL"
          value = "http://${aws_lb.main.dns_name}"
        },
        {
          name  = "NEXT_PUBLIC_WEB_BASE_URL"
          value = "http://${aws_lb.main.dns_name}"
        }
      ]

      secrets = [
        {
          name      = "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:publicKey::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.web.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "dev-comm-ng-web-task"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# ECS Services
# ------------------------------------------------------------
resource "aws_ecs_service" "server" {
  name            = "dev-comm-ng-server-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default_vpc.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]

  tags = {
    Name        = "dev-comm-ng-server-service"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

resource "aws_ecs_service" "web" {
  name            = "dev-comm-ng-web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default_vpc.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.http]

  tags = {
    Name        = "dev-comm-ng-web-service"
    Environment = "dev"
    Project     = "comm_ng"
  }
}

# ------------------------------------------------------------
# Auto Scaling Configuration
# ------------------------------------------------------------

# Server Auto Scaling Target
resource "aws_appautoscaling_target" "server" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.server.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Server CPU-based scaling policy
resource "aws_appautoscaling_policy" "server_cpu" {
  name               = "dev-comm-ng-server-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Server Memory-based scaling policy
resource "aws_appautoscaling_policy" "server_memory" {
  name               = "dev-comm-ng-server-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Server ALB Request Count scaling policy
resource "aws_appautoscaling_policy" "server_requests" {
  name               = "dev-comm-ng-server-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.server.arn_suffix}"
    }
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Web Auto Scaling Target
resource "aws_appautoscaling_target" "web" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.web.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Web CPU-based scaling policy
resource "aws_appautoscaling_policy" "web_cpu" {
  name               = "dev-comm-ng-web-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Web Memory-based scaling policy
resource "aws_appautoscaling_policy" "web_memory" {
  name               = "dev-comm-ng-web-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Web ALB Request Count scaling policy
resource "aws_appautoscaling_policy" "web_requests" {
  name               = "dev-comm-ng-web-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.web.arn_suffix}"
    }
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

