# ------------------------------------------------------------
# Local Values
# ------------------------------------------------------------
locals {
  project_slug = replace(var.project_name, "_", "-")

  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Resource naming prefix
  name_prefix = "${var.environment}-${local.project_slug}"

  # AWS-managed bucket ARN that stores ECR image layers in the target region
  ecr_layer_bucket_arn = "arn:aws:s3:::prod-${var.aws_region}-starport-layer-bucket"
}
