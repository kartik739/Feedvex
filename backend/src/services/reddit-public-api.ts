import { logger } from '../utils/logger';

/**
 * Simple Reddit Public API client (no authentication required)
 * Uses Reddit's JSON endpoints which are publicly accessible
 */
export class RedditPublicAPI {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'Feedvex/1.0';

  /**
   * Fetch posts from a subreddit using public JSON API
   * @param subreddit Subreddit name (use 'all' for r/all, 'popular' for r/popular)
   * @param limit Number of posts to fetch (max 100)
   * @returns Array of posts
   */
  async fetchPosts(subreddit: string, limit: number = 25): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/r/${subreddit}/hot.json?limit=${Math.min(limit, 100)}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const posts = data.data.children.map((child: any) => child.data);
      
      logger.info(`Fetched ${posts.length} posts from r/${subreddit}`);
      return posts;
    } catch (error) {
      logger.error(`Error fetching posts from r/${subreddit}`, { error });
      throw error;
    }
  }

  /**
   * Convert Reddit post to our Document format
   */
  convertToDocument(post: any) {
    return {
      id: post.id,
      title: post.title,
      content: post.selftext || post.url,
      url: `https://reddit.com${post.permalink}`,
      metadata: {
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        numComments: post.num_comments,
        createdAt: new Date(post.created_utc * 1000),
      },
    };
  }
}
