# Feedvex

A production-quality Reddit search engine with a modern React frontend. Features advanced ranking algorithms (TF-IDF and BM25), real-time autocomplete, user authentication, and comprehensive analytics.

## Features

### Backend
- **Data Collection**: Concurrent Reddit API fetching with retry logic and duplicate detection
- **Text Processing**: HTML stripping, tokenization, stopword removal, and stemming
- **Inverted Index**: Fast document retrieval with term frequencies and positions
- **Advanced Ranking**: BM25 algorithm with multi-factor scoring (relevance, recency, popularity, engagement)
- **Query Processing**: Fast search with caching, pagination, and snippet generation
- **Rate Limiting**: Sliding window algorithm to prevent abuse
- **Autocomplete**: Trie-based prefix matching for query suggestions
- **Analytics**: Search usage tracking and click-through rate analysis
- **Authentication**: JWT-based user authentication with bcrypt password hashing
- **Production Ready**: Docker containerization, monitoring, and structured logging

### Frontend
- **Modern UI**: React 19 + TypeScript with Vite
- **Design System**: Glassmorphism effects, custom CSS variables, responsive design
- **Dark Mode**: System preference detection with manual toggle
- **Authentication**: Login/signup with JWT tokens
- **Search Interface**: Real-time autocomplete, result highlighting, pagination
- **User Dashboard**: Profile management and search statistics
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Performance**: Code splitting, lazy loading, optimized assets
- **Error Handling**: Error boundaries, network error recovery, offline detection
- **Responsive Design**: Mobile-first design with tablet and desktop optimizations

## Project Structure

This is a monorepo containing both backend and frontend:

```
├── src/                    # Backend (Node.js + TypeScript)
│   ├── models/            # Data models and types
│   ├── services/          # Business logic components
│   ├── utils/             # Utility functions
│   ├── api/               # REST API endpoints
│   └── config/            # Configuration management
├── frontend/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── store/        # State management (Zustand)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   ├── styles/       # Global styles and design tokens
│   │   └── test/         # Test setup and utilities
│   ├── vitest.config.ts  # Test configuration
│   └── Dockerfile        # Frontend container
├── scripts/              # Database initialization and utilities
├── config/               # Prometheus & Grafana config
├── .kiro/                # Kiro specs and configuration
└── docker-compose.yml    # Multi-container orchestration
```

> **Note:** See [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md) for detailed monorepo documentation.

## Quick Start with Docker

The easiest way to run Feedvex is using Docker Compose:

```bash
# 1. Clone the repository
git clone <repository-url>
cd feedvex

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your Reddit API credentials

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:8080
# API: http://localhost:3000
# Grafana: http://localhost:3001
```

## Manual Installation

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- Redis 7+
- Reddit API credentials

### Backend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
psql -U postgres -f scripts/init-db.sql

# Build and start
npm run build
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure API URL
cp .env.example .env
# Edit VITE_API_URL if needed (default: http://localhost:3000)

# Start development server
npm run dev
# Frontend will be available at http://localhost:5173

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Frontend Features

The frontend includes:
- **Responsive Design**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Lazy loading, code splitting, optimized images
- **Error Handling**: Error boundaries, network error recovery, offline detection
- **Loading States**: Skeleton loaders, loading spinners, button loading states
- **Theme Support**: Light/dark mode with smooth transitions

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Search
- `POST /api/v1/search` - Search documents
- `GET /api/v1/autocomplete` - Get query suggestions
- `POST /api/v1/click` - Log click event

### System
- `GET /api/v1/health` - Health check
- `GET /api/v1/stats` - System statistics
- `GET /api/v1/metrics` - Prometheus metrics

## Configuration

See `.env.example` for all available configuration options.

Key settings:
- **REDDIT_CLIENT_ID**: Your Reddit API client ID
- **REDDIT_CLIENT_SECRET**: Your Reddit API client secret
- **REDDIT_SUBREDDITS**: Comma-separated list of subreddits to index
- **JWT_SECRET**: Secret key for JWT token signing
- **RANKING_ALGORITHM**: Choose between 'tfidf' or 'bm25'
- **BM25_K1**: Term saturation parameter (default: 1.2)
- **BM25_B**: Length normalization parameter (default: 0.75)

## Development

```bash
# Backend
npm run dev          # Development mode with hot reload
npm test             # Run tests
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code

# Frontend
cd frontend
npm run dev          # Start Vite dev server (http://localhost:5173)
npm test             # Run Vitest tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Frontend Development Tips

- **Hot Module Replacement**: Changes are reflected instantly without full page reload
- **Component Testing**: Tests are located in `__tests__` folders next to components
- **Accessibility Testing**: Use keyboard navigation and screen readers during development
- **Responsive Testing**: Test on different screen sizes using browser dev tools
- **Performance**: Use React DevTools Profiler to identify performance bottlenecks

## Testing

The project uses a dual testing approach:
- **Unit tests**: Specific examples and edge cases
- **Property-based tests**: Universal properties validated with fast-check

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Monitoring

Access monitoring dashboards:
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

Metrics include:
- Query latency and throughput
- Cache hit rate
- Error rates
- System resource usage

## License

MIT
