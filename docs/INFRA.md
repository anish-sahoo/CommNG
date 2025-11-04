# Infrastructure Setup Guide

This document provides comprehensive instructions for setting up and managing the CommNG infrastructure on AWS using Terraform and GitHub Actions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Terraform Setup](#terraform-setup)
- [GitHub Actions Setup](#github-actions-setup)
- [Deployment Guide](#deployment-guide)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## Architecture Overview

The CommNG application is deployed on AWS using:

- **ECS Fargate**: Serverless container orchestration for `server` (Node.js) and `web` (Next.js)
- **Application Load Balancer (ALB)**: Routes traffic to appropriate services
  - `/api/*` and `/trpc/*` → Server service
  - All other routes → Web service
- **Auto Scaling**: Automatically scales based on CPU, memory, and request count
  - Min: 1 task per service
  - Max: 10 tasks per service
  - Target: 70% CPU, 80% memory, 1000 requests/target
- **ECR**: Docker image registry
- **RDS PostgreSQL**: Database (db.t3.micro, 20GB)
- **ElastiCache Valkey**: Redis-compatible cache
- **S3**: File storage
- **CloudWatch**: Logs and monitoring

### Resource Specifications

**Fargate Tasks (Lowest Configuration):**
- CPU: 0.25 vCPU (256 CPU units)
- Memory: 512 MB
- Cost-effective for variable traffic patterns

**Auto-scaling Behavior:**
- Scales **up** quickly (60s cooldown) when load increases
- Scales **down** slowly (300s cooldown) to prevent flapping
- Multiple metrics (CPU, memory, requests) trigger scaling

## Prerequisites

### Local Development

1. **Terraform** (>= 1.5.0)
   ```bash
   brew install terraform
   ```

2. **AWS CLI**
   ```bash
   brew install awscli
   aws --version
   ```

3. **Docker**
   ```bash
   brew install --cask docker
   ```

4. **AWS Account Setup**
   - Active AWS account with appropriate permissions
   - IAM user with programmatic access

### Required AWS Permissions

Create an IAM user with these managed policies:
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `AmazonRDSFullAccess`
- `AmazonElastiCacheFullAccess`
- `AmazonS3FullAccess`
- `IAMFullAccess` (for creating roles)
- `AmazonVPCFullAccess`
- `ElasticLoadBalancingFullAccess`
- `CloudWatchLogsFullAccess`
- `SecretsManagerReadWrite`

## Terraform Setup

### Initial Configuration

1. **Configure AWS Credentials**

   ```bash
   aws configure
   ```
   
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

2. **Navigate to Infrastructure Directory**

   ```bash
   cd infra
   ```

3. **Initialize Terraform**

   This downloads provider plugins and sets up the backend:

   ```bash
   terraform init
   ```

### Planning Changes

Before applying changes, always review the execution plan:

```bash
terraform plan
```

This shows:
- Resources to be created (green `+`)
- Resources to be modified (yellow `~`)
- Resources to be destroyed (red `-`)

**Save a plan for later application:**

```bash
terraform plan -out=tfplan
```

### Applying Changes

**Option 1: Apply directly**

```bash
terraform apply
```

Review the plan and type `yes` to confirm.

**Option 2: Apply a saved plan**

```bash
terraform apply tfplan
```

**Auto-approve (use with caution):**

```bash
terraform apply -auto-approve
```

### Initial Deployment

1. **Apply Infrastructure**

   ```bash
   cd infra
   terraform init
   terraform plan
   terraform apply
   ```

2. **Note Important Outputs**

   After successful apply, Terraform will output:
   - `alb_dns_name` - Your application URL
   - `ecr_server_repository_url` - Server ECR URL
   - `ecr_web_repository_url` - Web ECR URL
   - `db_instance_endpoint` - Database endpoint
   - `cache_endpoint` - Redis endpoint
   - `ecs_cluster_name` - ECS cluster name
   - `ecs_server_service_name` - Server service name
   - `ecs_web_service_name` - Web service name
   - `vapid_keys_secret_arn` - VAPID keys secret ARN (needs manual population)

   Save these values for GitHub Actions configuration.

3. **Set Up VAPID Keys for Push Notifications**

   Generate and store VAPID keys in AWS Secrets Manager:

   ```bash
   # Generate VAPID keys
   npx web-push generate-vapid-keys

   # Store in Secrets Manager
   aws secretsmanager put-secret-value \
     --secret-id dev/comm-ng/vapid-keys \
     --secret-string '{
       "publicKey": "YOUR_VAPID_PUBLIC_KEY",
       "privateKey": "YOUR_VAPID_PRIVATE_KEY",
       "contactEmail": "mailto:admin@yourdomain.com"
     }'
   ```

   **See [SECRETS-SETUP.md](./SECRETS-SETUP.md) for detailed instructions.**

4. **Build and Push Initial Docker Images**

   Before ECS services can run, you need initial images in ECR:

   ```bash
   # Get ECR login
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and push server image
   cd ../server
   docker build -t comm-ng-server .
   docker tag comm-ng-server:latest <ecr_server_repository_url>:latest
   docker push <ecr_server_repository_url>:latest

   # Build and push web image
   cd ../web
   docker build -t comm-ng-web .
   docker tag comm-ng-web:latest <ecr_web_repository_url>:latest
   docker push <ecr_web_repository_url>:latest
   ```

### Viewing State

**List all resources:**

```bash
terraform state list
```

**Show specific resource details:**

```bash
terraform state show aws_ecs_service.server
```

**View outputs:**

```bash
terraform output
terraform output alb_dns_name
```

### Destroying Infrastructure

**⚠️ Warning: This will delete ALL resources**

```bash
terraform destroy
```

Review the destruction plan carefully before typing `yes`.

### Common Terraform Commands

```bash
# Format Terraform files
terraform fmt

# Validate configuration
terraform validate

# Show current state
terraform show

# Refresh state from AWS
terraform refresh

# Target specific resource
terraform apply -target=aws_ecs_service.server

# View dependency graph
terraform graph | dot -Tpng > graph.png
```

## Versioning Strategy

The deployment workflows automatically manage application versions using semantic versioning:

### Version Bumping Rules

- **Main branch deployments**: Bump **minor** version
  - Example: `1.0.5` → `1.1.0`
  - Use for: Production releases, feature deployments
  
- **Non-main branch deployments**: Bump **patch** version
  - Example: `1.0.5` → `1.0.6`
  - Use for: Development deployments, bug fixes, testing

### How It Works

1. When you trigger a deployment, the workflow:
   - Checks out your specified branch
   - Runs `npm version minor` (main) or `npm version patch` (others)
   - Updates `package.json` and `package-lock.json`
   - Commits with message: `chore(server|web): bump version to X.Y.Z [skip ci]`
   - Pushes the commit to your branch
   - Continues with build and deployment

2. The `[skip ci]` tag prevents the commit from triggering another workflow run

3. Version is displayed in deployment summary

### Manual Version Management

If you need to bump major version or set a specific version:

```bash
# In server/ or web/ directory
npm version major      # 1.0.0 → 2.0.0
npm version 2.5.3      # Set to specific version

git add package.json package-lock.json
git commit -m "chore: bump version to X.Y.Z"
git push
```

Then deploy normally - the workflow will bump from your new base version.

## GitHub Actions Setup

### Step 1: Create GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key | IAM user secret key |

### Step 2: Create GitHub Environments

1. Go to **Settings** → **Environments**
2. Create three environments:
   - `dev`
   - `staging` (optional)
   - `production` (optional)

3. For each environment, configure:
   - **Protection rules** (optional):
     - Required reviewers for production
     - Wait timer
   - **Environment secrets** (if different from repo secrets)

### Step 3: Verify Workflow Files

The workflows are located at:
- `.github/workflows/deploy-server.yml` - Deploys Node.js backend
- `.github/workflows/deploy-web.yml` - Deploys Next.js frontend

Both workflows:
- Trigger manually via `workflow_dispatch`
- Accept an `environment` input (dev/staging/production)
- Build Docker images
- Push to ECR
- Deploy to ECS with zero-downtime rolling updates

## Deployment Guide

### Manual Deployment via GitHub Actions

1. **Navigate to Actions tab** in your GitHub repository

2. **Deploy Server:**
   - Select **"Deploy Server to ECS"** workflow
   - Click **"Run workflow"**
   - Enter branch to deploy from (e.g., `main`, `feature/ecs-deployment`)
   - Choose environment (`dev`, `staging`, or `production`)
   - Click **"Run workflow"**
   - The workflow will automatically:
     - Bump version (minor for `main`, patch for other branches)
     - Commit and push the version change
     - Build and deploy

3. **Deploy Web:**
   - Select **"Deploy Web to ECS"** workflow
   - Click **"Run workflow"**
   - Enter branch and select environment
   - Click **"Run workflow"**
   - Version will be automatically bumped and committed

4. **Monitor Deployment:**
   - Click on the running workflow to see live logs
   - Each step shows progress
   - Final step shows deployment summary with:
     - Service name
     - Cluster name
     - Image tag
     - Commit SHA

### Deployment Process

The GitHub Actions workflows perform:

1. **Checkout code** - Gets latest code from specified branch
2. **Configure Git** - Sets up git credentials for version commits
3. **Bump version** - Updates `package.json` version:
   - **Main branch**: Minor version bump (1.0.0 → 1.1.0)
   - **Other branches**: Patch version bump (1.0.0 → 1.0.1)
4. **Commit & push** - Commits version change with `[skip ci]` to avoid loops
5. **Configure AWS** - Authenticates with AWS using secrets
6. **Login to ECR** - Authenticates Docker with ECR
7. **Build Docker image** - Builds your application container
8. **Tag images** - Tags with commit SHA and `latest`
9. **Push to ECR** - Uploads images to container registry
10. **Download task definition** - Gets current ECS task config
11. **Update task definition** - Inserts new image reference
12. **Deploy to ECS** - Triggers rolling update
13. **Wait for stability** - Ensures deployment succeeds

### Rolling Updates

ECS performs zero-downtime deployments:
1. Launches new tasks with updated image
2. Waits for new tasks to pass health checks
3. Drains connections from old tasks
4. Terminates old tasks
5. Auto-scaling adjusts to traffic during deployment

### First Deployment Notes

After Terraform creates the infrastructure:

1. **Initial State**: ECS services will fail to start because no images exist
2. **Fix**: Run GitHub Actions workflows OR manually push images (see Terraform Setup step 3)
3. **Subsequent Deployments**: Use GitHub Actions exclusively

## Monitoring and Troubleshooting

### AWS Console Access

**ECS Service Status:**
```
AWS Console → ECS → Clusters → dev-comm-ng-cluster → Services
```

**View Logs:**
```
AWS Console → CloudWatch → Log Groups
- /ecs/dev-comm-ng-server
- /ecs/dev-comm-ng-web
```

**Load Balancer Health:**
```
AWS Console → EC2 → Load Balancers → dev-comm-ng-alb → Target Groups
```

### CLI Monitoring

**Check service status:**
```bash
aws ecs describe-services \
  --cluster dev-comm-ng-cluster \
  --services dev-comm-ng-server-service dev-comm-ng-web-service
```

**View recent logs (server):**
```bash
aws logs tail /ecs/dev-comm-ng-server --follow --since 10m
```

**View recent logs (web):**
```bash
aws logs tail /ecs/dev-comm-ng-web --follow --since 10m
```

**Check task status:**
```bash
aws ecs list-tasks --cluster dev-comm-ng-cluster --service-name dev-comm-ng-server-service
```

**Describe a specific task:**
```bash
aws ecs describe-tasks \
  --cluster dev-comm-ng-cluster \
  --tasks <task-arn>
```

### Common Issues

#### 1. ECS Tasks Failing Health Checks

**Symptoms:** Tasks start but are marked unhealthy and terminated

**Solution:**
- Check application logs in CloudWatch
- Verify health check endpoint exists:
  - Server: `GET /health` should return 200
  - Web: `GET /` should return 200
- Ensure application listens on correct port (3000 for server, 3001 for web)
- Check environment variables are set correctly

#### 2. "Unable to pull image" Error

**Symptoms:** Task fails with ECR authentication error

**Solution:**
```bash
# Verify image exists
aws ecr describe-images --repository-name comm-ng-server

# Ensure ECS task execution role has ECR permissions
# (Already configured in Terraform)
```

#### 3. Database Connection Failures

**Symptoms:** Application logs show database connection errors

**Solution:**
- Verify RDS is running: `terraform state show aws_db_instance.dev_db_comm_ng`
- Check security groups allow traffic from ECS tasks
- Verify DATABASE_URL secret is correctly configured
- Test connection from ECS task:
  ```bash
  aws ecs execute-command \
    --cluster dev-comm-ng-cluster \
    --task <task-id> \
    --container server \
    --interactive \
    --command "/bin/sh"
  ```

#### 4. Auto-scaling Not Working

**Symptoms:** Service doesn't scale despite high load

**Solution:**
- Check CloudWatch alarms for scaling policies:
  ```bash
  aws application-autoscaling describe-scaling-activities \
    --service-namespace ecs \
    --resource-id service/dev-comm-ng-cluster/dev-comm-ng-server-service
  ```
- Verify metrics are being published
- Check cooldown periods haven't been triggered recently

#### 5. 502 Bad Gateway from ALB

**Symptoms:** Load balancer returns 502 errors

**Causes:**
- No healthy targets in target group
- Application not responding on expected port
- Health check failing

**Solution:**
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Review ALB access logs
# Enable ALB logging in Terraform if needed
```

### Accessing Application

After deployment, access your application:

```bash
# Get ALB DNS name
terraform output alb_dns_name

# Test endpoints
curl http://<alb-dns-name>/
curl http://<alb-dns-name>/api/health
```

### Cost Monitoring

**View estimated costs:**
```
AWS Console → Billing → Bills
```

**Key cost factors:**
- ECS Fargate: Based on vCPU and memory per second
- RDS: db.t3.micro instance hours
- ElastiCache: Valkey storage and compute
- ALB: Per hour + data processed
- Data transfer: Outbound data

**Cost optimization:**
- Auto-scaling reduces costs during low traffic
- Consider Reserved Instances for production
- Review CloudWatch logs retention (currently 7 days)

## Infrastructure Updates

### Updating ECS Task Configuration

1. Edit `infra/main.tf` task definitions
2. Run `terraform plan` to review changes
3. Run `terraform apply`
4. ECS will automatically deploy updated task definitions

### Scaling Configuration

To change auto-scaling limits:

```hcl
# In main.tf, modify:
resource "aws_appautoscaling_target" "server" {
  max_capacity       = 20  # Increase max capacity
  min_capacity       = 2   # Set minimum baseline
  # ...
}
```

### Updating Docker Images

Images are updated through GitHub Actions. Manual updates:

```bash
# Build new image
docker build -t <ecr-url>:v2.0 .

# Push to ECR
docker push <ecr-url>:v2.0

# Update ECS service
aws ecs update-service \
  --cluster dev-comm-ng-cluster \
  --service dev-comm-ng-server-service \
  --force-new-deployment
```

## Security Best Practices

1. **Secrets Management:**
   - Never commit AWS credentials
   - Use AWS Secrets Manager for sensitive data
   - Rotate credentials regularly

2. **Network Security:**
   - ECS tasks run in default VPC
   - Security groups restrict traffic
   - Consider moving to private subnets for production

3. **IAM Permissions:**
   - Follow principle of least privilege
   - Use separate IAM roles for different environments
   - Enable MFA for AWS console access

4. **Image Security:**
   - Enable ECR image scanning (already configured)
   - Review scan results before deployment
   - Keep base images updated

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)

## Support

For infrastructure issues:
1. Check this documentation
2. Review CloudWatch logs
3. Check AWS Service Health Dashboard
4. Open an issue in the repository

---

**Last Updated:** November 2, 2025
