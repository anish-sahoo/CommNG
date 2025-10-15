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
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Kubernetes, AWS/GCP
- **Security**: TLS encryption, DoD compliance

## User Types

- **Leadership**: Send broadcasts, access reports
- **Mentors**: Apply to mentor, manage relationships
- **Mentees**: Request matching, access mentor info
- **General Members**: Receive announcements, submit reports
- **System Admins**: Approve mentors, manage matches

## Getting Started

### Prerequisites
- Node.js 18+
- Docker
- PostgreSQL

### Setup

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd CommNG/server && npm install
cd ../web && npm install
```

2. Start development servers:
```bash
0. Install node and docker

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd CommNG/server && npm install
cd ../web && npm install
```

2. Setup backend databases
```bash
cd CommNG/
cp .env.example .env # and populate this file with credentials
docker compose up -d # starts docker containers for redis
```

3. Start development servers:
```bash
# Backend
cd server && npm run dev

# Frontend  
cd web && npm run dev
```

4. Populate DB:

Note: Only run these lines if the DB isn't initialized yet
```bash
cd server
npm run db:migrate
npm run db:seed # only run this line if you want mock data
```

5. Access:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/trpc
- tRPC UI: http://localhost:3000/trpc-ui


### Troubleshooting
```bash
docker compose down -v # deleting docker containers (only when something goes wrong, otherwise just stop it in the Docker Desktop UI)
docker compose up -d # re-creates everything
```

## Development

### Scripts
- `npm run dev` - Development server
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run lintfix` - Format code

#### Backend specific:
- `npm run db:generate` - Create a migration, run this after changing things in the db schema
- `db:migrate` - Apply latest migration to the db
- `db:studio` - Drizzle Studio UI
- `db:seed` - Seed the db with some random data

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

## License

This project is developed for the Massachusetts National Guard. All rights reserved.