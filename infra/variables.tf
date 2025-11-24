# ------------------------------------------------------------
# Environment Configuration
# ------------------------------------------------------------
variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "comm_ng"
}

# ------------------------------------------------------------
# Feature Flags
# ------------------------------------------------------------
variable "enable_infrastructure_scheduler" {
  description = "Enable automatic shutdown/startup of infrastructure (6 PM - 8 AM EST)"
  type        = bool
  default     = false # Set to false to disable the scheduler
}

# ------------------------------------------------------------
# Database Configuration
# ------------------------------------------------------------
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 0 # 0 for dev, 7+ for prod
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false # false for dev, true for prod
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = false # false for dev, true for prod
}

# ------------------------------------------------------------
# Cache Configuration
# ------------------------------------------------------------
variable "cache_max_storage_gb" {
  description = "Maximum cache storage in GB"
  type        = number
  default     = 2
}

variable "cache_max_ecpu" {
  description = "Maximum ECPU per second for cache"
  type        = number
  default     = 1000
}

# ------------------------------------------------------------
# ECS Configuration
# ------------------------------------------------------------
variable "ecs_cpu" {
  description = "ECS task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 3
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = false # false for dev to save costs
}

# ------------------------------------------------------------
# Monitoring Configuration
# ------------------------------------------------------------
variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 1 # 1 for dev, 7+ for prod
}

# ------------------------------------------------------------
# Network Configuration
# ------------------------------------------------------------
variable "db_publicly_accessible" {
  description = "Make RDS publicly accessible"
  type        = bool
  default     = true # true for dev (easier access), false for prod
}

variable "domain_name" {
  description = "Domain name for the application (e.g., dev.example.com)"
  type        = string
  default     = "" # Set this in terraform.tfvars
}

# ------------------------------------------------------------
# Default VPC Subnet Group
# ------------------------------------------------------------
variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
  default     = "default-vpc-059af42cd1884a8cc"
}
