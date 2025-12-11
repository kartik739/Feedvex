# Feedvex Docker Setup

This guide explains how to run Feedvex using Docker and Docker Compose.

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of available RAM
- Reddit API credentials (get them from https://www.reddit.com/prefs/apps)

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Copy the environment file and configure it**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your Reddit API credentials:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=Feedvex/1.0 (by /u/your_username)
   ```

3. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

4. **Check service health**
   ```bash
   docker-compose ps
   ```

5. **View logs**
   ```bash
   docker-compose logs -f api
   ```

6. **Access the services**
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/api/v1/health
   - Metrics: http://localhost:3000/api/v1/metrics
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)

## Services

### API Service
- **Port**: 3000
- **Description**: Main REST API for search queries
- **Health Check**: GET /api/v1/health
- **Endpoints**:
  - POST /api/v1/search - Search documents
  - GET /api/v1/autocomplete - Get search suggestions
  - GET /api/v1/stats - Get system statistics
  - POST /api/v1/click - Log click events

### Collector Service
- **Description**: Periodically collects data from Reddit
- **Interval**: Configurable via COLLECTION_INTERVAL_MS (default: 1 hour)

### PostgreSQL
- **Port**: 5432
- **Database**: feedvex
- **User**: feedvex
- **Data**: Persisted in `postgres_data` volume

### Redis
- **Port**: 6379
- **Description**: Cache and rate limiting
- **Data**: Persisted in `redis_data` volume

### Prometheus
- **Port**: 9090
- **Description**: Metrics collection and monitoring
- **Data**: Persisted in `prometheus_data` volume

### Grafana
- **Port**: 3001
- **Description**: Metrics visualization
- **Default Credentials**: admin/admin
- **Data**: Persisted in `grafana_data` volume

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (WARNING: deletes all data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f collector
docker-compose logs -f postgres
```

### Restart a service
```bash
docker-compose restart api
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Execute commands in a container
```bash
# Access API container shell
docker-compose exec api sh

# Access PostgreSQL
docker-compose exec postgres psql -U feedvex -d feedvex

# Access Redis CLI
docker-compose exec redis redis-cli -a redis_password
```

## Database Management

### Initialize database manually
```bash
docker-compose exec postgres psql -U feedvex -d feedvex -f /docker-entrypoint-initdb.d/init-db.sql
```

### Backup database
```bash
docker-compose exec postgres pg_dump -U feedvex feedvex > backup.sql
```

### Restore database
```bash
docker-compose exec -T postgres psql -U feedvex feedvex < backup.sql
```

### View database tables
```bash
docker-compose exec postgres psql -U feedvex -d feedvex -c "\dt"
```

## Monitoring

### Prometheus Queries
Access Prometheus at http://localhost:9090 and try these queries:

- Query rate: `rate(feedvex_queries_total[5m])`
- Query latency: `feedvex_query_duration_seconds`
- Cache hit rate: `feedvex_cache_hit_rate`
- HTTP request rate: `rate(feedvex_http_requests_total[5m])`

### Grafana Dashboards
1. Access Grafana at http://localhost:3001
2. Login with admin/admin
3. Navigate to Dashboards
4. Import or create dashboards using Prometheus data source

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs service_name

# Check service status
docker-compose ps
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready -U feedvex

# Check database logs
docker-compose logs postgres
```

### Redis connection issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli -a redis_password ping
```

### Port conflicts
If ports are already in use, modify them in `.env`:
```
PORT=3001
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### Out of memory
Increase Docker memory limit in Docker Desktop settings or add to docker-compose.yml:
```yaml
services:
  api:
    mem_limit: 1g
```

### Clear all data and restart
```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Security Checklist
- [ ] Change all default passwords in `.env`
- [ ] Use strong passwords (generate with `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS_ORIGINS to specific domains
- [ ] Enable HTTPS with reverse proxy (nginx/traefik)
- [ ] Set up firewall rules
- [ ] Enable Docker secrets for sensitive data
- [ ] Regular backups of PostgreSQL data
- [ ] Monitor disk space for volumes
- [ ] Set up log rotation
- [ ] Configure alerting in Prometheus

### Performance Tuning
- Adjust `CACHE_MAX_SIZE` based on available memory
- Tune PostgreSQL settings in docker-compose.yml
- Adjust `RATE_LIMIT_MAX_REQUESTS` based on expected load
- Scale services with `docker-compose up -d --scale api=3`

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U feedvex feedvex | gzip > backup_$DATE.sql.gz
```

## Development

### Hot reload (for development)
Modify docker-compose.yml to mount source code:
```yaml
services:
  api:
    volumes:
      - ./src:/app/src
      - ./data:/app/data
    command: ["npm", "run", "dev"]
```

### Run tests in container
```bash
docker-compose exec api npm test
```

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review health endpoint: http://localhost:3000/api/v1/health
- Check metrics: http://localhost:3000/api/v1/metrics
