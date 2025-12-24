# 🎯 Quick Reference Card

## 🚀 Start Commands

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend

# Browser
http://localhost:5173
```

---

## 🔗 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend API** | http://localhost:3000/api/v1 | API base URL |
| **Health Check** | http://localhost:3000/api/v1/health | System health |
| **Stats** | http://localhost:3000/api/v1/stats | Statistics |
| **Metrics** | http://localhost:3000/api/v1/metrics | Prometheus metrics |

---

## 🧪 Test Credentials

```
Email: test@example.com
Username: testuser
Password: password123
```

---

## 🔍 Test Searches

Try these queries to see different results:
- `typescript` - Programming language
- `react hooks` - Frontend framework
- `machine learning` - AI/ML content
- `python tutorial` - Python programming
- `web development` - Web dev topics

---

## 🎛️ Features to Test

### 1. Search
- [x] Basic search
- [x] Autocomplete
- [x] Pagination
- [x] Result snippets

### 2. Filters
- [x] Filter by subreddit
- [x] Sort by relevance/date/score
- [x] Filter by date range

### 3. Authentication
- [x] Register
- [x] Login
- [x] Logout

### 4. Profile
- [x] View profile
- [x] Edit profile
- [x] View search history
- [x] Delete history entries
- [x] Clear all history

### 5. Statistics
- [x] Total queries
- [x] Total documents
- [x] Response times
- [x] Popular queries
- [x] Top subreddits

---

## 📊 Data Collection

### Initial Collection
- **Starts:** 30 seconds after backend starts
- **Duration:** 2-3 minutes
- **Posts:** ~50 per subreddit
- **Subreddits:** 7 (configurable in .env)

### Scheduled Collection
- **Frequency:** Every 6 hours
- **Automatic:** Yes
- **Configurable:** REDDIT_COLLECTION_INTERVAL_HOURS in .env

---

## 🐛 Quick Fixes

### Port Already in Use
```bash
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Clear Everything and Restart
```bash
# Stop servers (Ctrl+C in both terminals)

# Clear builds
rm -rf backend/dist frontend/dist

# Rebuild
npm run build:backend
npm run build:frontend

# Restart
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

### No Search Results
1. Wait for initial collection (check Terminal 1 logs)
2. Check health: http://localhost:3000/api/v1/health
3. Look for "totalDocuments" > 0

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Backend configuration |
| `frontend/.env` | Frontend configuration |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |

---

## 🎨 Customization

### Change Subreddits
Edit `.env`:
```env
REDDIT_SUBREDDITS=programming,technology,science,gaming,movies
```

### Change Collection Frequency
Edit `.env`:
```env
REDDIT_COLLECTION_INTERVAL_HOURS=12  # Every 12 hours
```

### Change Posts Per Subreddit
Edit `.env`:
```env
REDDIT_MAX_POSTS_PER_SUBREDDIT=100  # More posts
```

---

## 📈 Monitoring

### Check Logs
- **Backend:** Terminal 1 output
- **Frontend:** Terminal 2 output
- **Browser:** F12 → Console tab

### Check Collection Status
Look for in Terminal 1:
```
[INFO] Running initial Reddit collection...
[INFO] Collecting posts from r/programming
[INFO] Collected 50 posts from r/programming
[INFO] Collection cycle completed
```

### Check Document Count
```bash
curl http://localhost:3000/api/v1/health
```

Look for:
```json
{
  "components": {
    "documentStore": {
      "totalDocuments": 350
    }
  }
}
```

---

## 🎯 Success Indicators

✅ Backend shows: "Server running at http://localhost:3000"  
✅ Backend shows: "Initial collection complete"  
✅ Frontend shows: "Local: http://localhost:5173/"  
✅ Browser loads the homepage  
✅ Can register and login  
✅ Search returns results  
✅ Filters work  
✅ History is saved  

---

## 📚 Documentation

| File | What's Inside |
|------|---------------|
| `START_HERE.md` | Detailed startup guide |
| `QUICK_START.md` | 5-minute setup |
| `FINAL_STATUS.md` | Project status |
| `DEPLOYMENT_GUIDE.md` | Production deployment |
| `README.md` | Full documentation |

---

## 🆘 Need Help?

1. Check `START_HERE.md` for detailed instructions
2. Check Terminal 1 (backend) for error messages
3. Check Terminal 2 (frontend) for error messages
4. Check browser console (F12) for frontend errors
5. Check `http://localhost:3000/api/v1/health` for system status

---

## 🎉 Enjoy!

Your Reddit search engine is ready to use!

**Happy Searching! 🚀**
