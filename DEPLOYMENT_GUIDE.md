# FeedVex Deployment Guide 🚀

Complete guide for deploying your Reddit search engine to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Environment variables configured
- [ ] Database setup (if using PostgreSQL)
- [ ] Redis setup (if using Redis)
- [ ] Domain name registered (optional)
- [ ] SSL certificate ready (optional)

---

## 🐳 Option 1: Docker Compose (Easiest)

### Prerequisites
- Docker installed
- Docker Compose installed

### Steps

1. **Clone repository**
   ```bash
   git clone <your-repo-url>
   cd feedvex
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Build and start**
   ```bash
   docker-compose up -d
   ```

4. **Access application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Grafana: http://localhost:3001

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Stop services**
   ```bash
   docker-compose down
   ```

---

## ☁️ Option 2: DigitalOcean App Platform (Recommended)

### Why DigitalOcean?
- Easy setup
- Affordable ($5-12/month)
- Automatic SSL
- Built-in monitoring
- GitHub integration

### Steps

1. **Create DigitalOcean account**
   - Go to https://www.digitalocean.com
   - Sign up and add payment method

2. **Create new app**
   - Click "Create" → "Apps"
   - Connect GitHub repository
   - Select your repository

3. **Configure backend**
   - **Name:** feedvex-backend
   - **Type:** Web Service
   - **Build Command:** `npm run build:backend`
   - **Run Command:** `npm start`
   - **HTTP Port:** 3000
   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3000
     REDDIT_USER_AGENT=FeedVex/1.0.0
     REDDIT_SUBREDDITS=programming,technology,science
     REDDIT_MAX_POSTS_PER_SUBREDDIT=100
     REDDIT_COLLECTION_INTERVAL_HOURS=6
     JWT_SECRET=<generate-secure-secret>
     ```

4. **Configure frontend**
   - **Name:** feedvex-frontend
   - **Type:** Static Site
   - **Build Command:** `npm run build:frontend`
   - **Output Directory:** `frontend/dist`
   - **Environment Variables:**
     ```
     VITE_API_URL=https://feedvex-backend.ondigitalocean.app/api/v1
     ```

5. **Deploy**
   - Click "Create Resources"
   - Wait for deployment (~5 minutes)
   - Access your app at the provided URL

6. **Custom domain (optional)**
   - Go to Settings → Domains
   - Add your domain
   - Update DNS records

---

## 🌐 Option 3: AWS (Advanced)

### Prerequisites
- AWS account
- AWS CLI installed
- Docker installed

### Architecture
- **ECS Fargate** - Container orchestration
- **ECR** - Docker image registry
- **RDS** - PostgreSQL database (optional)
- **ElastiCache** - Redis cache (optional)
- **CloudFront** - CDN for frontend
- **Route 53** - DNS management

### Steps

1. **Install AWS CLI**
   ```bash
   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

   # Mac
   brew install awscli

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   # Enter Access Key ID
   # Enter Secret Access Key
   # Enter region (e.g., us-east-1)
   ```

3. **Create ECR repositories**
   ```bash
   aws ecr create-repository --repository-name feedvex-backend
   aws ecr create-repository --repository-name feedvex-frontend
   ```

4. **Build and push Docker images**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and push backend
   docker build -t feedvex-backend .
   docker tag feedvex-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/feedvex-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/feedvex-backend:latest

   # Build and push frontend
   docker build -t feedvex-frontend ./frontend
   docker tag feedvex-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/feedvex-frontend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/feedvex-frontend:latest
   ```

5. **Create ECS cluster**
   ```bash
   aws ecs create-cluster --cluster-name feedvex-cluster
   ```

6. **Create task definition**
   - Use AWS Console or CLI
   - Define container configurations
   - Set environment variables
   - Configure networking

7. **Create ECS service**
   ```bash
   aws ecs create-service \
     --cluster feedvex-cluster \
     --service-name feedvex-service \
     --task-definition feedvex-task \
     --desired-count 1 \
     --launch-type FARGATE
   ```

8. **Configure load balancer**
   - Create Application Load Balancer
   - Configure target groups
   - Set up health checks

9. **Set up CI/CD**
   - Use `.github/workflows/deploy-aws.yml.example`
   - Add GitHub secrets
   - Push to trigger deployment

---

## 🔥 Option 4: Heroku (Simplest)

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps

1. **Install Heroku CLI**
   ```bash
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli

   # Mac
   brew tap heroku/brew && brew install heroku

   # Linux
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku apps**
   ```bash
   # Backend
   heroku create feedvex-backend

   # Frontend
   heroku create feedvex-frontend
   ```

4. **Add buildpacks**
   ```bash
   # Backend
   heroku buildpacks:set heroku/nodejs -a feedvex-backend

   # Frontend
   heroku buildpacks:set heroku/nodejs -a feedvex-frontend
   heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static -a feedvex-frontend
   ```

