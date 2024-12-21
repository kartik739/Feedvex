# Feedvex Frontend Deployment Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Git repository
- Hosting platform account (Vercel, Netlify, or AWS)

---

## Build Configuration

### Environment Variables

Create environment files for different environments:

**Development (`.env.development`):**
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Feedvex Dev
```

**Production (`.env.production`):**
```env
VITE_API_URL=https://api.feedvex.com
VITE_APP_NAME=Feedvex
VITE_APP_VERSION=1.0.0
```

### Build Command

```bash
npm run build
```

This will:
1. Run TypeScript compiler
2. Bundle with Vite
3. Minify code
4. Remove console.log statements
5. Generate optimized chunks
6. Output to `dist/` directory

### Build Optimization

The build is configured in `vite.config.ts`:
- **Code splitting**: Vendor and page chunks
- **Minification**: Terser with console removal
- **Chunk size limit**: 1000kb warning
- **Tree shaking**: Automatic dead code elimination

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Automatic Deployment:**

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add environment variables in Vercel dashboard
5. Deploy

**Manual Deployment:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

**Configuration:**
- Uses `vercel.json` for routing and headers
- Automatic HTTPS
- Global CDN
- Automatic preview deployments

---

### Option 2: Netlify

**Automatic Deployment:**

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Netlify dashboard
3. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: 20
4. Add environment variables in Netlify dashboard
5. Deploy

**Manual Deployment:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

**Configuration:**
- Uses `netlify.toml` for build and headers
- Automatic HTTPS
- Global CDN
- Branch deployments

---

### Option 3: AWS S3 + CloudFront

**Setup:**

1. Create S3 bucket
2. Enable static website hosting
3. Create CloudFront distribution
4. Configure Route 53 (optional)

**Deployment Script:**

```bash
#!/bin/bash

# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

**Configuration:**
- Set up IAM user with S3 and CloudFront permissions
- Configure CORS in S3 bucket
- Set cache headers in CloudFront
- Enable HTTPS with ACM certificate

---

### Option 4: Docker + Nginx

**Dockerfile:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Deploy:**

```bash
# Build image
docker build -t feedvex-frontend .

# Run container
docker run -d -p 80:80 feedvex-frontend

# Or use docker-compose
docker-compose up -d
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - run: cd frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Performance Optimization

### Pre-deployment Checklist

- [ ] Run production build locally
- [ ] Test in production mode (`npm run preview`)
- [ ] Check bundle size (`npm run build -- --report`)
- [ ] Verify all environment variables
- [ ] Test on different devices/browsers
- [ ] Run Lighthouse audit
- [ ] Check accessibility (WAVE, axe)
- [ ] Verify SEO meta tags
- [ ] Test error boundaries
- [ ] Verify API endpoints

### Optimization Tips

1. **Code Splitting:**
   - Already configured in `vite.config.ts`
   - Lazy load routes and heavy components

2. **Asset Optimization:**
   - Compress images (use WebP)
   - Minify CSS and JS (automatic)
   - Use CDN for static assets

3. **Caching:**
   - Set long cache headers for assets
   - Use service worker (optional)
   - Implement API response caching

4. **Performance Monitoring:**
   - Set up error tracking (Sentry)
   - Add analytics (Google Analytics, Plausible)
   - Monitor Core Web Vitals

---

## Monitoring & Analytics

### Error Tracking (Sentry)

```bash
npm install @sentry/react
```

```tsx
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Analytics (Google Analytics)

```bash
npm install react-ga4
```

```tsx
// src/main.tsx
import ReactGA from 'react-ga4';

if (import.meta.env.PROD) {
  ReactGA.initialize(import.meta.env.VITE_GA_ID);
}
```

---

## Security

### Security Headers

Already configured in `vercel.json` and `netlify.toml`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS

- Automatic with Vercel/Netlify
- Use Let's Encrypt for custom servers
- Redirect HTTP to HTTPS

### Environment Variables

- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly

---

## Rollback Strategy

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Netlify

```bash
# List deployments
netlify deploy:list

# Restore deployment
netlify deploy:restore [deploy-id]
```

### Manual

1. Keep previous build artifacts
2. Redeploy from backup
3. Use Git tags for versions

---

## Troubleshooting

### Build Fails

**Check:**
- Node version (should be 20+)
- Dependencies installed (`npm ci`)
- TypeScript errors (`npm run build`)
- Environment variables set

### Blank Page After Deploy

**Check:**
- Base URL in `vite.config.ts`
- Routing configuration
- Console errors in browser
- API endpoint accessibility

### Assets Not Loading

**Check:**
- Asset paths (should be relative)
- CORS headers
- CDN configuration
- Cache headers

### Slow Performance

**Check:**
- Bundle size (run `npm run build -- --report`)
- Network requests (use DevTools)
- Caching headers
- CDN configuration

---

## Post-Deployment

### Verification

1. Visit production URL
2. Test all major features
3. Check mobile responsiveness
4. Verify dark mode
5. Test authentication flow
6. Check error handling
7. Verify analytics tracking

### Monitoring

1. Set up uptime monitoring
2. Configure error alerts
3. Monitor performance metrics
4. Track user analytics
5. Review server logs

---

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security advisories
- Monitor error rates
- Analyze performance metrics
- Backup configuration

### Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions
npm install package@latest
```

---

## Support

For deployment issues:
1. Check platform documentation
2. Review build logs
3. Test locally first
4. Contact platform support
5. Open GitHub issue
