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
