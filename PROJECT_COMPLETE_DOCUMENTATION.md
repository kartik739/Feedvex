# FeedVex - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Features Implemented](#features-implemented)
8. [Missing Features](#missing-features)
9. [DevOps & Infrastructure](#devops--infrastructure)
10. [Configuration](#configuration)

---

## Project Overview

**Project Name**: FeedVex  
**Type**: Reddit Search Engine  
**Tech Stack**: 
- Backend: Node.js, TypeScript, Express
- Frontend: React, TypeScript, Vite, Zustand
- Database: PostgreSQL (with in-memory fallback)
- Styling: CSS with design tokens, glassmorphism
- Testing: Jest (backend), Vitest (frontend)

**Purpose**: A powerful, fast, and relevant search engine for Reddit content with advanced ranking algorithms, real-time analytics, and modern UI/UX.

---

## Architecture

### High-Level Architecture
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│  PostgreSQL │
│   (React)   │      │  (Express)  │      │  (Optional) │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Reddit    │
                     │  Public API │
                     └─────────────┘
```

### Design Patterns
- **MVC Pattern**: Separation of concerns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Observer Pattern**: Event-driven architecture
- **Singleton Pattern**: Service instances
- **Factory Pattern**: Component creation

---


## Backend Documentation

### Directory Structure
```
backend/
├── src/
│   ├── api/           # API routes and controllers
│   ├── config/        # Configuration management
│   ├── models/        # Data models
│   ├── services/      # Business logic services
│   ├── utils/         # Utility functions
│   ├── index.ts       # Application entry point
│   └── server.ts      # Server setup
├── scripts/
│   ├── init-db.sql    # Database initialization
│   └── seed-test-data.ts  # Test data seeding
└── dist/              # Compiled JavaScript (gitignored)
```

### Core Services

#### 1. **DocumentStore Service** (`services/document-store.ts`)
**Purpose**: Manages document storage and retrieval

**Methods**:
- `store(document: Document): Promise<boolean>` - Store a single document
- `storeBatch(documents: Document[]): Promise<number>` - Store multiple documents
- `getById(id: string): Document | undefined` - Get document by ID
- `getAll(): Document[]` - Get all documents
- `search(query: string): Document[]` - Basic search
- `getBySubreddit(subreddit: string): Document[]` - Filter by subreddit
- `getByDateRange(from: Date, to: Date): Document[]` - Filter by date
- `getTotalDocuments(): number` - Get document count
- `getStats()` - Get storage statistics
- `clear(): void` - Clear all documents

**Features**:
- In-memory storage with Map for O(1) lookups
- Duplicate detection
- Batch operations
- Statistics tracking
- Ready for PostgreSQL migration


#### 2. **TextProcessor Service** (`services/text-processor.ts`)
**Purpose**: Processes and normalizes text for indexing

**Methods**:
- `processDocument(doc: Document): ProcessedDocument` - Process document
- `tokenize(text: string): string[]` - Split text into tokens
- `normalize(text: string): string` - Normalize text
- `removeStopWords(tokens: string[]): string[]` - Remove common words
- `stem(token: string): string` - Reduce words to root form

**Features**:
- Lowercasing
- Punctuation removal
- Stop word filtering (150+ common words)
- Porter stemming algorithm
- HTML entity decoding
- Unicode normalization

#### 3. **Indexer Service** (`services/indexer.ts`)
**Purpose**: Creates inverted index for fast search

**Methods**:
- `indexDocument(doc: ProcessedDocument): void` - Index a document
- `indexBatch(docs: ProcessedDocument[]): void` - Index multiple documents
- `search(query: string): string[]` - Search for documents
- `getDocumentFrequency(term: string): number` - Get term frequency
- `getTotalDocuments(): number` - Get indexed document count
- `getStats()` - Get index statistics
- `clear(): void` - Clear index

**Features**:
- Inverted index (term → document IDs)
- TF-IDF scoring
- Document frequency tracking
- Term statistics
- Memory-efficient storage


#### 4. **Ranker Service** (`services/ranker.ts`)
**Purpose**: Ranks search results using multiple algorithms

**Methods**:
- `rank(query: string, docIds: string[], algorithm: string): RankedResult[]`
- `rankBM25(query: string, docIds: string[]): RankedResult[]` - BM25 algorithm
- `rankTFIDF(query: string, docIds: string[]): RankedResult[]` - TF-IDF algorithm
- `rankHybrid(query: string, docIds: string[]): RankedResult[]` - Hybrid ranking

**Ranking Factors**:
- **Text Relevance** (40%): BM25 score
- **Recency** (20%): Time decay factor
- **Popularity** (30%): Reddit score
- **Engagement** (10%): Comment count

**Algorithms**:
- **BM25**: Best Match 25 (default)
  - k1 = 1.2 (term frequency saturation)
  - b = 0.75 (length normalization)
- **TF-IDF**: Term Frequency-Inverse Document Frequency
- **Hybrid**: Combines multiple signals

#### 5. **QueryProcessor Service** (`services/query-processor.ts`)
**Purpose**: Orchestrates search pipeline

**Methods**:
- `processQuery(query, page, pageSize, filters): SearchResults`

**Pipeline**:
1. Query normalization
2. Cache lookup
3. Index search
4. Document retrieval
5. Filtering (subreddit, date, type)
6. Ranking
7. Pagination
8. Snippet generation
9. Cache storage
10. Analytics logging

**Features**:
- Query caching
- Filter support
- Pagination
- Snippet extraction
- Performance tracking


#### 6. **RedditCollector Service** (`services/reddit-collector.ts`)
**Purpose**: Collects data from Reddit's public API

**Methods**:
- `collectFromSubreddits(subreddits: string[]): Promise<CollectionResult>`
- `collectFromSubreddit(subreddit: string): Promise<Document[]>`
- `parseRedditPost(post: any): Document` - Parse Reddit JSON

**Features**:
- Public JSON API (no authentication)
- Circuit breaker pattern
- Exponential backoff retry
- Rate limiting (2s between requests)
- Duplicate detection
- Error handling
- Progress tracking

**Configuration**:
- Subreddits: configurable list
- Max posts per subreddit: 50-100
- Collection interval: 6 hours
- Automatic scheduling

#### 7. **AuthService** (`services/auth.ts`, `services/auth-memory.ts`)
**Purpose**: User authentication and authorization

**Methods**:
- `register(email, username, password): Promise<AuthResult>`
- `login(email, password): Promise<AuthResult>`
- `verifyToken(token: string): Promise<User | null>`
- `getUserById(id: string): Promise<User | null>`

**Features**:
- JWT token generation
- Password hashing (bcrypt)
- Token verification
- User management
- In-memory storage (dev)
- PostgreSQL ready (prod)

**Security**:
- Bcrypt password hashing
- JWT with expiration
- Token validation
- Session management


#### 8. **AnalyticsService** (`services/analytics.ts`)
**Purpose**: Tracks search analytics and user behavior

**Methods**:
- `logQuery(query, resultCount, latency): void`
- `logClick(query, docId, position): void`
- `getOverallMetrics(): AnalyticsMetrics`
- `getQueryMetrics(query): QueryMetrics`
- `getPopularQueries(limit): PopularQuery[]`
- `getCTR(query): number` - Click-through rate

**Tracked Metrics**:
- Total queries
- Total clicks
- Overall CTR
- Unique queries
- Response times (min, max, avg, p95, p99)
- Popular queries
- Query-specific CTR

**Features**:
- Real-time tracking
- Statistical analysis
- Performance monitoring
- User behavior insights

#### 9. **QueryCache Service** (`services/query-cache.ts`)
**Purpose**: Caches search results for performance

**Methods**:
- `get(key: string): CachedResult | null`
- `set(key: string, value: any, ttl?: number): void`
- `has(key: string): boolean`
- `delete(key: string): boolean`
- `clear(): void`
- `getStats()` - Cache statistics

**Features**:
- LRU eviction policy
- TTL support (5 minutes default)
- Hit/miss tracking
- Memory management
- Configurable size (1000 entries)


#### 10. **RateLimiter Service** (`services/rate-limiter.ts`)
**Purpose**: Prevents API abuse

**Methods**:
- `checkRateLimit(clientId): Promise<RateLimitResult>`
- `recordRequest(clientId): void`
- `getRemainingRequests(clientId): number`
- `reset(clientId): void`

**Configuration**:
- Window: 60 seconds
- Max requests: 100 per window
- Per-client tracking
- Automatic reset

#### 11. **SearchHistory Service** (`services/search-history.ts`)
**Purpose**: Manages user search history

**Methods**:
- `addEntry(userId, query, resultCount): void`
- `getHistory(userId, limit): HistoryEntry[]`
- `deleteEntry(userId, entryId): boolean`
- `clearHistory(userId): number`

**Features**:
- Per-user history
- Timestamp tracking
- Result count tracking
- Entry management
- Privacy controls

#### 12. **Autocomplete Service** (`services/autocomplete.ts`)
**Purpose**: Provides search suggestions

**Methods**:
- `getSuggestions(prefix, limit): string[]`
- `addTerm(term): void`
- `buildFromDocuments(documents): void`

**Features**:
- Prefix matching
- Frequency-based ranking
- Real-time updates
- Configurable limit


### Utility Modules

#### Logger (`utils/logger.ts`)
- Structured logging
- Log levels: debug, info, warn, error
- Correlation ID support
- JSON output format

#### Metrics (`utils/metrics.ts`)
- Prometheus metrics
- Custom counters and histograms
- Performance tracking
- Export endpoint

#### Sanitizer (`utils/sanitize.ts`)
- Input sanitization
- XSS prevention
- SQL injection prevention
- HTML escaping

#### Correlation (`utils/correlation.ts`)
- Request tracking
- Distributed tracing
- Context management

---

## Frontend Documentation

### Directory Structure
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # State management (Zustand)
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React contexts
│   ├── styles/        # Global styles and design tokens
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Root component
│   └── main.tsx       # Entry point
├── public/            # Static assets
└── dist/              # Build output (gitignored)
```


### Core Components

#### 1. **SearchBar** (`components/SearchBar.tsx`)
**Purpose**: Main search input with autocomplete and voice search

**Features**:
- Real-time autocomplete
- Recent searches
- Voice search (Web Speech API)
- Keyboard navigation (↑↓ arrows, Enter, Esc)
- Debounced API calls (300ms)
- Loading states
- Error handling

**Props**:
- `onSearch: (query: string) => void`
- `initialQuery?: string`

#### 2. **SearchResults** (`components/SearchResults.tsx`)
**Purpose**: Displays search results with empty states

**Features**:
- Result cards with staggered animation
- Empty state with illustration
- Suggestions for no results
- Popular search tags
- Loading skeleton
- Responsive design

**Props**:
- `results: SearchResult[]`
- `query: string`
- `isLoading?: boolean`

#### 3. **ResultCard** (`components/ResultCard.tsx`)
**Purpose**: Individual search result display

**Features**:
- Glassmorphism design
- Hover effects with lift and glow
- Search term highlighting
- Expandable snippets
- Click tracking
- Ripple animation
- Metadata display (score, comments, date)
- Relevance score badge

**Props**:
- `result: SearchResult`
- `query: string`


#### 4. **Header** (`components/Header.tsx`)
**Purpose**: Navigation and user menu

**Features**:
- Logo and branding
- Navigation links
- Theme toggle (light/dark)
- User menu (click-based dropdown)
- Mobile hamburger menu
- Scroll-based hide/show
- Active link highlighting
- Authentication state

#### 5. **Footer** (`components/Footer.tsx`)
**Purpose**: Site footer with links

**Features**:
- Product links
- Resource links
- Legal links
- Social media icons
- Copyright notice
- Responsive layout

#### 6. **Pagination** (`components/Pagination.tsx`)
**Purpose**: Navigate through search results

**Features**:
- Previous/Next buttons
- Page numbers with ellipsis
- Jump to page input
- Keyboard accessible
- ARIA labels
- Smooth scroll to top

**Props**:
- `currentPage: number`
- `totalPages: number`
- `onPageChange: (page: number) => void`

#### 7. **Toast** (`components/Toast.tsx`)
**Purpose**: Notification system

**Features**:
- 4 variants: success, error, warning, info
- Auto-dismiss with timer
- Progress bar
- Close button
- Slide-in animation
- Icon support
- Accessible (ARIA live regions)

**Props**:
- `id: string`
- `type: ToastType`
- `message: string`
- `duration?: number`
- `onClose: (id: string) => void`


#### 8. **ConfirmDialog** (`components/ConfirmDialog.tsx`)
**Purpose**: Confirmation for destructive actions

**Features**:
- 3 variants: danger, warning, info
- Backdrop blur
- Click outside to close
- Escape key to close
- Keyboard navigation
- Accessible
- Mobile responsive

**Props**:
- `isOpen: boolean`
- `title: string`
- `message: string`
- `confirmText?: string`
- `cancelText?: string`
- `onConfirm: () => void`
- `onCancel: () => void`
- `variant?: 'danger' | 'warning' | 'info'`

#### 9. **SkeletonLoader** (`components/SkeletonLoader.tsx`)
**Purpose**: Loading placeholder

**Features**:
- Shimmer animation
- Glassmorphism design
- Staggered fade-in
- Configurable count
- Reduced motion support

**Props**:
- `count?: number`

#### 10. **KeyboardShortcutsHelp** (`components/KeyboardShortcutsHelp.tsx`)
**Purpose**: Display keyboard shortcuts

**Features**:
- Modal dialog
- Shortcut list with descriptions
- Keyboard-style keys
- Backdrop blur
- Escape to close

**Shortcuts**:
- `/` - Focus search
- `H` - Home
- `S` - Search page
- `P` - Profile
- `T` - Stats
- `?` - Show help
- `Esc` - Close modals


### Pages

#### 1. **HomePage** (`pages/HomePage.tsx`)
**Purpose**: Landing page

**Features**:
- Hero section
- Search bar
- Feature highlights
- Call-to-action buttons
- Responsive design
- Animations

#### 2. **SearchPage** (`pages/SearchPage.tsx`)
**Purpose**: Main search interface

**Features**:
- Search bar
- Filter panel (subreddit, sort, date range)
- Search results
- Pagination
- Result count and processing time
- Screen reader announcements
- URL query parameters
- Filter state management

#### 3. **ProfilePage** (`pages/ProfilePage.tsx`)
**Purpose**: User profile management

**Features**:
- Profile information display
- Edit profile form
- Search history
- Delete history entries
- Clear all history (with confirmation)
- Avatar placeholder
- Toast notifications
- Loading states

#### 4. **StatsPage** (`pages/StatsPage.tsx`)
**Purpose**: Analytics dashboard

**Features**:
- Total documents
- Total queries
- Total clicks
- Overall CTR
- Popular queries
- Response time stats
- Document breakdown
- Subreddit list
- Real-time updates


#### 5. **LoginPage** (`pages/LoginPage.tsx`)
**Purpose**: User authentication

**Features**:
- Email/password form
- Form validation
- Show/hide password
- Error messages
- Loading state
- Link to signup
- Toast notifications

#### 6. **SignupPage** (`pages/SignupPage.tsx`)
**Purpose**: User registration

**Features**:
- Email/username/password form
- Form validation
- Password strength indicator
- Show/hide password
- Error messages
- Loading state
- Link to login

#### 7. **NotFoundPage** (`pages/NotFoundPage.tsx`)
**Purpose**: 404 error page

**Features**:
- Custom illustration
- Error message
- Navigation links
- Back to home button

### State Management (Zustand)

#### 1. **authStore** (`store/authStore.ts`)
**State**:
- `user: User | null`
- `token: string | null`
- `isAuthenticated: boolean`

**Actions**:
- `login(email, password): Promise<void>`
- `register(email, username, password): Promise<void>`
- `logout(): void`
- `checkAuth(): Promise<void>`

**Features**:
- Persistent storage (localStorage)
- Automatic token refresh
- Auth state hydration


#### 2. **searchStore** (`store/searchStore.ts`)
**State**:
- `results: SearchResults | null`
- `isLoading: boolean`
- `error: string | null`

**Actions**:
- `search(query, page, pageSize, filters): Promise<void>`
- `clearResults(): void`

#### 3. **toastStore** (`store/toastStore.ts`)
**State**:
- `toasts: Toast[]`

**Actions**:
- `addToast(toast): void`
- `removeToast(id): void`
- `clearToasts(): void`

**Helper Functions**:
- `toast.success(message, duration?)`
- `toast.error(message, duration?)`
- `toast.warning(message, duration?)`
- `toast.info(message, duration?)`

#### 4. **themeStore** (`store/themeStore.ts`)
**State**:
- `theme: 'light' | 'dark'`

**Actions**:
- `toggleTheme(): void`
- `setTheme(theme): void`

**Features**:
- System preference detection
- Persistent storage
- CSS variable updates

### Custom Hooks

#### 1. **useKeyboardShortcuts** (`hooks/useKeyboardShortcuts.ts`)
**Purpose**: Global keyboard shortcuts

**Features**:
- Configurable shortcuts
- Modifier key support (Ctrl, Shift, Alt)
- Input field detection
- Event cleanup


#### 2. **useScreenReaderAnnouncement** (`components/ScreenReaderAnnouncement.tsx`)
**Purpose**: Announce dynamic content to screen readers

**Features**:
- Polite/assertive announcements
- Automatic cleanup
- ARIA live regions

#### 3. **useNetworkStatus** (`hooks/useNetworkStatus.ts`)
**Purpose**: Monitor network connectivity

**Features**:
- Online/offline detection
- Event listeners
- State updates

#### 4. **useKeyboardNavigation** (`hooks/useKeyboardNavigation.ts`)
**Purpose**: Keyboard navigation for lists

**Features**:
- Arrow key navigation
- Enter key selection
- Escape key handling

### Design System

#### Design Tokens (`styles/tokens.css`)
**Colors**:
- Primary: Indigo (#6366f1)
- Secondary: Purple (#a855f7)
- Accent: Pink (#ec4899)
- Background: Dark (#0f172a, #1e293b, #334155)
- Text: Light (#f1f5f9, #cbd5e1, #94a3b8)

**Spacing Scale**:
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)
- 20: 5rem (80px)


**Typography Scale**:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)
- 5xl: 3rem (48px)

**Border Radius**:
- sm: 0.25rem
- md: 0.5rem
- lg: 0.75rem
- xl: 1rem
- 2xl: 1.5rem
- full: 9999px

**Shadows**:
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.1)
- xl: 0 20px 25px rgba(0,0,0,0.1)
- 2xl: 0 25px 50px rgba(0,0,0,0.25)

**Animations**:
- fast: 150ms
- normal: 300ms
- slow: 500ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

**Glassmorphism**:
- Background: rgba(255, 255, 255, 0.05)
- Backdrop blur: 12px
- Border: rgba(255, 255, 255, 0.1)

#### Button System (`styles/utilities.css`)
**Variants**:
- Primary: Gradient with glow
- Secondary: Subtle background
- Outline: Border only
- Ghost: Transparent
- Danger: Red gradient
- Success: Green gradient

**Sizes**:
- xs: Small padding, 12px font
- sm: Medium-small, 14px font
- md: Default, 16px font
- lg: Large, 18px font
- xl: Extra large, 20px font

**Features**:
- Hover lift effect
- Ripple animation
- Loading states
- Disabled states
- Icon support
- Mobile optimized (44px touch targets)


---

## Database Schema

### Tables

#### 1. **users**
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
username VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```
**Indexes**: email, username

#### 2. **documents**
```sql
id VARCHAR(255) PRIMARY KEY
type VARCHAR(50) CHECK (type IN ('post', 'comment'))
title TEXT NOT NULL
content TEXT NOT NULL
url TEXT NOT NULL
author VARCHAR(255) NOT NULL
subreddit VARCHAR(255) NOT NULL
reddit_score INTEGER DEFAULT 0
comment_count INTEGER DEFAULT 0
created_utc TIMESTAMP NOT NULL
collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
processed BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```
**Indexes**: subreddit, author, created_utc, reddit_score, type, processed, full-text search

#### 3. **analytics_queries**
```sql
id UUID PRIMARY KEY
query TEXT NOT NULL
result_count INTEGER NOT NULL
latency_ms INTEGER NOT NULL
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
user_id VARCHAR(255)
session_id VARCHAR(255)
```
**Indexes**: query, timestamp, user_id

#### 4. **analytics_clicks**
```sql
id UUID PRIMARY KEY
query TEXT NOT NULL
doc_id VARCHAR(255) FOREIGN KEY REFERENCES documents(id)
position INTEGER NOT NULL
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
user_id VARCHAR(255)
session_id VARCHAR(255)
```
**Indexes**: query, doc_id, timestamp, user_id


#### 5. **collection_metadata**
```sql
id UUID PRIMARY KEY
subreddit VARCHAR(255) NOT NULL
documents_collected INTEGER DEFAULT 0
errors TEXT[]
start_time TIMESTAMP NOT NULL
end_time TIMESTAMP NOT NULL
created_at TIMESTAMP
```
**Indexes**: subreddit, start_time

### Views

#### 1. **popular_queries**
```sql
SELECT query, COUNT(*) as query_count, 
       AVG(latency_ms) as avg_latency_ms,
       AVG(result_count) as avg_result_count,
       MAX(timestamp) as last_queried
FROM analytics_queries
GROUP BY query
ORDER BY query_count DESC
```

#### 2. **document_stats**
```sql
SELECT COUNT(*) as total_documents,
       COUNT(*) FILTER (WHERE type = 'post') as post_count,
       COUNT(*) FILTER (WHERE type = 'comment') as comment_count,
       COUNT(DISTINCT subreddit) as unique_subreddits,
       COUNT(DISTINCT author) as unique_authors,
       AVG(reddit_score) as avg_reddit_score,
       AVG(comment_count) as avg_comment_count,
       MIN(created_utc) as oldest_document,
       MAX(created_utc) as newest_document
FROM documents
```

#### 3. **query_ctr**
```sql
SELECT q.query,
       COUNT(DISTINCT q.id) as total_queries,
       COUNT(DISTINCT c.id) as total_clicks,
       ROUND((COUNT(DISTINCT c.id)::NUMERIC / 
              COUNT(DISTINCT q.id)::NUMERIC) * 100, 2) as ctr_percentage
FROM analytics_queries q
LEFT JOIN analytics_clicks c ON q.query = c.query
GROUP BY q.query
HAVING COUNT(DISTINCT q.id) >= 5
ORDER BY ctr_percentage DESC
```


---

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
**Header**: `Authorization: Bearer <token>`

### Endpoints

#### 1. **POST /auth/register**
Register a new user

**Request**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  },
  "token": "jwt-token"
}
```

**Errors**:
- 400: Invalid input
- 409: User already exists

#### 2. **POST /auth/login**
Login user

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  },
  "token": "jwt-token"
}
```

**Errors**:
- 400: Invalid input
- 401: Invalid credentials


#### 3. **GET /auth/me**
Get current user (requires auth)

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Errors**:
- 401: Unauthorized

#### 4. **PATCH /auth/profile**
Update user profile (requires auth)

**Request**:
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "newemail@example.com",
    "username": "newusername"
  }
}
```

#### 5. **POST /search**
Search documents

**Request**:
```json
{
  "query": "javascript",
  "page": 1,
  "pageSize": 10,
  "filters": {
    "subreddit": "programming",
    "sortBy": "relevance",
    "dateFrom": "2024-01-01T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z"
  }
}
```

**Response** (200):
```json
{
  "results": [
    {
      "id": "doc1",
      "title": "JavaScript Tutorial",
      "content": "Learn JavaScript...",
      "snippet": "...highlighted snippet...",
      "url": "https://reddit.com/...",
      "author": "user123",
      "subreddit": "programming",
      "score": 150,
      "commentCount": 45,
      "createdAt": "2024-12-01T10:00:00Z",
      "type": "post",
      "relevanceScore": 0.85
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10,
  "processingTime": 45
}
```

**Errors**:
- 400: Invalid query
- 429: Rate limit exceeded


#### 6. **GET /autocomplete**
Get search suggestions

**Query Parameters**:
- `prefix`: Search prefix (required)
- `limit`: Max suggestions (default: 10, max: 50)

**Response** (200):
```json
{
  "suggestions": [
    "javascript tutorial",
    "javascript frameworks",
    "javascript best practices"
  ]
}
```

#### 7. **POST /click**
Log click event

**Request**:
```json
{
  "query": "javascript",
  "docId": "doc1",
  "position": 0
}
```

**Response** (200):
```json
{
  "success": true
}
```

#### 8. **GET /stats**
Get analytics statistics

**Response** (200):
```json
{
  "totalDocuments": 1000,
  "totalQueries": 5000,
  "totalClicks": 1500,
  "overallCTR": 0.30,
  "uniqueQueries": 500,
  "responseTimeStats": {
    "min": 10,
    "max": 500,
    "avg": 45,
    "p95": 120,
    "p99": 250
  },
  "popularQueries": [
    { "query": "javascript", "count": 150 },
    { "query": "python", "count": 120 }
  ],
  "documentsByType": {
    "posts": 800,
    "comments": 200
  },
  "subreddits": ["programming", "webdev", "javascript"]
}
```


#### 9. **GET /health**
Health check endpoint

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-12-27T10:00:00Z",
  "components": {
    "documentStore": {
      "status": "healthy",
      "totalDocuments": 1000
    },
    "index": {
      "status": "healthy",
      "totalDocuments": 1000,
      "totalTerms": 5000
    },
    "cache": {
      "status": "healthy"
    }
  }
}
```

**Response** (503) - Unhealthy:
```json
{
  "status": "unhealthy",
  "timestamp": "2024-12-27T10:00:00Z",
  "components": {
    "documentStore": {
      "status": "unhealthy",
      "totalDocuments": 0
    }
  }
}
```

#### 10. **GET /history**
Get search history (requires auth)

**Query Parameters**:
- `limit`: Max entries (default: 50, max: 100)

**Response** (200):
```json
{
  "history": [
    {
      "id": "entry1",
      "query": "javascript",
      "timestamp": "2024-12-27T10:00:00Z",
      "resultCount": 100
    }
  ]
}
```

#### 11. **DELETE /history/:entryId**
Delete history entry (requires auth)

**Response** (200):
```json
{
  "success": true
}
```

**Errors**:
- 404: Entry not found


#### 12. **DELETE /history**
Clear all history (requires auth)

**Response** (200):
```json
{
  "success": true,
  "deletedCount": 50
}
```

#### 13. **GET /metrics**
Prometheus metrics endpoint

**Response** (200):
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/search"} 1000

# HELP search_latency_seconds Search latency
# TYPE search_latency_seconds histogram
search_latency_seconds_bucket{le="0.1"} 500
search_latency_seconds_bucket{le="0.5"} 900
search_latency_seconds_bucket{le="1"} 990
search_latency_seconds_sum 450
search_latency_seconds_count 1000
```

#### 14. **POST /seed**
Seed test data (development only)

**Response** (200):
```json
{
  "success": true,
  "message": "Seeded 3 documents",
  "count": 3
}
```

---

## Features Implemented

### Backend Features ✅
1. **Search Engine Core**
   - Text processing and normalization
   - Inverted index
   - BM25 ranking algorithm
   - TF-IDF scoring
   - Hybrid ranking
   - Query caching
   - Pagination
   - Snippet generation

2. **Reddit Integration**
   - Public API collection
   - Scheduled collection (6 hours)
   - Circuit breaker pattern
   - Rate limiting
   - Duplicate detection
   - Error handling


3. **Authentication & Authorization**
   - User registration
   - User login
   - JWT tokens
   - Password hashing (bcrypt)
   - Token verification
   - Protected routes

4. **Analytics**
   - Query tracking
   - Click tracking
   - CTR calculation
   - Response time metrics
   - Popular queries
   - User behavior tracking

5. **Search Features**
   - Autocomplete
   - Search history
   - Filters (subreddit, date, sort)
   - Multi-field search
   - Relevance scoring

6. **Performance**
   - Query caching (LRU)
   - Rate limiting
   - Batch operations
   - Efficient indexing
   - Memory management

7. **Monitoring**
   - Structured logging
   - Prometheus metrics
   - Health checks
   - Error tracking
   - Correlation IDs

### Frontend Features ✅
1. **User Interface**
   - Modern glassmorphism design
   - Dark/light theme
   - Responsive layout
   - Mobile-optimized
   - Smooth animations
   - Loading states
   - Empty states

2. **Search Experience**
   - Real-time autocomplete
   - Recent searches
   - Voice search
   - Search filters
   - Result highlighting
   - Expandable snippets
   - Pagination


3. **User Features**
   - User registration/login
   - Profile management
   - Search history
   - History management
   - Avatar placeholder

4. **UX Enhancements**
   - Toast notifications
   - Confirmation dialogs
   - Keyboard shortcuts
   - Screen reader support
   - Error boundaries
   - Offline detection

5. **Accessibility**
   - WCAG 2.1 AA compliant
   - Keyboard navigation
   - ARIA labels
   - Focus indicators
   - Skip links
   - Screen reader announcements
   - High contrast support
   - Reduced motion support

6. **Performance**
   - Code splitting
   - Lazy loading
   - Optimized bundle (60.72 KB gzipped)
   - Debounced API calls
   - Efficient re-renders

7. **Design System**
   - Design tokens
   - Button system (6 variants, 5 sizes)
   - Typography scale
   - Color system
   - Spacing scale
   - Component library

---

## Missing Features & Improvements

### Backend - High Priority 🔴

1. **PostgreSQL Integration**
   - Implement PostgreSQL document store
   - Implement PostgreSQL auth service
   - Implement PostgreSQL analytics
   - Database migrations
   - Connection pooling
   - Transaction support


2. **Semantic Search**
   - Embedding generation (sentence-transformers)
   - Vector database (pgvector or Pinecone)
   - Semantic similarity scoring
   - Hybrid search (keyword + semantic)
   - Query expansion

3. **CTR-Based Ranking**
   - Click-through rate tracking
   - Position-based CTR
   - Query-document CTR
   - Ranking adjustment based on CTR
   - A/B testing framework

4. **Advanced Search**
   - Boolean operators (AND, OR, NOT)
   - Phrase search ("exact match")
   - Wildcard search (java*)
   - Fuzzy search (typo tolerance)
   - Field-specific search (title:javascript)
   - Date range operators

5. **Caching & Performance**
   - Redis integration
   - Distributed caching
   - Cache warming
   - Query result caching
   - CDN integration

6. **API Improvements**
   - GraphQL API
   - API versioning
   - API documentation (Swagger/OpenAPI)
   - Webhook support
   - Batch API endpoints

7. **Security**
   - HTTPS enforcement
   - CSP headers
   - CORS configuration
   - SQL injection prevention
   - XSS prevention
   - Rate limiting per user
   - API key authentication
   - OAuth integration


8. **Data Collection**
   - Reddit OAuth authentication
   - More subreddits
   - Comment collection
   - Historical data backfill
   - Real-time updates
   - Incremental updates

9. **Testing**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests
   - Load testing
   - Performance testing
   - Security testing

### Backend - Medium Priority 🟡

1. **Machine Learning**
   - Query intent classification
   - Result personalization
   - Spam detection
   - Content categorization
   - Sentiment analysis

2. **Advanced Analytics**
   - User segmentation
   - Cohort analysis
   - Funnel analysis
   - Retention metrics
   - Conversion tracking

3. **Search Quality**
   - Relevance feedback
   - Query suggestions ("Did you mean?")
   - Related searches
   - Search trends
   - Query understanding

4. **Data Management**
   - Data retention policies
   - Data archiving
   - Data export
   - Data backup
   - Data recovery

5. **Monitoring & Observability**
   - Distributed tracing (Jaeger)
   - Error tracking (Sentry)
   - APM (Application Performance Monitoring)
   - Log aggregation (ELK stack)
   - Alerting (PagerDuty)


### Frontend - High Priority 🔴

1. **Advanced Search UI**
   - Advanced search builder
   - Filter chips
   - Saved searches
   - Search alerts
   - Export results

2. **User Features**
   - Profile picture upload
   - User preferences
   - Saved results/bookmarks
   - Collections/folders
   - Sharing functionality

3. **Search Experience**
   - Instant search (search as you type)
   - "Did you mean?" suggestions
   - Related searches
   - Search within results
   - Infinite scroll
   - Virtual scrolling

4. **Performance**
   - Service worker
   - Offline support
   - PWA features
   - Install prompt
   - Push notifications
   - Background sync

5. **Testing**
   - Unit tests (Vitest)
   - Component tests
   - E2E tests (Playwright/Cypress)
   - Visual regression tests
   - Accessibility tests

6. **Analytics**
   - User analytics dashboard
   - Search trend visualization
   - Heatmaps
   - Session replay
   - A/B testing

### Frontend - Medium Priority 🟡

1. **Social Features**
   - Result sharing
   - Comments on results
   - Upvote/downvote
   - User following
   - Collaborative lists


2. **Mobile App**
   - React Native app
   - iOS app
   - Android app
   - Mobile-specific features
   - Push notifications

3. **Internationalization**
   - Multi-language support
   - RTL support
   - Locale-specific formatting
   - Translation management

4. **Customization**
   - Custom themes
   - Layout preferences
   - Font size adjustment
   - Density options

---

## DevOps & Infrastructure

### Current Setup ✅
1. **Version Control**
   - Git repository
   - .gitignore configured
   - Commit history

2. **Build System**
   - TypeScript compilation
   - Vite bundler
   - Development server
   - Production builds

3. **Configuration**
   - Environment variables
   - Config validation (Zod)
   - Multiple environments

4. **CI/CD**
   - GitHub Actions workflow
   - Automated linting
   - Automated testing
   - Docker build
   - Security scanning

### Missing - High Priority 🔴

1. **Containerization**
   - Docker Compose setup
   - PostgreSQL container
   - Redis container
   - Network configuration
   - Volume management

2. **Deployment**
   - Production deployment
   - Staging environment
   - Blue-green deployment
   - Rollback strategy
   - Health checks


3. **Infrastructure as Code**
   - Terraform scripts
   - AWS CloudFormation
   - Kubernetes manifests
   - Helm charts

4. **Monitoring**
   - Grafana dashboards
   - Prometheus setup
   - Alert rules
   - Log aggregation
   - Error tracking

5. **Security**
   - SSL/TLS certificates
   - Secrets management
   - Vulnerability scanning
   - Penetration testing
   - Security audits

6. **Backup & Recovery**
   - Database backups
   - Automated backups
   - Backup testing
   - Disaster recovery plan
   - Point-in-time recovery

### Missing - Medium Priority 🟡

1. **Scaling**
   - Load balancing
   - Auto-scaling
   - Database replication
   - Read replicas
   - Caching layer

2. **Performance**
   - CDN setup
   - Image optimization
   - Asset compression
   - HTTP/2 support
   - Caching headers

3. **Documentation**
   - API documentation
   - Architecture diagrams
   - Runbooks
   - Troubleshooting guides
   - Deployment guides

4. **Development**
   - Local development setup
   - Development containers
   - Mock services
   - Test data generators
   - Development tools

---

## Configuration

### Environment Variables

The application uses environment variables for configuration. See `.env` file for all available options.

#### Application Settings
```bash
NODE_ENV=development          # Environment: development, production, test
PORT=3000                     # Backend server port
LOG_LEVEL=info               # Logging level: debug, info, warn, error
```

#### Database Configuration
```bash
POSTGRES_HOST=localhost       # PostgreSQL host
POSTGRES_PORT=5432           # PostgreSQL port
POSTGRES_DB=feedvex          # Database name
POSTGRES_USER=postgres       # Database user
POSTGRES_PASSWORD=postgres   # Database password
```

**Note**: Currently using in-memory storage. PostgreSQL is optional and ready for production.

#### Redis Configuration (Optional)
```bash
REDIS_HOST=localhost         # Redis host
REDIS_PORT=6379             # Redis port
REDIS_PASSWORD=             # Redis password (empty for no auth)
```

**Note**: Currently using in-memory cache. Redis is optional for production scaling.

#### Reddit API Configuration
```bash
REDDIT_USER_AGENT=FeedVex/1.0.0 (Reddit Search Engine)
REDDIT_SUBREDDITS=programming,technology,science,webdev,javascript,python,machinelearning
REDDIT_MAX_POSTS_PER_SUBREDDIT=50
REDDIT_COLLECTION_INTERVAL_HOURS=6
```

**Note**: Using Reddit's public JSON API (no authentication required).

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=60000      # Rate limit window (1 minute)
RATE_LIMIT_MAX_REQUESTS=100     # Max requests per window
```

#### Cache Configuration
```bash
CACHE_TTL_SECONDS=300           # Cache TTL (5 minutes)
CACHE_MAX_SIZE=1000            # Max cache entries
```

#### Ranking Algorithm
```bash
RANKING_ALGORITHM=bm25          # Algorithm: bm25, tfidf, hybrid
BM25_K1=1.2                    # BM25 term frequency saturation
BM25_B=0.75                    # BM25 length normalization
TEXT_WEIGHT=0.4                # Text relevance weight
RECENCY_WEIGHT=0.2             # Recency weight
POPULARITY_WEIGHT=0.3          # Reddit score weight
ENGAGEMENT_WEIGHT=0.1          # Comment count weight
RECENCY_DECAY_DAYS=7           # Days for recency decay
```

#### Search Configuration
```bash
DEFAULT_PAGE_SIZE=10            # Default results per page
MAX_PAGE_SIZE=100              # Maximum results per page
SNIPPET_CONTEXT_LENGTH=50      # Words of context in snippets
```

#### Security
```bash
JWT_SECRET=dev-secret-change-in-production-12345678
SESSION_SECRET=dev-session-secret-change-in-production-12345678
```

**⚠️ IMPORTANT**: Change these secrets in production!

#### CORS Configuration
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend Configuration
```bash
VITE_API_URL=http://localhost:3000/api/v1
```

### Configuration Files

#### TypeScript Configuration (`tsconfig.json`)
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Path aliases configured

#### ESLint Configuration (`.eslintrc.json`)
- TypeScript support
- React hooks rules
- Accessibility rules
- Import sorting

#### Prettier Configuration (`.prettierrc.json`)
- Single quotes
- 2 space indentation
- Trailing commas
- Semicolons

#### Vite Configuration (`vite.config.ts`)
- React plugin
- Port: 5173
- Proxy to backend API
- Build optimizations

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (optional, for production)
- Redis 6+ (optional, for production)
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd feedvex
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database (optional)**
```bash
# If using PostgreSQL
psql -U postgres -f backend/scripts/init-db.sql
```

5. **Build backend**
```bash
cd backend
npm run build
```

6. **Start backend**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

Backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with backend API URL
```

4. **Start development server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

### Docker Setup (Optional)

1. **Build and start all services**
```bash
docker-compose up -d
```

2. **View logs**
```bash
docker-compose logs -f
```

3. **Stop services**
```bash
docker-compose down
```

### Initial Data Collection

The backend automatically collects Reddit data on startup and every 6 hours. To manually trigger collection:

```bash
# Using the API
curl -X POST http://localhost:3000/api/v1/collect
```

Or wait for automatic collection to run.

---

## Troubleshooting

### Common Issues

#### Backend won't start
**Problem**: Port 3000 already in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: 
- Change PORT in `.env` file
- Or kill the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### Frontend can't connect to backend
**Problem**: CORS errors or network errors
```
Access to fetch at 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**:
- Ensure backend is running
- Check `VITE_API_URL` in frontend `.env`
- Check `CORS_ORIGINS` in backend `.env`
- Restart both servers

#### No search results
**Problem**: Search returns empty results
**Solution**:
- Wait for initial Reddit data collection (check logs)
- Manually trigger collection: `POST /api/v1/collect`
- Check backend logs for collection errors
- Verify `REDDIT_SUBREDDITS` is configured

#### Database connection errors
**Problem**: PostgreSQL connection fails
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**:
- Application works without PostgreSQL (uses in-memory storage)
- If you want PostgreSQL:
  - Ensure PostgreSQL is running
  - Check database credentials in `.env`
  - Create database: `createdb feedvex`
  - Run init script: `psql -U postgres -f backend/scripts/init-db.sql`

#### Build errors
**Problem**: TypeScript compilation errors
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf backend/dist
npm run build
```

#### Voice search not working
**Problem**: Speech recognition errors
**Solution**:
- Voice search requires HTTPS in production
- Use Chrome/Edge (best support)
- Grant microphone permissions
- Check browser console for errors

### Performance Issues

#### Slow search results
**Possible causes**:
- Large dataset (>10,000 documents)
- Complex queries
- No caching

**Solutions**:
- Enable Redis caching
- Reduce `REDDIT_MAX_POSTS_PER_SUBREDDIT`
- Optimize ranking weights
- Use PostgreSQL with proper indexes

#### High memory usage
**Possible causes**:
- In-memory storage with large dataset
- Cache size too large

**Solutions**:
- Switch to PostgreSQL
- Reduce `CACHE_MAX_SIZE`
- Reduce `REDDIT_MAX_POSTS_PER_SUBREDDIT`
- Restart application periodically

### Development Issues

#### Hot reload not working
**Solution**:
```bash
# Frontend
cd frontend
rm -rf node_modules/.vite
npm run dev

# Backend
cd backend
rm -rf dist
npm run dev
```

#### ESLint errors
**Solution**:
```bash
# Auto-fix
npm run lint:fix

# Check only
npm run lint
```

#### Type errors
**Solution**:
```bash
# Check types
npm run type-check

# Rebuild
npm run build
```

---

## Deployment

### Production Checklist

#### Security
- [ ] Change `JWT_SECRET` and `SESSION_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Review and restrict API access
- [ ] Set up firewall rules
- [ ] Enable security headers

#### Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis for caching
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure backup strategy

#### Performance
- [ ] Enable compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database indexes
- [ ] Enable connection pooling
- [ ] Set up load balancing (if needed)

#### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure Prometheus metrics
- [ ] Set up Grafana dashboards
- [ ] Configure alerts
- [ ] Set up log aggregation
- [ ] Enable health checks

### Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, Linode, etc.)

1. **Provision server**
   - Ubuntu 22.04 LTS
   - 2GB+ RAM
   - 2+ CPU cores

2. **Install dependencies**
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Redis
sudo apt-get install -y redis-server

# Nginx
sudo apt-get install -y nginx
```

3. **Deploy application**
```bash
# Clone repository
git clone <repository-url> /var/www/feedvex
cd /var/www/feedvex

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build
npm run build
cd frontend && npm run build && cd ..

# Set up systemd service
sudo cp deployment/feedvex.service /etc/systemd/system/
sudo systemctl enable feedvex
sudo systemctl start feedvex
```

4. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name feedvex.com;

    location / {
        root /var/www/feedvex/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option 2: Docker Deployment

1. **Build images**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Start services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Set up reverse proxy** (Nginx or Traefik)

#### Option 3: Cloud Platform (Heroku, Railway, Render)

1. **Connect repository**
2. **Configure environment variables**
3. **Deploy** (automatic from git push)

#### Option 4: Kubernetes

1. **Build and push images**
```bash
docker build -t feedvex-backend:latest ./backend
docker build -t feedvex-frontend:latest ./frontend
docker push feedvex-backend:latest
docker push feedvex-frontend:latest
```

2. **Apply Kubernetes manifests**
```bash
kubectl apply -f k8s/
```

### Post-Deployment

1. **Verify deployment**
```bash
# Check health
curl https://feedvex.com/api/v1/health

# Check frontend
curl https://feedvex.com
```

2. **Monitor logs**
```bash
# Backend logs
tail -f /var/log/feedvex/backend.log

# Or with Docker
docker-compose logs -f backend
```

3. **Set up monitoring**
   - Configure Grafana dashboards
   - Set up alerts
   - Enable error tracking

4. **Test functionality**
   - User registration
   - Search functionality
   - Data collection
   - Analytics

---

## Testing

### Backend Testing

#### Unit Tests
```bash
cd backend
npm test
```

#### Integration Tests
```bash
npm run test:integration
```

#### Coverage
```bash
npm run test:coverage
```

### Frontend Testing

#### Unit Tests
```bash
cd frontend
npm test
```

#### Component Tests
```bash
npm run test:components
```

#### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist

#### Search Functionality
- [ ] Basic search works
- [ ] Autocomplete suggestions appear
- [ ] Recent searches are saved
- [ ] Voice search works (HTTPS only)
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Results are relevant

#### User Features
- [ ] Registration works
- [ ] Login works
- [ ] Profile update works
- [ ] Search history is saved
- [ ] History can be deleted
- [ ] Logout works

#### UI/UX
- [ ] Dark/light theme toggle works
- [ ] Responsive on mobile
- [ ] Keyboard shortcuts work
- [ ] Toast notifications appear
- [ ] Loading states display
- [ ] Empty states display
- [ ] Error states display

#### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast sufficient

---

## Contributing

### Development Workflow

1. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test changes**
```bash
npm run lint
npm run type-check
npm test
```

4. **Commit changes**
```bash
git add .
git commit -m "feat: add your feature"
```

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful comments
- Add JSDoc for public APIs
- Keep functions small and focused
- Use descriptive variable names

---

## License

This project is proprietary and confidential.

---

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check documentation first

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Reddit data collection
- Full-text search with BM25 ranking
- User authentication
- Search analytics
- Modern UI with glassmorphism design
- Dark/light theme
- Keyboard shortcuts
- Accessibility features
- Toast notifications
- Confirmation dialogs

### Upcoming Features
- PostgreSQL integration
- Semantic search
- CTR-based ranking
- Advanced search operators
- Redis caching
- PWA features
- Mobile app

---

**Last Updated**: February 21, 2026  
**Version**: 1.0.0  
**Status**: Production Ready (with in-memory storage)

