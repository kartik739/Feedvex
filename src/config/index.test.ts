import { loadConfig } from './index';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load configuration with default values', () => {
    process.env.REDDIT_CLIENT_ID = 'test_client_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';

    const config = loadConfig();

    expect(config.reddit.clientId).toBe('test_client_id');
    expect(config.reddit.clientSecret).toBe('test_client_secret');
    expect(config.reddit.userAgent).toBe('Feedvex/1.0');
    expect(config.reddit.subreddits).toEqual(['programming']);
    expect(config.ranking.algorithm).toBe('bm25');
    expect(config.ranking.bm25K1).toBe(1.5);
    expect(config.ranking.bm25B).toBe(0.75);
    expect(config.port).toBe(3000);
  });

  it('should load configuration with custom values', () => {
    process.env.REDDIT_CLIENT_ID = 'custom_id';
    process.env.REDDIT_CLIENT_SECRET = 'custom_secret';
    process.env.REDDIT_SUBREDDITS = 'technology,science,programming';
    process.env.PORT = '8080';
    process.env.BM25_K1 = '2.0';
    process.env.BM25_B = '0.5';

    const config = loadConfig();

    expect(config.reddit.subreddits).toEqual(['technology', 'science', 'programming']);
    expect(config.port).toBe(8080);
    expect(config.ranking.bm25K1).toBe(2.0);
    expect(config.ranking.bm25B).toBe(0.5);
  });

  it('should throw error when Reddit credentials are missing', () => {
    delete process.env.REDDIT_CLIENT_ID;
    delete process.env.REDDIT_CLIENT_SECRET;

    expect(() => loadConfig()).toThrow(/Reddit client ID is required/);
  });

  it('should throw error when ranking weights do not sum to 1', () => {
    process.env.REDDIT_CLIENT_ID = 'test_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_secret';
    process.env.TEXT_WEIGHT = '0.5';
    process.env.RECENCY_WEIGHT = '0.2';
    process.env.POPULARITY_WEIGHT = '0.2';
    process.env.ENGAGEMENT_WEIGHT = '0.2';

    expect(() => loadConfig()).toThrow(/Ranking weights.*must sum to 1\.0/);
  });

  it('should throw error when BM25_K1 is negative', () => {
    process.env.REDDIT_CLIENT_ID = 'test_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_secret';
    process.env.BM25_K1 = '-1';

    expect(() => loadConfig()).toThrow(/BM25 k1 parameter must be non-negative/);
  });

  it('should throw error when BM25_B is out of range', () => {
    process.env.REDDIT_CLIENT_ID = 'test_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_secret';
    process.env.BM25_B = '1.5';

    expect(() => loadConfig()).toThrow(/BM25 b parameter must be between 0 and 1/);
  });

  it('should throw error when CACHE_TTL is not positive', () => {
    process.env.REDDIT_CLIENT_ID = 'test_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_secret';
    process.env.CACHE_TTL_SECONDS = '0';

    expect(() => loadConfig()).toThrow(/Cache TTL must be positive/);
  });

  it('should throw error when environment variable is not a valid number', () => {
    process.env.REDDIT_CLIENT_ID = 'test_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_secret';
    process.env.PORT = 'not_a_number';

    expect(() => loadConfig()).toThrow('Environment variable PORT must be a valid number');
  });
});
