# ------------------------------------------------------------
# Local Values
# ------------------------------------------------------------
locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  # Resource naming prefix
  name_prefix = "${var.environment}-${var.project_name}"
}
