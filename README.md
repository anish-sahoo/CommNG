<p align="center">
  <img src="./assets/MA_NG_Comms_and_Mentorship_Logo.png" alt="Massachusetts National Guard Logo and Text" width="1200">
</p>


<p align="center">
  <a href="#vision">About</a> •
  <a href="#repository-structure">Structure</a> •
  <a href="#key-features">Features</a> •
  <a href="#getting-started">Setup</a> •
  <a href="#running-locally">Run</a> •
  <a href="#ci-cd-workflows">CI/CD</a> •
  <a href="#documentation-hub">Docs</a> •
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center"><strong>A centralized platform for communication and mentorship within the Massachusetts National Guard, enabling top-down messaging and structured mentor-mentee connections.</strong></p>

---

<a id="vision"></a>

## 🌟 Vision

Establishing meaningful connections and organizational transparency between leaders and members through streamlined communication and mentorship.

This platform allows for the Massachusetts National Guard to foster trust, clarity, and professional growth by bridging the gap between leadership and enlisted members. Through centralized communication tools and structured mentorship programs, we aim to cultivate stronger community ties, promote knowledge sharing, and ensure every member has access to guidance, updates, and support throughout their service.

---

<a id="repository-structure"></a>

## 🗂️ Repository Structure

| Path | Purpose |
| --- | --- |
| `web/` | Next.js 15 frontend (App Router, tRPC client) |
| `server/` | Express/tRPC backend, database/cache integration, notification worker |
| `infra/` | Terraform IaC modules + environment state configuration |
| `docs/` | Operations guides (local setup, secrets, infra, deployments, quick ref) |
| `assets/` | Project artwork and brand assets |
| `.github/workflows/` | CI/CD pipelines for build + ECS deployments |
| `docker-compose.yml` | Local Postgres + Redis stack for shared development |
| `biome.json` | Formatting and linting configuration |

---

<a id="key-features"></a>

## 🔑 Key Features

<div align="center">

| 🎯 Focus | What It Delivers | Why It Matters |
| --- | --- | --- |
| **Mission-Critical Communication** | Broadcast emergencies to ~4,000 members, segment by unit, share rich media, and capture issues in one feed. | Keeps leadership aligned with troops, ensuring time-sensitive guidance reaches the right squads instantly. |
| **Mentorship Engine** | Streamlined mentor onboarding, automated mentor/mentee pairing, controlled contact sharing, and oversight dashboards. | Builds long-term readiness by pairing experience with emerging talent while keeping commanders in the loop. |

</div>

---

## ⚙️ Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, tRPC |
| Data | PostgreSQL (RDS), Valkey/Redis (ElastiCache), S3 |
| Infrastructure | Docker, ECS Fargate, Application Load Balancer, AWS |
| Dev Experience | GitHub Actions, Terraform, Biome, tRPC |
| Security | TLS encryption, DoD compliance, AWS Secrets Manager |

---

## 🧰 System Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker Desktop (for containerized environments)
- AWS CLI (for deployment)
- Terraform CLI 

## 👥 User Personas

| Persona | Primary Actions | Access Highlights |
| --- | --- | --- |
| 🛡️ Leadership | Broadcast emergency/comms updates | Global announcements, unit-level targeting, insights |
| 🎓 Mentors | Apply for mentorship, manage mentee relationships | Mentor roster, contact info (with controls), mentoring history |
| 🎯 Mentees | Request mentors, stay connected with assigned mentors | Mentor directory access, messaging, mentorship status |
| 📣 General Members | Receive alerts, submit issues or feedback | Notification feed, unit announcements, issue reporting |
| 🧭 System Admins | Approve mentors, manage matches, monitor system health | Admin console, audit logs, override tools |

<a id="getting-started"></a>

## 🚀 Getting Started

### 1. Project Orientation

- **[Configuration Overview](./docs/CONFIGURATION.md)** – high-level architecture, shared domain routing, and environment variable strategy.
- **[Notification System](./docs/NOTIFICATIONS.md)** – Web Push/VAPID details and testing notes.

### 2. Local Development

- **[Local Development Setup](./docs/LOCAL-SETUP.md)** – prerequisites, environment files, local services, and developer scripts.

#### Environment Setup

```bash
# create app env files from the examples
cp server/.env.example server/.env
cp web/.env.example web/.env

# optional: customize for local overrides
cp server/.env server/.env.local
cp web/.env web/.env.local
```

Populate `server/.env` with database/cache credentials, AWS assets, and notification keys. Populate `web/.env` with web URLs and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. See `docs/SECRETS-SETUP.md` for generating and storing secrets.

> **Tip:** Store machine-specific overrides in `.env.local`. It is ignored by Git and keeps shared `.env` files clean for teammates.

<a id="running-locally"></a>

#### 🧪 Running Locally

```bash
# start postgres + redis defined in docker-compose.yml
docker compose up --build -d

# install shared dependencies (runs from repo root)
npm install

# start backend (http://localhost:3000)
cd server
npm run dev

# start frontend (http://localhost:3001)
cd web
npm run dev
```

For production-style verification:

```bash
npm run build
npm start          # serves compiled build
npm run test       # execute unit/integration tests
```

> **Troubleshooting:** If the frontend cannot reach the API, confirm `NEXT_PUBLIC_API_BASE_URL` matches the server URL and that docker services are running (`docker ps`).

