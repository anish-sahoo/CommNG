<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">⚡ Quick Reference</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#common-commands">Commands</a> •
  <a href="#github-actions">GitHub Actions</a> •
  <a href="#key-infrastructure-details">Infra Details</a> •
  <a href="#secret-rotation">Secret Rotation</a> •
  <a href="#auto-scaling-settings">Auto-scaling</a> •
  <a href="#task-resources">Resources</a> •
  <a href="#health-checks">Health Checks</a> •
  <a href="#troubleshooting-quick-checks">Troubleshooting</a> •
  <a href="#useful-aws-console-links">AWS Links</a> •
  <a href="#cost-estimates-monthly-low-traffic">Cost</a>
</p>

# ECS Fargate Deployment - Quick Reference

## Common Commands

### Terraform

```bash
# Initialize
cd infra && terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# Destroy everything
terraform destroy
```

### AWS CLI

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# View ECS services
aws ecs list-services --cluster dev-comm-ng-cluster

# Check service status
aws ecs describe-services --cluster dev-comm-ng-cluster --services dev-comm-ng-server-service

# View running tasks
aws ecs list-tasks --cluster dev-comm-ng-cluster --service-name dev-comm-ng-server-service

# View logs (last 10 minutes)
aws logs tail /ecs/dev-comm-ng-server --follow --since 10m
aws logs tail /ecs/dev-comm-ng-web --follow --since 10m

# Force new deployment (pulls latest image)
aws ecs update-service --cluster dev-comm-ng-cluster --service dev-comm-ng-server-service --force-new-deployment
aws ecs update-service --cluster dev-comm-ng-cluster --service dev-comm-ng-web-service --force-new-deployment
```

### Docker

```bash
# Build locally
docker build -t comm-ng-server ./server
docker build -t comm-ng-web ./web

# Test locally
docker run -p 3000:3000 comm-ng-server
docker run -p 3001:3001 comm-ng-web

# Manual push to ECR (get URL from terraform output)
docker tag comm-ng-server:latest <ecr-url>:latest
docker push <ecr-url>:latest
```

## GitHub Actions

1. Go to **Actions** tab
2. Select workflow (Deploy Server or Deploy Web)
3. Click **Run workflow**
4. Enter branch name (e.g., `main` or `feature/my-feature`)
5. Choose environment (dev/staging/production)
6. Click **Run workflow**

**Versioning:**
- Main branch → Minor bump (1.0.0 → 1.1.0)
- Other branches → Patch bump (1.0.0 → 1.0.1)

## Key Infrastructure Details

| Component | Value |
|-----------|-------|
| Region | us-east-1 |
| ECS Cluster | dev-comm-ng-cluster |
| Server Service | dev-comm-ng-server-service |
| Web Service | dev-comm-ng-web-service |
| Server ECR | comm-ng-server |
| Web ECR | comm-ng-web |
| Server Port | 3000 |
| Web Port | 3001 |

## Secret Rotation

Database credentials are automatically rotated without downtime:

```bash
# Manually rotate database password
aws secretsmanager rotate-secret --secret-id $(terraform output -raw db_master_password_secret_arn)

# Check rotation status
aws secretsmanager describe-secret --secret-id $(terraform output -raw db_master_password_secret_arn) --query 'RotationEnabled'

# View application logs during rotation
aws logs tail /ecs/dev-comm-ng-server --follow --filter-pattern "rotation"
```

The application checks for new credentials every 5 minutes and reconnects automatically. See [DATABASE-SECRET-ROTATION.md](DATABASE-SECRET-ROTATION.md) for details.

## Auto-scaling Settings

- **Min Tasks**: 1
- **Max Tasks**: 10
- **CPU Target**: 70%
- **Memory Target**: 80%
- **Requests Target**: 1000/target
- **Scale Out**: 60s cooldown
- **Scale In**: 300s cooldown

## Task Resources

- **CPU**: 256 (0.25 vCPU)
- **Memory**: 512 MB

## Health Checks

- **Server**: `GET /health` (must return 200)
- **Web**: `GET /` (must return 200)
- **Interval**: 30s
- **Timeout**: 5s
- **Unhealthy threshold**: 3 failures

## Troubleshooting Quick Checks

```bash
# 1. Check if services are running
aws ecs describe-services --cluster dev-comm-ng-cluster --services dev-comm-ng-server-service dev-comm-ng-web-service --query 'services[*].[serviceName,status,desiredCount,runningCount]'

# 2. Check task health
aws ecs describe-tasks --cluster dev-comm-ng-cluster --tasks $(aws ecs list-tasks --cluster dev-comm-ng-cluster --service-name dev-comm-ng-server-service --query 'taskArns[0]' --output text) --query 'tasks[0].healthStatus'

# 3. Check target group health
aws elbv2 describe-target-health --target-group-arn $(terraform output -raw server_target_group_arn)

# 4. Get ALB URL
terraform output alb_dns_name

# 5. Test application
curl http://$(terraform output -raw alb_dns_name)/
curl http://$(terraform output -raw alb_dns_name)/api/health
```

## Useful AWS Console Links

After running `terraform apply`, access:

- **ECS Cluster**: AWS Console → ECS → Clusters → dev-comm-ng-cluster
- **Load Balancer**: AWS Console → EC2 → Load Balancers → dev-comm-ng-alb
- **Target Groups**: AWS Console → EC2 → Target Groups
- **CloudWatch Logs**: AWS Console → CloudWatch → Log Groups
- **ECR Repositories**: AWS Console → ECR → Repositories
- **RDS Database**: AWS Console → RDS → Databases → dev-db-comm-ng
- **ElastiCache**: AWS Console → ElastiCache → Valkey caches

## Cost Estimates (Monthly, Low Traffic)

- **ECS Fargate**: ~$15-30 (2 tasks @ 0.25 vCPU, 512MB)
- **ALB**: ~$16 (base) + data
- **RDS t3.micro**: ~$15
- **ElastiCache Serverless**: ~$5-10
- **Data Transfer**: Variable
- **CloudWatch Logs**: ~$1-5

**Total Estimate**: $52-76/month (low traffic)

With auto-scaling to 10 tasks during peak hours, costs scale proportionally.