5. **Set environment variables**
   ```bash
   # Backend
   heroku config:set NODE_ENV=production -a feedvex-backend
   heroku config:set REDDIT_USER_AGENT="FeedVex/1.0.0" -a feedvex-backend
   heroku config:set REDDIT_SUBREDDITS="programming,technology" -a feedvex-backend
   heroku config:set JWT_SECRET="<your-secret>" -a feedvex-backend

   # Frontend
   heroku config:set VITE_API_URL="https://feedvex-backend.herokuapp.com/api/v1" -a feedvex-frontend
   ```

6. **Deploy**
   ```bash
   # Backend
   git subtree push --prefix backend heroku main

   # Frontend
   git subtree push --prefix frontend heroku main
   ```

7. **Open app**
   ```bash
   heroku open -a feedvex-frontend
   ```

---

## 🚀 Option 5: Vercel + Railway (Modern)

### Frontend on Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy frontend**
   ```bash
   cd frontend
   vercel
   # Follow prompts
   ```

3. **Set environment variables**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add `VITE_API_URL`

### Backend on Railway

1. **Create Railway account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure service**
   - **Root Directory:** `/backend`
   - **Build Command:** `npm run build:backend`
   - **Start Command:** `npm start`

4. **Add environment variables**
   - Go to Variables tab
   - Add all required env vars

5. **Deploy**
   - Railway auto-deploys on push
   - Get your backend URL

6. **Update frontend**
   - Update `VITE_API_URL` in Vercel
   - Redeploy frontend

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change default JWT secret
- [ ] Use strong passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up CORS properly
- [ ] Configure rate limiting
- [ ] Enable security headers (helmet)
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Review environment variables
- [ ] Test authentication flow
- [ ] Scan for vulnerabilities

---

## 📊 Monitoring Setup

### Application Monitoring

1. **Prometheus + Grafana** (included in docker-compose)
   - Metrics: http://localhost:9090
   - Dashboards: http://localhost:3001

2. **Health Checks**
   - Backend: `/api/v1/health`
   - Stats: `/api/v1/stats`

3. **Logs**
   ```bash
   # Docker
   docker-compose logs -f

   # PM2
   pm2 logs

   # Heroku
   heroku logs --tail -a feedvex-backend
   ```

### External Monitoring (Optional)

1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **Datadog** - APM and monitoring
   ```bash
   npm install dd-trace
   ```

3. **New Relic** - Performance monitoring
   ```bash
   npm install newrelic
   ```

---

## 🔄 CI/CD Setup

### GitHub Actions (Included)

1. **Add secrets to GitHub**
   - Go to repository → Settings → Secrets
   - Add required secrets:
     - `DOCKER_USERNAME`
     - `DOCKER_PASSWORD`
     - `AWS_ACCESS_KEY_ID` (if using AWS)
     - `AWS_SECRET_ACCESS_KEY` (if using AWS)

2. **Push to trigger**
   ```bash
   git push origin main
   ```

3. **Monitor workflow**
   - Go to Actions tab
   - View workflow runs

### Automatic Deployment

- **Main branch** → Production
- **Develop branch** → Staging
- **Pull requests** → Preview deployments

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install --legacy-peer-deps

# Rebuild
npm run build:backend
npm run build:frontend
```

### Port Conflicts

```bash
# Check what's using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Memory Issues

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Docker Issues

```bash
# Clean Docker
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

---

## 📈 Performance Optimization

### Backend

1. **Enable caching**
   - Redis for query cache
   - In-memory cache for hot data

2. **Database optimization**
   - Add indexes
   - Use connection pooling
   - Enable query caching

3. **Load balancing**
   - Multiple backend instances
   - Nginx reverse proxy

### Frontend

1. **Code splitting**
   - Already implemented with lazy loading

2. **CDN**
   - CloudFront (AWS)
   - Cloudflare
   - Vercel Edge Network

3. **Compression**
   - Gzip/Brotli compression
   - Image optimization

---

## 💰 Cost Estimates

### DigitalOcean
- **Basic:** $12/month (1 GB RAM)
- **Professional:** $24/month (2 GB RAM)
- **Business:** $48/month (4 GB RAM)

### AWS
- **Minimal:** $20-30/month
- **Production:** $50-100/month
- **Enterprise:** $200+/month

### Heroku
- **Hobby:** $7/month per dyno
- **Standard:** $25/month per dyno
- **Performance:** $250/month per dyno

### Vercel + Railway
- **Vercel:** Free (hobby) or $20/month (pro)
- **Railway:** $5/month + usage

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test all features**
   - Search functionality
   - User authentication
   - Data collection
   - Analytics

2. **Monitor performance**
   - Response times
   - Error rates
   - Resource usage

3. **Set up alerts**
   - Downtime alerts
   - Error rate alerts
   - Performance alerts

4. **Document**
   - Update README with production URL
   - Document deployment process
   - Create runbook for common issues

5. **Celebrate! 🎊**
   - You've deployed a production search engine!

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)

---

**Good luck with your deployment! 🚀**
