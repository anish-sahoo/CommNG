# MA National Guard Communication and Mentorship Hub

A centralized platform for communication and mentorship within the Massachusetts National Guard, enabling top-down messaging and structured mentor-mentee connections.

## Vision

Establishing meaningful connections and organizational transparency between leaders and members through streamlined communication and mentorship.

## Key Features

### Communication
- Emergency message broadcasting to all members (~4,000 users) or specific units
- Unit-specific channels for battalions, regiments, and groups
- Rich content support (text, hyperlinks, images)
- Issue reporting system

### Mentorship
- Mentor application and approval system
- Algorithm-based mentor-mentee matching
- Secure contact information access
- Administrative oversight tools

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, tRPC
- **Database**: PostgreSQL (RDS)
- **Cache**: Valkey/Redis (ElastiCache)
- **Storage**: S3
- **Infrastructure**: Docker, ECS Fargate, AWS
- **Load Balancing**: Application Load Balancer
- **CI/CD**: GitHub Actions
- **IaC**: Terraform
- **Security**: TLS encryption, DoD compliance

## User Types

- **Leadership**: Send broadcasts, access reports
- **Mentors**: Apply to mentor, manage relationships
- **Mentees**: Request matching, access mentor info
- **General Members**: Receive announcements, submit reports
- **System Admins**: Approve mentors, manage matches

## Getting Started
### 1. Project Orientation
- **[Configuration Overview](./CONFIGURATION.md)** – high-level architecture, shared domain routing, and environment variable strategy.
- **[Notification System](./NOTIFICATIONS.md)** – Web Push/VAPID details and testing notes.

### 2. Local Development
- **[Local Development Setup](./LOCAL-SETUP.md)** – prerequisites, environment files, local services, and developer scripts.

### 3. Secrets & Credentials
- **[Secrets Management](./SECRETS-SETUP.md)** – how to generate VAPID keys, populate AWS Secrets Manager, and manage sensitive values.

### 4. Infrastructure & Deployment
- **[Infrastructure Guide](./INFRA.md)** – Terraform provisioning, GitHub Actions workflows, and deployment process.
- **[Deployment Checklist](./DEPLOYMENT-CHECKLIST.md)** – pre-flight verification before promoting changes.
- **[Quick Reference](./QUICK-REFERENCE.md)** – frequently-used CLI commands, ECS/ECR operations, and troubleshooting tips.

### Additional Notes
- All documentation assumes AWS region `us-east-1` unless otherwise stated.
- Update the documents when infrastructure or tooling changes to keep this index accurate.

### Standards
- Biome for formatting/linting
- Full TypeScript coverage
- Write tests for new features
- Follow DoD security standards

### Git Workflow
- Branch naming: `feature/NAME`, `bugfix/NAME`, `hotfix/NAME`, `chore/NAME`
- All changes require PR approval
- Squash merge only
- Present tense commit messages

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

## Roadmap

### Phase 1 (Current)
- [x] Project structure
- [x] tRPC API setup
- [x] Frontend foundation
- [ ] User authentication
- [ ] Basic communication

### Phase 2
- [ ] Mentorship system
- [ ] Matching algorithm
- [ ] Admin dashboard
- [ ] Unit channels

### Phase 3
- [ ] Advanced reporting
- [ ] Mobile optimization
- [ ] Push notifications

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
- Type: bug fix, feature, refactor, docs
- Scope: frontend, backend, infrastructure, data, DevOps

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