# 🚀 Quick Start Guide

This guide provides a high-level overview of setting up, deploying, and managing the CommNG application.

## 1. Infrastructure Setup (Terraform)

1.  **Install Prerequisites**: Terraform, AWS CLI, Docker.
2.  **Configure AWS**: Run `aws configure`.
3.  **Initialize & Apply**:
    ```bash
    cd infra
    terraform init
    terraform apply
    ```
4.  **Note Outputs**: Save the `alb_dns_name`, `ecr_repository_url`, and `vapid_keys_secret_arn`.

👉 **Detailed Guide**: [INFRA.md](./INFRA.md#terraform-setup)

## 2. Secrets Configuration

1.  **Generate VAPID Keys**:
    ```bash
    npx web-push generate-vapid-keys
    ```
2.  **Upload to AWS**:
    ```bash
    aws secretsmanager put-secret-value \
      --secret-id dev/comm-ng/vapid-keys \
      --secret-string '{"publicKey":"...","privateKey":"...","contactEmail":"..."}'
    ```

👉 **Detailed Guide**: [SECURITY.md](./SECURITY.md#secrets-management)

## 3. GitHub Actions Setup

1.  **Add Secrets** to GitHub Repository:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `DEPLOY_KEY` (SSH Private Key for version bumping)
2.  **Create Environments**: `dev`, `staging`, `production`.

👉 **Detailed Guide**: [INFRA.md](./INFRA.md#github-actions-setup)

## 4. Deployment

### Initial Deployment
Since ECR repositories are empty initially, you must push images manually or trigger the workflow.

### Routine Deployment
1.  Go to **GitHub Actions**.
2.  Select **Deploy Server** or **Deploy Web**.
3.  Choose branch and environment.
4.  Run Workflow.

👉 **Detailed Guide**: [INFRA.md](./INFRA.md#deployment-guide)

## 5. Local Development

1.  **Install Dependencies**: `npm install` in `server/` and `web/`.
2.  **Setup Environment**: Create `.env.local` files.
3.  **Run**:
    ```bash
    # Server
    cd server && npm run dev
    
    # Web
    cd web && npm run dev
    ```

👉 **Detailed Guide**: [LOCAL-SETUP.md](./LOCAL-SETUP.md)
