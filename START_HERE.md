# 🚀 START YOUR SEARCH ENGINE

Follow these simple steps to see your Reddit search engine in action!

---

## Step 1: Open TWO Terminal Windows

You need two terminals - one for backend, one for frontend.

---

## Step 2: Start Backend (Terminal 1)

```bash
npm run dev:backend
```

**What you'll see:**
```
🚀 Server running at http://localhost:3000
📝 API docs: http://localhost:3000/api/v1/health
🔌 WebSocket stats: ws://localhost:3000/ws/stats
⚠️  Note: Using in-memory storage (no database required)
```

**Wait for this message (after ~30 seconds):**
```
Running initial Reddit collection...
Collecting posts from r/programming
Collecting posts from r/technology
...
Initial collection complete
```

**Keep this terminal open!**

---

## Step 3: Start Frontend (Terminal 2)

Open a **NEW terminal** and run:

```bash
npm run dev:frontend
```

**What you'll see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal open too!**

---

## Step 4: Open Your Browser

Go to: **http://localhost:5173**

---

## Step 5: Test Everything! 🎉

### A. Register an Account
1. Click "Sign Up" in the header
2. Enter:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
3. Click "Create Account"

### B. Search for Content
1. You'll be redirected to the search page
2. Try searching for:
   - `"typescript"` - Programming language content
   - `"react"` - Frontend framework
   - `"machine learning"` - AI/ML content
   - `"python"` - Python programming

### C. Use Filters
1. Click the "Filters" button
2. Try:
   - **Subreddit:** Type `programming`
   - **Sort by:** Select "Most Recent" or "Highest Score"
   - **Date range:** Select "Past Week"
3. See results update!

### D. Check Search History
1. Click "Profile" in the header
2. Scroll to "Recent Searches"
3. See all your searches with timestamps
4. Try:
   - Click trash icon to delete one entry
   - Click "Clear History" to delete all

### E. Update Your Profile
1. On Profile page, click "Edit Profile"
2. Change your username or email
3. Click "Save Changes"
4. See success notification!

### F. View Statistics
1. Click "Stats" in the header
2. See:
   - Total queries
   - Total documents collected
   - Average response time
   - Popular queries
   - Top subreddits

### G. Test Autocomplete
1. Go back to search
2. Start typing in the search box
3. See suggestions appear!

---

## 🎯 What to Expect

### Initial Data Collection
- **When:** 30 seconds after backend starts
- **What:** Collects ~50 posts from each of 7 subreddits
- **Total:** ~350 posts initially
- **Time:** Takes 2-3 minutes

### Subsequent Collections
- **When:** Every 6 hours automatically
- **What:** Refreshes data from Reddit
- **Note:** You can change this in `.env` (REDDIT_COLLECTION_INTERVAL_HOURS)

### Search Results
- **Speed:** < 100ms for most queries
- **Ranking:** BM25 algorithm with recency/popularity factors
- **Filters:** Work in real-time
- **Pagination:** 10 results per page

---

## 📊 Monitor Collection Progress

### Check Logs (Terminal 1)
Look for these messages:
```
[INFO] Running initial Reddit collection...
[INFO] Collecting posts from r/programming
[INFO] Collected 50 posts from r/programming
[INFO] Processed r/programming
[INFO] Collection cycle completed
[INFO] Initial collection complete
```

### Check Health Endpoint
Open in browser: http://localhost:3000/api/v1/health

You'll see:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T...",
  "components": {
    "documentStore": {
      "status": "healthy",
      "totalDocuments": 350
    },
    "index": {
      "status": "healthy",
      "totalDocuments": 350,
      "totalTerms": 15000
    }
  }
}
```

### Check Stats
Open: http://localhost:3000/api/v1/stats

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# If something is using it, kill it:
taskkill /PID <PID> /F

# Or change port in .env:
PORT=3001
```

### Frontend won't start?
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Kill it if needed
taskkill /PID <PID> /F
```

### No search results?
- Wait for initial collection to complete (check Terminal 1 logs)
- Check health endpoint to see document count
- Try searching for common terms like "python" or "javascript"

### Collection taking too long?
- Reduce subreddits in `.env`:
  ```
  REDDIT_SUBREDDITS=programming,technology,science
  ```
- Reduce posts per subreddit:
  ```
  REDDIT_MAX_POSTS_PER_SUBREDDIT=25
  ```

---

## 🎉 You're All Set!

Your Reddit search engine is now running with:
- ✅ Real Reddit data
- ✅ Advanced search with filters
- ✅ User authentication
- ✅ Search history
- ✅ Profile management
- ✅ Real-time statistics
- ✅ Automatic data updates

**Enjoy exploring your search engine!** 🚀

---

## 🔄 To Stop

Press `Ctrl+C` in both terminals to stop the servers.

## 🔄 To Restart

Just run the commands again:
- Terminal 1: `npm run dev:backend`
- Terminal 2: `npm run dev:frontend`

---

## 📚 Next Steps

Once you've tested everything:
1. Read `DEPLOYMENT_GUIDE.md` to deploy to production
2. Check `ADVANCED_FEATURES_COMPLETE.md` for more features
3. Customize subreddits in `.env` to your interests!
