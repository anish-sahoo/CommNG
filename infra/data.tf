# ------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------

# Get default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default VPC subnet group
data "aws_db_subnet_group" "default" {
  name = var.db_subnet_group_name
}

# Get all subnets in default VPC
data "aws_subnets" "default_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get subnets in supported availability zones
data "aws_subnets" "default_vpc_supported_az" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = [
      "${var.aws_region}a",
      "${var.aws_region}b",
      "${var.aws_region}c",
      "${var.aws_region}d",
      "${var.aws_region}f"
    ]
  }
}

# Get route tables for the default VPC
data "aws_route_tables" "default_vpc" {
  vpc_id = data.aws_vpc.default.id
}
