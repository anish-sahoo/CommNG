# Outputs

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

output "environment" {
  description = "Current environment"
  value       = var.environment
}
