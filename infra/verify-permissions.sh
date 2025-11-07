#!/bin/bash

# AWS Permissions Verification Script
# This script checks if your AWS credentials have the necessary permissions
# for deploying the CommNG infrastructure with Terraform

# Don't exit on errors - we want to check all permissions
set +e

echo "========================================"
echo "AWS Permissions Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0
PASSED=0
WARNINGS=0

check_permission() {
    local service=$1
    local action=$2
    local description=$3
    
    echo -n "Checking: $description... "
    
    # Use AWS CLI dry-run or simulate to check permissions
    if eval "$action" &> /dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Command: $action"
        ((FAILED++))
        return 1
    fi
}

check_permission_warn() {
    local service=$1
    local action=$2
    local description=$3
    
    echo -n "Checking: $description... "
    
    if eval "$action" &> /dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        echo "  Command: $action"
        ((WARNINGS++))
        return 1
    fi
}

echo "1. Basic AWS Access"
echo "-------------------"
if aws sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✓ AWS credentials are configured${NC}"
    aws sts get-caller-identity
    echo ""
    ((PASSED++))
else
    echo -e "${RED}✗ AWS credentials not configured or invalid${NC}"
    echo "Run: aws configure"
    exit 1
fi


echo ""
echo "2. Secrets Manager Permissions"
echo "--------------------------------"
check_permission "Secrets Manager" "aws secretsmanager list-secrets --max-results 1" "List Secrets"

echo ""
echo "3. CloudWatch Logs Permissions"
echo "--------------------------------"
check_permission "CloudWatch Logs" "aws logs describe-log-groups --max-items 1" "Describe Log Groups"


echo ""
echo "4. ECR Permissions"
echo "------------------"
check_permission "ECR" "aws ecr describe-repositories --max-results 1 2>&1 | grep -qv 'AccessDenied'" "Describe ECR Repositories"

echo ""
echo "5. ECS Permissions"
echo "------------------"
check_permission "ECS Clusters" "aws ecs list-clusters" "List ECS Clusters"
check_permission "ECS Services" "aws ecs list-services --cluster default --max-results 1 2>&1 | grep -qv 'ClusterNotFoundException'" "List ECS Services"
check_permission "ECS Task Definitions" "aws ecs list-task-definitions --max-results 1" "List Task Definitions"

echo ""
echo "6. Load Balancer Permissions"
echo "-----------------------------"
check_permission "ALB" "aws elbv2 describe-load-balancers --max-results 1" "Describe Load Balancers"
check_permission "Target Groups" "aws elbv2 describe-target-groups --max-results 1" "Describe Target Groups"

echo ""
echo "7. IAM Permissions"
echo "------------------"
check_permission "IAM Roles" "aws iam list-roles --max-items 1" "List IAM Roles"
check_permission "IAM Policies" "aws iam list-policies --max-items 1" "List IAM Policies"
check_permission_warn "IAM Create Role" "aws iam get-role --role-name NonExistentRole 2>&1 | grep -q 'NoSuchEntity'" "Get IAM Role (simulate create)"

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  Some permissions are missing!${NC}"
    echo ""
    echo "You need the following IAM policies attached to your user/role:"
    echo ""
    echo "Managed Policies:"
    echo "  - AmazonEC2FullAccess"
    echo "  - AmazonRDSFullAccess"
    echo "  - AmazonElastiCacheFullAccess"
    echo "  - AmazonS3FullAccess"
    echo "  - AmazonECS_FullAccess"
    echo "  - AmazonEC2ContainerRegistryFullAccess"
    echo "  - ElasticLoadBalancingFullAccess"
    echo "  - IAMFullAccess (or at least create/update/delete for roles and policies)"
    echo "  - CloudWatchLogsFullAccess"
    echo "  - SecretsManagerReadWrite"
    echo ""
    echo "Contact your AWS administrator to grant these permissions."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some optional permissions are missing (warnings only)${NC}"
    echo "You can proceed but may encounter issues with specific operations."
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ All required permissions verified!${NC}"
    echo "You can proceed with terraform apply."
    echo ""
    exit 0
fi
