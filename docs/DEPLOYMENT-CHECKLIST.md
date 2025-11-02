# Pre-Deployment Checklist

Complete this checklist before deploying CommNG to AWS ECS Fargate.

## AWS Account Setup

- [ ] AWS account created and active
- [ ] IAM user created for Terraform/deployments
- [ ] Required IAM policies attached (see INFRA.md)
- [ ] AWS CLI installed: `aws --version`
- [ ] AWS credentials configured: `aws configure`
- [ ] Test AWS access: `aws sts get-caller-identity`

## Local Development Tools

- [ ] Terraform installed (>= 1.5.0): `terraform --version`
- [ ] Docker installed and running: `docker --version`
- [ ] Node.js 20+ installed: `node --version`
- [ ] Git configured with repository access

## Application Configuration

### Server Application

- [ ] `/health` endpoint exists and returns 200 OK
- [ ] Application listens on port 3000
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL` handling (from Secrets Manager)
  - [ ] `REDIS_AUTH` handling (from Secrets Manager)
  - [ ] `PORT=3000`
  - [ ] `NODE_ENV=production`
- [ ] Dockerfile exists in `server/` directory
- [ ] `.dockerignore` configured
- [ ] Database migrations ready to run
- [ ] S3 access configured for file uploads

### Web Application

- [ ] Application builds successfully: `npm run build`
- [ ] Application listens on port 3001
- [ ] Environment variables configured:
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_API_URL` (ALB URL)
- [ ] Dockerfile exists in `web/` directory
- [ ] `.dockerignore` configured
- [ ] Static assets properly configured

## Terraform Configuration

- [ ] Navigate to `infra/` directory
- [ ] Review `main.tf` configuration
- [ ] Update any hardcoded values (region, names, etc.)
- [ ] Run `terraform init`
- [ ] Run `terraform validate`
- [ ] Run `terraform plan` and review output
- [ ] Ensure no errors in plan

## GitHub Repository Setup

- [ ] Repository created on GitHub
- [ ] Code pushed to repository
- [ ] Workflow files exist:
  - [ ] `.github/workflows/deploy-server.yml`
  - [ ] `.github/workflows/deploy-web.yml`

### GitHub Secrets Configuration

- [ ] Go to Settings → Secrets and variables → Actions
- [ ] Add `AWS_ACCESS_KEY_ID` secret
- [ ] Add `AWS_SECRET_ACCESS_KEY` secret
- [ ] Test secrets are accessible (will verify during first workflow run)

### GitHub Environments

- [ ] Create `dev` environment
- [ ] Create `staging` environment (optional)
- [ ] Create `production` environment (optional)
- [ ] Configure protection rules as needed

## Initial Deployment Steps

### Step 1: Deploy Infrastructure

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### Step 2: Build and Push Initial Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Build and push server
cd server
docker build -t comm-ng-server .
docker tag comm-ng-server:latest <ECR_SERVER_URL>:latest
docker push <ECR_SERVER_URL>:latest

# Build and push web
cd ../web
docker build -t comm-ng-web .
docker tag comm-ng-web:latest <ECR_WEB_URL>:latest
docker push <ECR_WEB_URL>:latest
```

- [ ] Server image built successfully
- [ ] Server image pushed to ECR
- [ ] Web image built successfully
- [ ] Web image pushed to ECR
- [ ] Verify images in AWS Console → ECR

### Step 3: Verify ECS Services

```bash
# Check services are running
aws ecs describe-services \
  --cluster dev-comm-ng-cluster \
  --services dev-comm-ng-server-service dev-comm-ng-web-service
```

- [ ] Server service status: ACTIVE
- [ ] Server running count matches desired count
- [ ] Web service status: ACTIVE
- [ ] Web running count matches desired count
- [ ] Check CloudWatch logs for startup messages
- [ ] No error messages in logs

### Step 4: Verify Target Health

```bash
# Check target groups
aws elbv2 describe-target-health \
  --target-group-arn <server-target-group-arn>

aws elbv2 describe-target-health \
  --target-group-arn <web-target-group-arn>
```

- [ ] Server targets healthy
- [ ] Web targets healthy
- [ ] Health checks passing

### Step 5: Test Application

```bash
# Get ALB URL
ALB_URL=$(terraform output -raw alb_dns_name)

# Test web
curl http://$ALB_URL/

# Test server
curl http://$ALB_URL/api/health
```

- [ ] Web endpoint returns successful response
- [ ] Server health endpoint returns 200 OK
- [ ] Web UI loads in browser: `http://<ALB_URL>`
- [ ] API requests work correctly

## Support

If you encounter issues during deployment:

1. Check INFRA.md troubleshooting section
2. Review CloudWatch logs
3. Check AWS Service Health Dashboard
4. Consult QUICK-REFERENCE.md for common commands
5. Open an issue in the repository

---

**Checklist Version**: 1.0
**Last Updated**: November 2, 2025
