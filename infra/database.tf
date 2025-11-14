# ------------------------------------------------------------
# RDS PostgreSQL Instance
# ------------------------------------------------------------

resource "aws_db_instance" "dev_db_comm_ng" {
  identifier             = "${local.name_prefix}-db"
  engine                 = "postgres"
  instance_class         = var.db_instance_class
  db_name                = replace(var.project_name, "-", "_")

  # Storage
  allocated_storage      = var.db_allocated_storage
  max_allocated_storage  = var.db_allocated_storage
  storage_type           = "gp3"

  # Authentication
  username                     = "${replace(var.project_name, "-", "_")}_${var.environment}_user"
  manage_master_user_password   = true

  # Network
  publicly_accessible    = var.db_publicly_accessible
  vpc_security_group_ids = [aws_security_group.dev_db_public.id]
  db_subnet_group_name   = data.aws_db_subnet_group.default.name

  # Availability
  multi_az               = var.db_multi_az

  # Monitoring & logs
  monitoring_interval    = 0

  # Backups & maintenance
  backup_retention_period = var.db_backup_retention_period
  skip_final_snapshot      = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${local.name_prefix}-db-final-snapshot"
  deletion_protection      = var.db_deletion_protection

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

# ------------------------------------------------------------
# ElastiCache Valkey (Serverless)
# ------------------------------------------------------------

resource "aws_elasticache_serverless_cache" "dev_cache_valkey" {
  name                  = "${local.name_prefix}-valkey-redis"
  description           = "${var.environment} Valkey/Redis serverless cache"
  engine                = "valkey"
  major_engine_version  = "8"
  security_group_ids    = [aws_security_group.dev_cache_private.id]
  subnet_ids            = slice(data.aws_subnets.default_vpc_supported_az.ids, 0, 2)
  user_group_id         = aws_elasticache_user_group.valkey_default.user_group_id

  cache_usage_limits {
    data_storage {
      unit    = "GB"
      maximum = var.cache_max_storage_gb
    }

    ecpu_per_second {
      maximum = var.cache_max_ecpu
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-valkey-redis"
  })
}

# ------------------------------------------------------------
# Valkey Authentication
# ------------------------------------------------------------

resource "random_password" "cache_auth" {
  length          = 32
  special         = true
  override_special = "!@#%^*+-_=~"
}

resource "aws_elasticache_user" "valkey_default" {
  user_id       = "${replace(local.name_prefix, "-", "")}"
  user_name     = "default"
  engine        = "valkey"
  passwords     = [random_password.cache_auth.result]
  access_string = "on ~* +@all"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-user"
  })
}

resource "aws_elasticache_user_group" "valkey_default" {
  user_group_id = "${replace(local.name_prefix, "-", "")}-group"
  engine        = "valkey"
  user_ids      = [aws_elasticache_user.valkey_default.user_id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-user-group"
  })
}
