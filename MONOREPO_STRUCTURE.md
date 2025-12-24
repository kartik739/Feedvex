# Feedvex Monorepo Structure

This is a monorepo containing both the backend and frontend for Feedvex, with a clean separation of concerns and shared configuration at the root level.

## Directory Structure

```
feedvex/
├── backend/                  # Backend workspace (Node.js + TypeScript)
│   ├── src/                 # Backend source code
│   │   ├── api/             # REST API endpoints
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration
│   │   ├── index.ts         # Backend entry point
│   │   └── server.ts        # Express server
│   ├── scripts/             # Utility scripts
│   │   ├── init-db.sql      # Database initialization
│   │   └── seed-test-data.ts # Test data seeding
│   └── dist/                # Backend build output
│
├── frontend/                 # Frontend workspace (React + TypeScript)
│   ├── src/                 # Frontend source code
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── styles/          # Global styles
│   │   ├── store/           # State management
│   │   └── services/        # API client
│   ├── public/              # Static assets
│   ├── dist/                # Frontend build output
│   ├── vite.config.ts       # Vite configuration
│   ├── vitest.config.ts     # Test configuration
│   └── Dockerfile           # Frontend container
│
├── config/                   # Shared infrastructure configuration
│   ├── prometheus/          # Prometheus config
│   └── grafana/             # Grafana dashboards
│
├── .kiro/                    # Kiro specs and configuration
│   └── specs/               # Feature specifications
│
├── package.json              # Single package.json for all dependencies
├── tsconfig.json             # Shared TypeScript config
├── jest.config.js            # Shared test config
├── .eslintrc.json            # Shared linting config
├── .prettierrc.json          # Shared formatting config
├── .gitignore                # Shared ignore rules
├── .env                      # Single environment config
├── Dockerfile                # Backend container
├── docker-compose.yml        # Multi-container orchestration
└── README.md                 # Main documentation
```

## Key Points

### Backend (backend/ folder)
- **Language:** TypeScript + Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Cache:** Redis
- **Testing:** Jest
- **Package Manager:** npm
- **Build Output:** backend/dist/

### Frontend (frontend/ folder)
- **Language:** TypeScript + React 19
- **Build Tool:** Vite
- **Routing:** React Router
- **State:** Zustand
- **Testing:** Vitest + React Testing Library
- **Package Manager:** npm (shared with backend)
- **Build Output:** frontend/dist/

### Shared Configuration (Root Level)
- **Single package.json:** All dependencies managed in one place
- **Single node_modules:** Shared dependency directory
- **Shared configs:** TypeScript, ESLint, Prettier, Jest
- **Single .env:** All environment variables in one file

## Development Workflow

### Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm install
```

### Run Development Servers

```bash
# Run backend only
npm run dev

# Run frontend only
npm run dev:frontend

# Run both concurrently
npm run dev:all
```

### Build for Production

```bash
# Build backend
npm run build

# Build frontend
npm run build:frontend

# Build both
npm run build:all
```

### Run Tests

```bash
# Test backend
npm test

# Test frontend
cd frontend && npm test
```

## Docker Deployment

The monorepo is containerized with Docker:

- **Backend:** Dockerfile at root (builds from backend/src/)
- **Frontend:** Dockerfile in frontend/
- **Orchestration:** docker-compose.yml

```bash
# Start all services
docker-compose up -d

# Backend API: http://localhost:3000
# Frontend: http://localhost:8080
# Grafana: http://localhost:3001
```

## Environment Variables

### Backend and Frontend (.env at root)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/feedvex

# Redis
REDIS_URL=redis://localhost:6379

# Reddit API
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_secret_key

# Frontend (Vite variables)
VITE_API_URL=http://localhost:3000
```

## Port Allocation

- **Backend API:** 3000
- **Frontend Dev:** 5173 (Vite default)
- **Frontend Prod:** 8080 (nginx in Docker)
- **PostgreSQL:** 5432
- **Redis:** 6379
- **Prometheus:** 9090
- **Grafana:** 3001

## Advantages of This Structure

1. **Clear Separation:** Backend and frontend are clearly separated in dedicated directories
2. **Single Source of Truth:** One package.json, one node_modules, one set of configs
3. **Independent Deployment:** Each workspace can be deployed independently
4. **Shared Tooling:** Can share scripts, configs, and documentation
5. **Single Repository:** Easier to manage versions and dependencies
6. **Docker Ready:** Both services containerized and orchestrated
7. **No Duplication:** Eliminated duplicate configuration files

## CI/CD Considerations

When setting up CI/CD:

1. **Backend Tests:** Run from root with `npm test`
2. **Frontend Tests:** Run from frontend/ with `cd frontend && npm test`
3. **Backend Build:** Run from root with `npm run build` (outputs to backend/dist/)
4. **Frontend Build:** Run with `npm run build:frontend` (outputs to frontend/dist/)
5. **Docker Build:** Build both images from root with docker-compose

## Migration Notes

- ✅ Moved backend code from `src/` to `backend/src/`
- ✅ Moved backend scripts from `scripts/` to `backend/scripts/`
- ✅ Consolidated frontend/package.json into root package.json
- ✅ Removed duplicate configuration files (frontend/.env, frontend/.gitignore, etc.)
- ✅ Updated all configuration files to reference new paths
- ✅ Single node_modules at root level
- ✅ Clean monorepo structure with clear boundaries
