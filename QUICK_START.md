# FeedVex - Quick Start Guide 🚀

Get your Reddit search engine running in 5 minutes!

---

## Prerequisites

- Node.js 20+ installed
- npm installed
- Terminal/Command Prompt

---

## Step 1: Install Dependencies (if not done)

```bash
npm install --legacy-peer-deps
```

---

## Step 2: Build Backend

```bash
npm run build:backend
```

Expected output: `✓ Compiled successfully`

---

## Step 3: Start Backend Server

```bash
npm run dev:backend
```

Expected output:
```
🚀 Server running at http://localhost:3000
📝 API docs: http://localhost:3000/api/v1/health
🔌 WebSocket stats: ws://localhost:3000/ws/stats
⚠️  Note: Using in-memory storage (no database required)
```

**Keep this terminal open!**

---

## Step 4: Seed Test Data

Open a **new terminal** and run:

```bash
curl -X POST http://localhost:3000/api/v1/seed
```

Or open in browser: http://localhost:3000/api/v1/seed

Expected response:
```json
{
  "success": true,
  "message": "Seeded 3 documents",
  "count": 3
}
```

---

## Step 5: Start Frontend (New Terminal)

```bash
npm run dev:frontend
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 6: Open Application

Open your browser and go to: **http://localhost:5173**

---

## Step 7: Test the Application

### 7.1 Register an Account
1. Click "Sign Up" in the header
2. Enter email, username, password
3. Click "Create Account"

### 7.2 Search
1. You'll be redirected to the search page
2. Enter a query: "typescript" or "machine learning"
3. See results from seeded data

### 7.3 Try Filters
1. Click "Filters" button
2. Try filtering by:
   - Subreddit: "programming"
   - Sort by: "Most Recent"
   - Date range: "Past Week"

### 7.4 Check Search History
1. Click "Profile" in header
2. Scroll to "Recent Searches"
3. See your search history
4. Try deleting an entry or clearing all

### 7.5 View Stats
1. Click "Stats" in header
2. See system statistics:
   - Total queries
   - Total documents
   - Popular queries
   - Top subreddits

---

## 🎉 You're Done!

Your Reddit search engine is now running with:
- ✅ Full-text search with BM25 ranking
- ✅ Search filters (subreddit, sort, date)
- ✅ User authentication
- ✅ Search history
- ✅ Profile management
- ✅ Real-time statistics
- ✅ Autocomplete suggestions
- ✅ Rate limiting
- ✅ Analytics tracking

---

## 🔧 Troubleshooting

### Port 3000 already in use?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Port 5173 already in use?
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

### No search results?
Make sure you seeded test data (Step 4)

### Can't login?
Make sure backend is running (Step 3)

---

## 📚 Next Steps

- Read **IMPLEMENTATION_COMPLETE.md** for detailed feature list
- Read **PROJECT_AUDIT.md** for missing features
- Read **README.md** for full documentation
- Check **DOCKER.md** for Docker deployment

---

## 🐛 Need Help?

Check the logs:
- Backend logs: In the terminal running `npm run dev:backend`
- Frontend logs: Browser console (F12)
- Network requests: Browser DevTools → Network tab

---

## 🎊 Enjoy Your Search Engine!

You now have a production-quality Reddit search engine running locally!

Try searching for:
- "typescript" - Programming language content
- "react" - Frontend framework content
- "machine learning" - ML/AI content
- "python" - Python programming content

All searches are indexed with BM25 ranking, filtered by your criteria, and tracked in your history!