### 🔐 Secrets & Credentials

- **[Secrets Management](./docs/SECRETS-SETUP.md)** – how to generate VAPID keys, populate AWS Secrets Manager, and manage sensitive values.
- Configuration templates:
  - `server/.env.example` → copy to `server/.env` (or `.env.local`)
  - `web/.env.example` → copy to `web/.env`
- For local development defaults, see `docker-compose.yml` and `docs/LOCAL-SETUP.md`.

### 🏗️ Infrastructure & Deployment

- **[Infrastructure Guide](./docs/INFRA.md)** – Terraform provisioning, GitHub Actions workflows, and deployment process.
- **[Deployment Checklist](./docs/DEPLOYMENT-CHECKLIST.md)** – pre-flight verification before promoting changes.
- **[Quick Reference](./docs/QUICK-REFERENCE.md)** – frequently-used CLI commands, ECS/ECR operations, and troubleshooting tips.

<a id="documentation-hub"></a>

### 📚 Documentation Hub

| Topic                           | Reference                      |
| ------------------------------- | ------------------------------ |
| Local development workflow      | [`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md)          |
| Environment variables & secrets | [`docs/SECRETS-SETUP.md`](docs/SECRETS-SETUP.md)        |
| Infrastructure and Terraform    | [`docs/INFRA.md`](docs/INFRA.md)                |
| Deployment checklist            | [`docs/DEPLOYMENT-CHECKLIST.md`](docs/DEPLOYMENT-CHECKLIST.md) |
| Notifications & web push        | [`docs/NOTIFICATIONS.md`](docs/NOTIFICATIONS.md)        |
| Quick troubleshooting commands  | [`docs/QUICK-REFERENCE.md`](docs/QUICK-REFERENCE.md)      |

<a id="ci-cd-workflows"></a>

## 🚦 CI/CD Workflows

| Workflow                              | Trigger                          | Purpose                                             |
| ------------------------------------- | -------------------------------- | --------------------------------------------------- |
| `.github/workflows/build.yml`         | Pull requests and pushes to main | Lint, test, and build server + web bundles          |
| `.github/workflows/deploy-server.yml` | Release/tag or manual dispatch   | Build server image, push to ECR, deploy ECS service |
| `.github/workflows/deploy-web.yml`    | Release/tag or manual dispatch   | Build web image, push to ECR, deploy ECS service    |

Infrastructure as Code lives in `infra/` and is detailed in `docs/INFRA.md`. Terraform state backend configuration and AWS credentials are described in that guide.

Secrets for workflows are managed via AWS Secrets Manager; refer to `docs/SECRETS-SETUP.md` for the exact secret names and rotation process.

---

### Additional Notes

- All documentation assumes AWS region `us-east-1` unless otherwise stated.
- Update the documents when infrastructure or tooling changes to keep this index accurate.

### Standards

- Biome for formatting/linting
- Full TypeScript coverage
- Write tests for new features
- Follow DoD security standards

### Git Workflow

- Branch naming: `feature/NAME`, `bugfix/NAME`, `hotfix/NAME`, `chore/NAME`, `refactor/NAME`
- All changes require PR approval prior to merging
- Present tense commit messages

---

## Requirements

### Performance

- Support 4,000-8,000 concurrent users
- Pass load testing with 4,000 users
- Horizontal scaling capability

### Security

- No hardcoded secrets
- TLS encryption everywhere
- NIST 800-53 compliance
- US-based infrastructure only
- Comprehensive audit trails

### Data Retention

- User accounts: Active service + 2 years
- Message logs: 18 months
- System logs: 12 months

<a id="roadmap"></a>

## 🗺️ Roadmap

### Phase 1 
- [x] Project structure
- [x] tRPC API setup
- [x] Frontend foundation
- [x] User authentication
- [x] Basic communication

    > ██████████ **100%**

### Phase 2  (Current)
- [x] Mentorship system
- [ ] Matching algorithm
- [ ] Admin dashboard
- [ ] Unit channels

    > ████░░░░░░ *25%*

### Phase 3 
- [ ] Advanced reporting
- [ ] Mobile optimization
- [x] Push notifications

    > ███░░░░░░░ *33%*

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/feature1`
3. Make changes following standards
4. Write tests
5. Run linting: `npm run lint && npm run test`
6. Commit: `git commit -m "Add feature"`
7. Push: `git push origin feature/feature1`
8. Open Pull Request

### PR Requirements

- Clear description
- Testing details
- **Type:** bug fix, feature, refactor, docs
- **Scope:** Frontend, Backend, Infrastructure, Data, DevOps

---

## Infrastructure

The application is deployed on AWS using ECS Fargate with auto-scaling capabilities. For detailed setup and deployment instructions, see:

- **[Infrastructure Guide](docs/INFRA.md)** - Complete setup, Terraform, and GitHub Actions documentation
- **[Quick Reference](docs/QUICK-REFERENCE.md)** - Common commands and troubleshooting

### Quick Deploy

```bash
# 1. Set up infrastructure
cd infra
terraform init
terraform apply

# 2. Deploy via GitHub Actions
# Go to Actions → Select workflow → Run workflow
```

## License

This project is developed for the Massachusetts National Guard. All rights reserved.
