# ------------------------------------------------------------
# Secrets Manager Secrets
# ------------------------------------------------------------

# Cache authentication secret
resource "aws_secretsmanager_secret" "cache_auth" {
  name        = "${var.environment}/${var.project_name}/cache-auth"
  description = "Cache AUTH token for ${var.environment} environment"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-auth"
  })
}

resource "aws_secretsmanager_secret_version" "cache_auth_current" {
  secret_id     = aws_secretsmanager_secret.cache_auth.id
  secret_string = random_password.cache_auth.result
}

# VAPID Keys Secret (manually populated)
resource "aws_secretsmanager_secret" "vapid_keys" {
  name        = "${var.environment}/${var.project_name}/vapid-keys"
  description = "VAPID keys for push notifications - manually populate after creation"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vapid-keys"
  })

  lifecycle {
    ignore_changes = [recovery_window_in_days]
  }
}

# BETTER_AUTH Secret
resource "random_password" "better_auth_secret" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "better_auth_secret" {
  name        = "${var.environment}/${var.project_name}/better-auth-secret"
  description = "BETTER_AUTH_SECRET for authentication"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-better-auth-secret"
  })
}

resource "aws_secretsmanager_secret_version" "better_auth_secret_current" {
  secret_id     = aws_secretsmanager_secret.better_auth_secret.id
  secret_string = random_password.better_auth_secret.result
}
