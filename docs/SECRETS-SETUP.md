<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">🔐 Secrets Setup</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#vapid-keys-secret">VAPID Keys</a> •
  <a href="#environment-variables-reference">Env Vars</a> •
  <a href="#secrets-manager-json-key-syntax">JSON Syntax</a> •
  <a href="#rotating-secrets">Rotation</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#security-best-practices">Security</a> •
  <a href="#local-development">Local Dev</a> •
  <a href="#production-checklist">Production</a>
</p>

# Secrets Management Setup Guide

This guide explains how to set up and manage secrets in AWS Secrets Manager for the CommNG application.

## Overview

The application uses AWS Secrets Manager for all sensitive configuration:

| Secret | Purpose | Managed By | Task Definition |
|--------|---------|------------|-----------------|
| Database Password | RDS connection | AWS (auto-generated) | Server |
| Redis AUTH Token | ElastiCache auth | Terraform (auto-generated) | Server |
| VAPID Keys | Push notifications | **Manual** | Server + Web |

## VAPID Keys Secret

### What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are required for Web Push notifications. They consist of:
- **Public Key**: Sent to the browser, included in push subscription
- **Private Key**: Used by the server to sign push notification requests
- **Contact Email**: Administrator contact in `mailto:` URL format (e.g., `mailto:admin@yourdomain.com`)

**Note**: The contact email is used by push services to contact you if there are issues with your push notifications.

### Step 1: Generate VAPID Keys

**Option A: Using web-push npm package**

```bash
npx web-push generate-vapid-keys
```

Output:
```
=======================================

Public Key:
BLZ07UqecJuTSnLW_ROfySKipAUM2HQSPVkEalKUTGg8GP48mhuRamSKBMrLHGSwXISIPkarGfttMH2xrUMxl90

Private Key:
xYz123ABC...

=======================================
```

**Option B: Using OpenSSL (alternative)**

```bash
# Generate private key
openssl ecparam -genkey -name prime256v1 -out vapid_private.pem

# Extract public key
openssl ec -in vapid_private.pem -pubout -out vapid_public.pem

# Convert to base64url format (requires additional processing)
```

**Recommendation**: Use Option A (web-push) - it's simpler and outputs the correct format.

### Step 2: Create Secret in AWS

After `terraform apply`, the secret placeholder is created but empty.

**Add the secret value manually:**

```bash
# Get the secret ARN from Terraform output
terraform output vapid_keys_secret_arn

# Store VAPID keys in JSON format
aws secretsmanager put-secret-value \
  --secret-id dev/comm-ng/vapid-keys \
  --secret-string '{
    "publicKey": "YOUR_VAPID_PUBLIC_KEY_HERE",
    "privateKey": "YOUR_VAPID_PRIVATE_KEY_HERE",
    "contactEmail": "mailto:admin@yourdomain.com"
  }'
```

**Via AWS Console:**

1. Go to **AWS Secrets Manager** → **Secrets**
2. Find **dev/comm-ng/vapid-keys**
3. Click **Retrieve secret value** → **Edit**
4. Select **Plaintext** tab
5. Paste the JSON:
   ```json
   {
     "publicKey": "YOUR_VAPID_PUBLIC_KEY_HERE",
     "privateKey": "YOUR_VAPID_PRIVATE_KEY_HERE",
     "contactEmail": "mailto:admin@yourdomain.com"
   }
   ```
6. Click **Save**

### Step 3: Verify Secret Format

The secret MUST be in JSON format with exact key names:

```json
{
  "publicKey": "BLZ07Uqec...",
  "privateKey": "xYz123ABC...",
  "contactEmail": "mailto:admin@yourdomain.com"
}
```

**Important**: 
- Key names are case-sensitive: `publicKey`, `privateKey`, and `contactEmail`
- Contact email MUST be in `mailto:` URL format
- No extra whitespace or formatting
- Valid JSON syntax

### Step 4: Verify ECS Can Access Secret

After updating the secret, force a new ECS deployment:

```bash
# Server deployment (uses both keys)
aws ecs update-service \
  --cluster dev-comm-ng-cluster \
  --service dev-comm-ng-server-service \
  --force-new-deployment

# Web deployment (uses public key only)
aws ecs update-service \
  --cluster dev-comm-ng-cluster \
  --service dev-comm-ng-web-service \
  --force-new-deployment
```

Check logs to verify secrets are loaded:

```bash
# Check server logs
aws logs tail /ecs/dev-comm-ng-server --follow --since 5m

# Check web logs
aws logs tail /ecs/dev-comm-ng-web --follow --since 5m
```

## Environment Variables Reference

### Server (Node.js)

**Public (environment block in task definition):**
- `NODE_ENV=production`
- `PORT=3000`
- `REDIS_HOST=<elasticache-endpoint>`
- `REDIS_PORT=6379`
- `DATABASE_HOST=<rds-endpoint>`
- `DATABASE_PORT=5432`
- `S3_BUCKET=<bucket-name>`
- `AWS_REGION=us-east-1`

**Secrets (secrets block in task definition):**
- `DATABASE_URL` - Full PostgreSQL connection string (from RDS secret)
- `REDIS_AUTH` - Redis AUTH token (from cache secret)
- `VAPID_PUBLIC_KEY` - From `vapid-keys:publicKey`
- `VAPID_PRIVATE_KEY` - From `vapid-keys:privateKey`
- `VAPID_CONTACT_EMAIL` - From `vapid-keys:contactEmail`

### Web (Next.js)

**Public (environment block):**
- `NODE_ENV=production`
- `PORT=3001`
- `NEXT_PUBLIC_API_BASE_URL=http://<alb-dns>`
- `NEXT_PUBLIC_WEB_BASE_URL=http://<alb-dns>`

