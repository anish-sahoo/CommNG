<div align="center" style="margin: 1.5rem auto;">
  <table role="presentation" style="border:none;border-radius:18px;background:#0f172a;padding:1.5rem 2rem;box-shadow:0 10px 30px rgba(15,23,42,0.35);color:#f8fafc;width:100%;max-width:1200px;">
    <tr>
      <td style="vertical-align:middle;padding-right:1.5rem;">
        <img src="../web/public/icons/favicon_yellow.svg" alt="CommNG Favicon" width="72">
      </td>
      <td style="vertical-align:middle;">
        <h1 style="margin:0;font-size:2rem;color:#f8fafc;">🛠️ Local Setup</h1>
      </td>
    </tr>
  </table>
</div>

<p align="center">
  <a href="#prerequisites">Prereqs</a> •
  <a href="#1-clone-the-repository--install-dependencies">Clone & Install</a> •
  <a href="#2-configure-environment-variables">Env Vars</a> •
  <a href="#3-start-development-servers">Run Apps</a> •
  <a href="#4-database-management">Database</a> •
  <a href="#5-development-scripts">Scripts</a> •
  <a href="#6-troubleshooting">Troubleshooting</a> •
  <a href="#7-next-steps">Next Steps</a>
</p>

# Local Development Setup

Follow this guide to run the CommNG applications locally for development and testing.

## Prerequisites

- **Node.js**: v24.x (LTS recommended)
- **pnpm**: v9.x or later
- **Docker**: Desktop or Engine (for local database/cache)
- **AWS CLI**: v2.x (configured with appropriate profile)
- **Terraform**: v1.5.0+

## 1. Clone the Repository & Install Dependencies

```bash
git clone <repository-url>
cd CommNG

# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../web && npm install
```

## 2. Configure Environment Variables

1. Copy the example environment files (update values as needed):

   ```bash
   cd server
   cp .env.example .env.local

   cd ../web
   cp .env.example .env.local
   ```

2. Populate the environment files with credentials:
   - PostgreSQL connection string (`DATABASE_URL`)
   - Redis details (`REDIS_HOST`, `REDIS_AUTH`)
   - VAPID keys for push notifications (or temporary placeholders for local tests)

3. Start Redis (and any other required services) via Docker Compose:

   ```bash
   cd ../
   docker compose up -d
   ```

## 3. Start Development Servers

```bash
# Terminal 1 - API server
cd server
npm run dev

# Terminal 2 - Next.js web app
cd web
npm run dev
```

- API available at `http://localhost:3000`
- Web UI available at `http://localhost:3001`

## 4. Database Management

Run these commands from the `server` directory:

```bash
# Apply latest migrations
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

Use Drizzle Studio or your preferred SQL client to inspect data.

## 5. Development Scripts

```bash
npm run dev       # start dev server
npm run test      # run unit tests
npm run lint      # lint codebase
npm run format    # format code
npm run lintfix   # lint + auto-fix issues
```

### Backend-specific Scripts

```bash
npx drizzle-kit push      # apply latest migrations
npm run db:studio         # open Drizzle Studio UI
```

## 6. Troubleshooting

```bash
# Reset Docker services
cd CommNG
docker compose down -v

docker compose up -d
```

Common issues:
- **Ports already in use**: stop conflicting processes or change ports in `.env.local`.
- **Missing VAPID keys**: generate temporary keys with `npx web-push generate-vapid-keys --json`.
- **Database connectivity**: ensure PostgreSQL is running and credentials match `.env.local`.

## 7. Next Steps

After local setup, proceed with:
1. [Secrets configuration](./SECRETS-SETUP.md)
2. [Infrastructure provisioning](./INFRA.md)
3. [Deployment workflows](./QUICK-REFERENCE.md)

---

**Last updated:** November 2, 2025
