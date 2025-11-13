<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">⚙️ Configuration Hub</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#architecture-overview">Architecture</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#environment-variables">Environment</a> •
  <a href="#key-configuration-points">Key Points</a> •
  <a href="#secrets-management">Secrets</a> •
  <a href="#testing-the-setup">Testing</a> •
  <a href="#common-issues">Issues</a> •
  <a href="#benefits-of-this-setup">Benefits</a> •
  <a href="#next-steps">Next Steps</a>
</p>

# Configuration Summary: Shared Domain with ALB

<a id="architecture-overview"></a>

## 🏗️ Architecture Overview

<div align="center">

```text
User Request
    ↓
Application Load Balancer (ALB)
    ↓
    ├─→ /api/*, /trpc/* → Server (Node.js:3000)
    └─→ /* (everything else) → Web (Next.js:3001)
```

</div>

> Both services share the same URL: `http://your-alb-dns-name.com`

---

<a id="how-it-works"></a>

## ⚙️ How It Works

<details open>
<summary><strong>1. ALB Path-Based Routing</strong></summary>

The ALB listener rules route traffic:
- Pattern: `/api/*` → Server target group
- Pattern: `/trpc/*` → Server target group
- Default: `/*` → Web target group

</details>

<details open>
<summary><strong>2. Same Domain, Different Services</strong></summary>

**From the user's perspective:**
- `http://your-app.com/` → Next.js homepage
- `http://your-app.com/login` → Next.js login page
- `http://your-app.com/api/trpc` → Node.js tRPC API
- `http://your-app.com/api/auth` → Node.js auth endpoints

</details>

<details open>
<summary><strong>3. tRPC Configuration</strong></summary>

**Web side (query-provider.tsx):**
```typescript
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const trpcUrl = apiBase ? `${apiBase}/api/trpc` : "/api/trpc";
```

**Behavior:**
- **Local dev**: `http://localhost:3000/api/trpc` (explicit server URL)
- **Production**: `http://alb-url.com/api/trpc` (same domain, ALB routes to server)
- **Fallback**: `/api/trpc` (relative path, works when same domain)

**Server side (index.ts):**
```typescript
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
}));
```

Listens on `/api/trpc` endpoint at port 3000.

</details>

---

<a id="environment-variables"></a>

## 🧬 Environment Variables

<details open>
<summary><strong>Local Development</strong></summary>

**server/.env.local:**
```bash
PORT=3000
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_AUTH=your-auth
VAPID_PUBLIC_KEY=BLZ07...
VAPID_PRIVATE_KEY=xYz...
```

**web/.env.local:**
```bash
PORT=3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000  # Different domain in dev
NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3001
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLZ07...
```

</details>

<details open>
<summary><strong>Production/ECS</strong></summary>

**Server environment (from Terraform):**
```bash
# Public env vars
NODE_ENV=production
PORT=3000
REDIS_HOST=<elasticache-endpoint>
DATABASE_HOST=<rds-endpoint>
S3_BUCKET=<bucket-name>

# From Secrets Manager
DATABASE_URL=<from-rds-secret>
REDIS_AUTH=<from-cache-secret>
VAPID_PUBLIC_KEY=<from-vapid-secret:publicKey>
VAPID_PRIVATE_KEY=<from-vapid-secret:privateKey>
```

**Web environment (from Terraform):**
```bash
# Public env vars
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_BASE_URL=http://<alb-dns>  # Same as web URL!
NEXT_PUBLIC_WEB_BASE_URL=http://<alb-dns>

# From Secrets Manager
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from-vapid-secret:publicKey>
```

</details>

---

<a id="key-configuration-points"></a>

## 🧩 Key Configuration Points

<div align="center">

| ✅ No Changes Needed | ✅ Handled by Terraform |
| --- | --- |
| 1. **query-provider.tsx** - Already handles same domain correctly<br>2. **Server endpoints** - Already use `/api/trpc` prefix<br>3. **CORS** - Already allows same-origin with credentials | 1. **ALB routing rules** - Automatically configured<br>2. **Environment variables** - Injected into containers<br>3. **Secrets Manager** - Values pulled at runtime<br>4. **Health checks** - ALB checks `/health` on server |

</div>

### ⚠️ Manual Steps Required

1. **Generate VAPID keys**: `npx web-push generate-vapid-keys`
2. **Store in Secrets Manager**: See [SECRETS-SETUP.md](./SECRETS-SETUP.md)
3. **Initial Docker builds**: See [INFRA.md](./INFRA.md)

---

<a id="secrets-management"></a>

## 🔐 Secrets Management

All secrets are stored in AWS Secrets Manager, not in code or Terraform:

