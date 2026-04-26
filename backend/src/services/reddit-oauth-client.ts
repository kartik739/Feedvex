import { logger } from '../utils/logger';
import axios from 'axios';

export interface RedditPost {
  id: string;
  type: 'post';
  title: string;
  content: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  commentCount: number;
  createdUtc: Date;
  permalink: string;
}

export interface RateLimitStatus {
  remaining: number;
  reset: Date;
  used: number;
  limit: number;
}

export interface CollectionOptions {
  maxPosts?: number;
  subreddit?: string;
}

/**
 * RedditOAuthClient - collects posts from Reddit using OAuth.
 * 
 * Why OAuth over public API? OAuth gives us 600 req/min vs 60 req/min.
 * That's 10x more data collection capacity, which means fresher results.
 * We use client credentials flow (no user login needed).
 */
export class RedditOAuthClient {
  private client: any | null = null;
  private rateLimitStatus: RateLimitStatus = {
    remaining: 600,
    reset: new Date(),
    used: 0,
    limit: 600,
  };

  constructor(
    private clientId?: string,
    private clientSecret?: string,
    private userAgent: string = 'FeedVex/1.0.0'
  ) {}

  /**
   * Initializes the Reddit OAuth client.
   * Falls back gracefully if credentials are not configured.
   */
  async authenticate(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      logger.warn('Reddit OAuth credentials not configured - using public API fallback');
      return;
    }

    try {
      const Snoowrap = (await import('snoowrap')).default;
      this.client = new Snoowrap({
        userAgent: this.userAgent,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        username: '',
        password: '',
        accessToken: '',
        refreshToken: '',
      });

      // Configure rate limiting
      this.client.config({ requestDelay: 100, continueAfterRatelimitError: true });
      logger.info('Reddit OAuth client initialized', { userAgent: this.userAgent });
    } catch (error) {
      logger.error('Failed to initialize Reddit OAuth client', { error });
    }
  }

  /**
   * Fetches hot posts from a subreddit.
   */
  async fetchHot(subreddit: string = 'all', limit: number = 25): Promise<RedditPost[]> {
    if (!this.client) {
      return this.fetchPublicApi(subreddit, 'hot', limit);
    }

    try {
      const listing = await this.client.getSubreddit(subreddit).getHot({ limit });
      return this.mapPosts(listing as any[]);
    } catch (error) {
      logger.error('Failed to fetch hot posts', { subreddit, error });
      return [];
    }
  }

  /**
   * Fetches new posts from a subreddit.
   */
  async fetchNew(subreddit: string = 'all', limit: number = 25): Promise<RedditPost[]> {
    if (!this.client) {
      return this.fetchPublicApi(subreddit, 'new', limit);
    }

    try {
      const listing = await this.client.getSubreddit(subreddit).getNew({ limit });
      return this.mapPosts(listing as any[]);
    } catch (error) {
      logger.error('Failed to fetch new posts', { subreddit, error });
      return [];
    }
  }

  /**
   * Fetches top posts from a subreddit.
   */
  async fetchTop(
    subreddit: string = 'all',
    time: 'hour' | 'day' | 'week' = 'day',
    limit: number = 25
  ): Promise<RedditPost[]> {
    if (!this.client) {
      return this.fetchPublicApi(subreddit, 'top', limit, time);
    }

    try {
      const listing = await this.client.getSubreddit(subreddit).getTop({ time, limit });
      return this.mapPosts(listing as any[]);
    } catch (error) {
      logger.error('Failed to fetch top posts', { subreddit, time, error });
      return [];
    }
  }

  /**
   * Collects posts from /r/all matching a query.
   * Fetches hot + top + new for comprehensive coverage.
   */
  async collectFromAll(query: string, options: CollectionOptions = {}): Promise<RedditPost[]> {
    const { maxPosts = 100, subreddit = 'all' } = options;
    const perFetch = Math.ceil(maxPosts / 3);

    const [hot, top, newPosts] = await Promise.all([
      this.fetchHot(subreddit, perFetch),
      this.fetchTop(subreddit, 'day', perFetch),
      this.fetchNew(subreddit, perFetch),
    ]);

    // Deduplicate by ID
    const seen = new Set<string>();
    const all = [...hot, ...top, ...newPosts].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Filter by query if provided
    if (query) {
      const q = query.toLowerCase();
      return all
        .filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
        .slice(0, maxPosts);
    }

    return all.slice(0, maxPosts);
  }

  getRateLimitStatus(): RateLimitStatus {
    return { ...this.rateLimitStatus };
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private mapPosts(items: any[]): RedditPost[] {
    return items
      .filter((item) => item && item.id && item.title)
      .map((item) => ({
        id: item.id,
        type: 'post' as const,
        title: item.title || '',
        content: item.selftext || item.url || '',
        url: `https://reddit.com${item.permalink}`,
        author: item.author?.name || '[deleted]',
        subreddit: item.subreddit_name_prefixed?.replace('r/', '') || item.subreddit || '',
        score: item.score || 0,
        commentCount: item.num_comments || 0,
        createdUtc: new Date((item.created_utc || 0) * 1000),
        permalink: item.permalink || '',
      }));
  }

  private async fetchPublicApi(
    subreddit: string,
    sort: 'hot' | 'new' | 'top',
    limit: number,
    time?: string
  ): Promise<RedditPost[]> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/${sort}.json`;
      const params = { limit, ...(time ? { t: time } : {}) };
      
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      return this.mapPublicPosts(response.data?.data?.children || []);
    } catch (error) {
      logger.error(`Failed to fetch public API fallback (${sort})`, { subreddit, error });
      return [];
    }
  }

  private mapPublicPosts(children: any[]): RedditPost[] {
    return children
      .map((child) => child.data)
      .filter((item) => item && item.id && item.title)
      .map((item) => ({
        id: item.id,
        type: 'post' as const,
        title: item.title || '',
        content: item.selftext || item.url || '',
        url: `https://reddit.com${item.permalink}`,
        author: item.author || '[deleted]',
        subreddit: item.subreddit || '',
        score: item.score || 0,
        commentCount: item.num_comments || 0,
        createdUtc: new Date((item.created_utc || 0) * 1000),
        permalink: item.permalink || '',
      }));
  }
}
