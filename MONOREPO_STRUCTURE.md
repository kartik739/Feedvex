# Feedvex Monorepo Structure

This is a monorepo containing both the backend and frontend for Feedvex.

## Directory Structure

```
feedvex/
├── src/                      # Backend source code (Node.js + TypeScript)
│   ├── api/                 # REST API endpoints
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration
│   ├── index.ts             # Backend entry point
│   └── server.ts            # Express server
│
├── frontend/                 # Frontend application (React + TypeScript)
│   ├── src/                 # Frontend source code
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── styles/          # Global styles
│   │   ├── store/           # State management
│   │   └── services/        # API client
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite configuration
│   └── tsconfig.json        # Frontend TypeScript config
│
├── scripts/                  # Utility scripts
│   ├── init-db.sql          # Database initialization
│   └── seed-test-data.ts    # Test data seeding
│
├── config/                   # Configuration files
│   ├── prometheus/          # Prometheus config
│   └── grafana/             # Grafana dashboards
│
├── .kiro/                    # Kiro specs and configuration
│   └── specs/feedvex/       # Feature specifications
│
├── package.json              # Backend dependencies
├── tsconfig.json             # Backend TypeScript config
├── docker-compose.yml        # Multi-container orchestration
├── Dockerfile                # Backend container
└── README.md                 # Main documentation
```

## Key Points

### Backend (Root Level)
- **Language:** TypeScript + Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Cache:** Redis
- **Testing:** Jest
- **Package Manager:** npm

### Frontend (frontend/ folder)
- **Language:** TypeScript + React 19
- **Build Tool:** Vite
- **Routing:** React Router
- **State:** Zustand
- **Testing:** Vitest + React Testing Library
- **Package Manager:** npm

## Development Workflow

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
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
cd frontend && npm run build
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

- **Backend:** Dockerfile at root
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

### Backend (.env at root)
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
```

### Frontend (frontend/.env)
```env
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

1. **Clear Separation:** Backend and frontend are clearly separated
2. **Independent Deployment:** Each can be deployed independently
3. **Shared Tooling:** Can share scripts, configs, and documentation
4. **Single Repository:** Easier to manage versions and dependencies
5. **Docker Ready:** Both services containerized and orchestrated

## CI/CD Considerations

When setting up CI/CD:

1. **Backend Tests:** Run from root with `npm test`
2. **Frontend Tests:** Run from frontend/ with `cd frontend && npm test`
3. **Backend Build:** Run from root with `npm run build`
4. **Frontend Build:** Run from frontend/ with `cd frontend && npm run build`
5. **Docker Build:** Build both images from root with docker-compose

## Migration Notes

- ✅ Removed old `public/` folder (basic HTML/JS frontend)
- ✅ Frontend now exclusively in `frontend/` folder
- ✅ Backend at root level
- ✅ No duplicate files
- ✅ Clean monorepo structure