**Secrets (secrets block):**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - From `vapid-keys:publicKey`

## Secrets Manager JSON Key Syntax

ECS uses this syntax to extract specific keys from JSON secrets:

```
<secret-arn>:key-name::
```

**Example:**
```terraform
secrets = [
  {
    name      = "VAPID_PUBLIC_KEY"
    valueFrom = "arn:aws:secretsmanager:...:secret:dev/comm-ng/vapid-keys:publicKey::"
  }
]
```

This extracts the `publicKey` field from the JSON and exposes it as `VAPID_PUBLIC_KEY` environment variable.

## Rotating Secrets

### Database Password (RDS)

Managed by AWS, can be rotated automatically:

```bash
aws rds modify-db-instance \
  --db-instance-identifier dev-db-comm-ng \
  --master-user-password "NEW_PASSWORD" \
  --apply-immediately
```

**Or enable automatic rotation:**
```bash
aws secretsmanager rotate-secret \
  --secret-id <rds-secret-arn> \
  --rotation-lambda-arn <rotation-lambda-arn>
```

### Redis AUTH Token

Managed by Terraform. To rotate:

1. Update Terraform (triggers new password):
   ```bash
   terraform taint random_password.cache_auth
   terraform apply
   ```

2. Update ElastiCache user
3. Force ECS deployment

### VAPID Keys

**When to rotate:**
- Security breach suspected
- Annual security policy
- Key compromise

**How to rotate:**

1. Generate new VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Update secret in AWS:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id dev/comm-ng/vapid-keys \
     --secret-string '{"publicKey":"NEW_PUB","privateKey":"NEW_PRIV","contactEmail":"mailto:admin@yourdomain.com"}'
   ```

3. Force new ECS deployments (server + web)

4. **Important**: All existing push subscriptions will be invalidated
   - Users need to re-subscribe to push notifications
   - Consider gradual rollout or notification to users

## Troubleshooting

### Issue: ECS Task Fails with "Access Denied" for Secrets

**Cause**: IAM task execution role lacks permission

**Solution**:
```bash
# Verify IAM policy includes secret ARN
aws iam get-role-policy \
  --role-name dev-comm-ng-ecs-task-execution-role \
  --policy-name ecs-secrets-access

# Should include:
# - RDS secret ARN
# - Cache secret ARN
# - VAPID keys secret ARN
```

### Issue: Environment Variable is Empty

**Cause**: Wrong JSON key name or syntax

**Solution**:
```bash
# Verify secret value format
aws secretsmanager get-secret-value \
  --secret-id dev/comm-ng/vapid-keys \
  --query SecretString \
  --output text | jq .

# Should output:
# {
#   "publicKey": "...",
#   "privateKey": "...",
#   "contactEmail": "mailto:..."
# }
```

### Issue: Task Definition Shows Secret ARN Instead of Value

**Expected Behavior**: This is correct!

ECS task definitions store the **ARN reference**, not the actual secret value. The secret is injected at runtime into the container as an environment variable.

**Verify in running container:**
```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster dev-comm-ng-cluster \
  --service-name dev-comm-ng-server-service \
  --query 'taskArns[0]' \
  --output text)

# Describe task to see environment (secrets are masked)
aws ecs describe-tasks \
  --cluster dev-comm-ng-cluster \
  --tasks $TASK_ARN
```

### Issue: Secret Not Updating After Change

**Solution**:
```bash
# ECS caches secrets, force new deployment
aws ecs update-service \
  --cluster dev-comm-ng-cluster \
  --service dev-comm-ng-server-service \
  --force-new-deployment
```

## Security Best Practices

### 1. **Never Commit Secrets to Git**
- ✅ Use Secrets Manager
- ❌ Don't put secrets in Terraform files
- ❌ Don't put secrets in Dockerfiles
- ❌ Don't put secrets in .env files in repo

### 2. **Use IAM Least Privilege**
- Task execution role: Read secrets only
- Task role: Application permissions (S3, etc.)
- No wildcard permissions

### 3. **Enable Secret Rotation**
- RDS: Enable automatic rotation
- Redis: Rotate annually or on security events
- VAPID: Rotate if compromised

### 4. **Audit Secret Access**
- Enable CloudTrail for Secrets Manager
- Monitor `GetSecretValue` API calls
- Set up alerts for unusual access patterns

### 5. **Backup Secrets**
- Export secrets to secure location
- Store VAPID keys offline (encrypted)
- Document recovery procedures

## Local Development

For local development, use `.env` files (not committed to git):

**server/.env.local:**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/comm_ng
REDIS_AUTH=your-local-redis-auth
REDIS_HOST=localhost
REDIS_PORT=6379
VAPID_PUBLIC_KEY=your-local-public-key
VAPID_PRIVATE_KEY=your-local-private-key
VAPID_CONTACT_EMAIL=mailto:admin@localhost
```

**web/.env.local:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3001
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-local-public-key
```

**Add to .gitignore:**
```
.env
.env.local
.env.*.local
```

## Production Checklist

Before deploying to production:

- [ ] VAPID keys generated and stored in Secrets Manager
- [ ] Verify secret format (JSON with correct keys)
- [ ] Verify IAM permissions for secret access
- [ ] Test secret retrieval from ECS task
- [ ] Verify application logs show no secret-related errors
- [ ] Enable CloudTrail logging for Secrets Manager
- [ ] Document secret rotation procedures
- [ ] Back up secrets to secure offline location
- [ ] Set up alerts for secret access
- [ ] Review least-privilege IAM policies

---

**Last Updated**: November 2, 2025
