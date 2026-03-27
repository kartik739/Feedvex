/**
 * Fetches real Reddit posts from public API and seeds them into FeedVex.
 * Run: npx ts-node backend/scripts/fetch-reddit-data.ts
 */

import https from 'https';
import http from 'http';

const API_BASE = 'http://localhost:3000/api/v1';

const SUBREDDITS = [
  'programming', 'webdev', 'javascript', 'typescript', 'python',
  'reactjs', 'node', 'learnprogramming', 'technology',
  'MachineLearning', 'devops', 'docker', 'aws', 'golang', 'rust'
];

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FeedVex/1.0.0 seed-script' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function postJSON(path: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => { try { resolve(JSON.parse(out)); } catch { resolve(out); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Fetching real Reddit data...\n');
  const allDocs: any[] = [];

  for (const sub of SUBREDDITS) {
    process.stdout.write(`r/${sub}... `);
    try {
      const data = await fetchJSON(`https://www.reddit.com/r/${sub}/hot.json?limit=25`);
      const posts = (data?.data?.children || [])
        .map((c: any) => c.data)
        .filter((p: any) => p?.id && p?.title && !p.stickied);

      for (const p of posts) {
        allDocs.push({
          id: `reddit_${p.id}`,
          title: p.title,
          content: p.selftext || p.title,
          url: `https://reddit.com${p.permalink}`,
          author: p.author || 'unknown',
          subreddit: p.subreddit || sub,
          redditScore: p.score || 0,
          commentCount: p.num_comments || 0,
          createdAt: new Date((p.created_utc || 0) * 1000).toISOString(),
        });
      }
      console.log(`${posts.length} posts`);
    } catch (e) {
      console.log('failed');
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\nTotal fetched: ${allDocs.length}`);
  console.log('Seeding into FeedVex...');

  // Seed in batches of 50
  let seeded = 0;
  for (let i = 0; i < allDocs.length; i += 50) {
    const batch = allDocs.slice(i, i + 50);
    const result = await postJSON('/api/v1/seed/bulk', { documents: batch });
    seeded += result.seeded || 0;
    process.stdout.write('.');
  }

  console.log(`\n\nDone! ${seeded} documents seeded.`);
  console.log('Try searching: javascript, python, react, docker, typescript, machine learning');
}

main().catch(console.error);