| Secret | Location | Used By |
|--------|----------|---------|
| Database password | Auto-generated by RDS | Server |
| Redis AUTH | Auto-generated by Terraform | Server |
| VAPID keys (public, private, contact) | **Manual** (you create) | Server + Web |

**ECS Task Definition References Secrets:**
```terraform
secrets = [
  {
    name      = "VAPID_PUBLIC_KEY"
    valueFrom = "arn:aws:secretsmanager:...:publicKey::"
  }
]
```

At runtime, ECS:
1. Fetches secret from Secrets Manager
2. Extracts the JSON field (`publicKey`)
3. Injects as environment variable into container

**Result**: Your application code reads `process.env.VAPID_PUBLIC_KEY` normally.

---

<a id="testing-the-setup"></a>

## 🧪 Testing the Setup

<details open>
<summary><strong>1. Test ALB Routing</strong></summary>

```bash
# Get ALB URL
ALB_URL=$(terraform output -raw alb_dns_name)

# Test web (should return Next.js HTML)
curl http://$ALB_URL/

# Test server health check
curl http://$ALB_URL/health

# Test tRPC endpoint
curl http://$ALB_URL/api/trpc
```

</details>

<details open>
<summary><strong>2. Verify Environment Variables in Container</strong></summary>

```bash
# List tasks
aws ecs list-tasks --cluster dev-comm-ng-cluster --service-name dev-comm-ng-server-service

# Describe task (shows env vars, secrets are masked)
aws ecs describe-tasks --cluster dev-comm-ng-cluster --tasks <task-arn>
```

</details>

<details open>
<summary><strong>3. Check Application Logs</strong></summary>

```bash
# Server logs
aws logs tail /ecs/dev-comm-ng-server --follow

# Web logs
aws logs tail /ecs/dev-comm-ng-web --follow
```

Look for:
- No "undefined" environment variables
- Successful database connections
- No secret-related errors

</details>

---

<a id="common-issues"></a>

## 🚨 Common Issues

<details>
<summary><strong>Issue: Health check stuck at "initializing" (Redis)</strong></summary>

**Symptoms**: Logs show "Redis Client: Connected" but never "Redis Client: Ready" and `/api/health` keeps reporting `postgres: true, redis: false`.

**Cause**: AWS ElastiCache Serverless (Valkey/Redis) requires TLS in-transit. If the client connects without TLS (`redis://`), the socket connects but never becomes ready.

**Solution**:
- The server auto-enables TLS for hosts ending with `cache.amazonaws.com` and when `REDIS_TLS=true`.
- Ensure these env vars are set in production:

```bash
REDIS_HOST=<elasticache-endpoint>      # e.g., dev-comm-ng-...cache.amazonaws.com
REDIS_PORT=6379
REDIS_USERNAME=default                 # default unless you created more ACL users
REDIS_PASSWORD=<from Secrets Manager>  # cache AUTH token
# (optional) force TLS explicitly
REDIS_TLS=true
```

Locally (Docker/localhost), you typically don't want TLS, so omit `REDIS_TLS` and keep `REDIS_HOST=localhost`.

</details>

<details>
<summary><strong>Issue: tRPC calls fail with 404</strong></summary>

**Cause**: ALB routing rule not matching

**Check**:
```bash
# Verify listener rules
aws elbv2 describe-rules --listener-arn <listener-arn>
```

Should show rule with path pattern `/api/*` and `/trpc/*`.

</details>

<details>
<summary><strong>Issue: CORS errors in browser</strong></summary>

**Cause**: Origin mismatch

**Solution**: Both web and server use same domain via ALB, so CORS should work with `origin: true, credentials: true`.

</details>

<details>
<summary><strong>Issue: Environment variable is undefined</strong></summary>

**Cause**: Secret not populated or wrong format

**Solution**: See [SECRETS-SETUP.md](./SECRETS-SETUP.md) troubleshooting section.

</details>

---

<a id="benefits-of-this-setup"></a>

## 🎯 Benefits of This Setup

1. ✅ **Single domain** - Users only see one URL
2. ✅ **No CORS issues** - Same-origin requests
3. ✅ **Clean URLs** - No ports in production
4. ✅ **SSL-ready** - Add certificate to ALB when ready
5. ✅ **Secure secrets** - Never exposed in code or logs
6. ✅ **Independent scaling** - Server and web scale separately
7. ✅ **Zero downtime** - ALB handles rolling deployments

---

<a id="next-steps"></a>

## 🧭 Next Steps

1. Complete initial deployment (see [`INFRA.md`](./INFRA.md))
2. Set up VAPID keys (see [`SECRETS-SETUP.md`](./SECRETS-SETUP.md))
3. Test all endpoints through ALB
4. Set up custom domain (optional)
5. Add SSL certificate (optional)
6. Configure GitHub Actions for CI/CD

---

**Last Updated**: November 2, 2025
