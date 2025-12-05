# Reddit Search Engine

A production-quality search engine that collects, processes, indexes, and searches Reddit content using advanced ranking algorithms (TF-IDF and BM25).

## Features

- **Data Collection**: Concurrent Reddit API fetching with retry logic and duplicate detection
- **Text Processing**: HTML stripping, tokenization, stopword removal, and stemming
- **Inverted Index**: Fast document retrieval with term frequencies and positions
- **Advanced Ranking**: BM25 algorithm with multi-factor scoring (relevance, recency, popularity, engagement)
- **Query Processing**: Fast search with caching, pagination, and snippet generation
- **Rate Limiting**: Sliding window algorithm to prevent abuse
- **Autocomplete**: Trie-based prefix matching for query suggestions
- **Analytics**: Search usage tracking and click-through rate analysis
- **Production Ready**: Docker containerization, CI/CD, monitoring, and logging

## Project Structure

```
src/
├── models/       # Data models and types
├── services/     # Business logic components
├── utils/        # Utility functions
├── api/          # REST API endpoints
├── config/       # Configuration management
└── index.ts      # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Reddit API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Reddit API credentials and other settings

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Configuration

See `.env.example` for all available configuration options.

Key settings:
- **REDDIT_CLIENT_ID**: Your Reddit API client ID
- **REDDIT_CLIENT_SECRET**: Your Reddit API client secret
- **SUBREDDITS**: Comma-separated list of subreddits to index
- **RANKING_ALGORITHM**: Choose between 'tfidf' or 'bm25'
- **BM25_K1**: Term saturation parameter (default: 1.5)
- **BM25_B**: Length normalization parameter (default: 0.75)

## Testing

The project uses a dual testing approach:
- **Unit tests**: Specific examples and edge cases
- **Property-based tests**: Universal properties validated with fast-check

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## License

MIT
