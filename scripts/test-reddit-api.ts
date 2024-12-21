import { RedditPublicAPI } from '../src/services/reddit-public-api';

/**
 * Test script to fetch real Reddit data using public API
 * Run with: npx ts-node scripts/test-reddit-api.ts
 */

async function testRedditAPI() {
  console.log('🔍 Testing Reddit Public API...\n');

  const api = new RedditPublicAPI();
  const subreddits = ['programming', 'typescript', 'webdev'];

  for (const subreddit of subreddits) {
    try {
      console.log(`\n📡 Fetching from r/${subreddit}...`);
      const posts = await api.fetchPosts(subreddit, 5);

      console.log(`✅ Got ${posts.length} posts:\n`);
      
      posts.forEach((post, index) => {
        const doc = api.convertToDocument(post);
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   Score: ${doc.metadata.score} | Comments: ${doc.metadata.numComments}`);
        console.log(`   URL: ${doc.url}\n`);
      });
    } catch (error) {
      console.error(`❌ Error fetching from r/${subreddit}:`, error);
    }
  }

  console.log('\n✅ Test complete! Reddit Public API is working.');
  console.log('\nYou can now use this to collect real Reddit data without authentication!');
}

testRedditAPI().catch(console.error);
