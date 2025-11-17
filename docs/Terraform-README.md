# Infrastructure Organization Guide

This directory contains Terraform configuration for the CommNG application infrastructure.

## File Structure

```
infra/
├── provider.tf          # Terraform & AWS provider configuration
├── variables.tf         # All configurable variables with descriptions
├── locals.tf           # Local values and computed variables
├── data.tf             # Data sources (VPC, subnets, etc.)
├── networking.tf       # Security groups, ALB, target groups
├── database.tf         # RDS PostgreSQL and ElastiCache
├── secrets.tf          # Secrets Manager secrets
├── storage.tf          # S3 buckets, ECR repositories
├── ecs.tf              # ECS cluster, services, task definitions
├── iam.tf              # IAM roles and policies
├── monitoring.tf       # CloudWatch logs and EventBridge
├── scheduler.tf        # Infrastructure scheduler Lambda
├── outputs.tf          # Output values
├── terraform.tfvars    # Checked-in dev defaults (can be copied)
├── terraform.tfvars.dev.example  # Dev template for new environments
└── terraform.tfvars.prod.example  # Prod environment template
```

## Environment Management

### Dev Environment (Current)
```bash
# Uses terraform.tfvars by default
terraform plan
terraform apply

# Or copy the example if you prefer to keep a clean working tree
cp terraform.tfvars.dev.example terraform.tfvars
```

### Production Environment
```bash
# Copy prod template
cp terraform.tfvars.prod.example terraform.tfvars

# Or use -var-file
terraform plan -var-file=terraform.tfvars.prod.example
terraform apply -var-file=terraform.tfvars.prod.example
```

### Using Terraform Workspaces (Recommended)
```bash
# Create and switch to prod workspace
terraform workspace new prod
terraform workspace select prod

# Apply with prod vars
terraform apply -var-file=terraform.tfvars.prod.example

# Switch back to dev
terraform workspace select default
terraform apply
```

## Key Variables

Edit `terraform.tfvars` to customize:
- `environment`: "dev" or "prod"
- `enable_infrastructure_scheduler`: Enable/disable nightly shutdown
- `db_instance_class`: RDS instance size
- `ecs_cpu`/`ecs_memory`: Container resources
- `log_retention_days`: How long to keep logs

## Quick Commands

```bash
# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy everything (careful!)
terraform destroy

# Show current state
terraform show

# List resources
terraform state list

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate
```

## Cost Optimization Features

- **Infrastructure Scheduler**: Automatic shutdown 6PM-8AM EST (configurable)
- **Minimal logging**: 1-day retention in dev
- **No Container Insights**: Disabled in dev
- **Single AZ**: RDS runs in single zone for dev
- **Auto-scaling**: CPU-based scaling to handle load spikes

## Notes

- All resources are tagged with Environment, Project, and ManagedBy
- Resource names use `{environment}-{project}` prefix
- Secrets must be manually populated after creation (VAPID keys)
- Default VPC subnet group name may need updating for your AWS account
