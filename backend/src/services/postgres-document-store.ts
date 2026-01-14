import { PostgresClient } from './postgres-client';
import { Document } from '../models/document';
import { logger } from '../utils/logger';

export interface DocumentFilter {
  subreddit?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface DocumentStats {
  totalDocuments: number;
  postCount: number;
  commentCount: number;
  subreddits: string[];
}

/**
 * PostgresDocumentStore - persists Reddit posts in Railway PostgreSQL.
 * 
 * Why Railway over self-hosted? Railway gives us managed PostgreSQL with
 * automatic backups, connection pooling, and zero ops overhead.
 * We connect via DATABASE_URL which Railway provides automatically.
 */
export class PostgresDocumentStore {
  constructor(private db: PostgresClient) {}

  /**
   * Initializes the database schema (creates tables if they don't exist).
   */
  async initialize(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'post',
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        author VARCHAR(255),
        subreddit VARCHAR(255),
        reddit_score INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_utc TIMESTAMPTZ,
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        processed BOOLEAN DEFAULT FALSE,
        metadata JSONB
      )
    `);

    // Create indexes for fast queries
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_subreddit ON documents(subreddit);
      CREATE INDEX IF NOT EXISTS idx_documents_created_utc ON documents(created_utc DESC);
      CREATE INDEX IF NOT EXISTS idx_documents_reddit_score ON documents(reddit_score DESC);
    `);

    logger.info('PostgresDocumentStore initialized');
  }

  /**
   * Stores a single document. Uses INSERT ... ON CONFLICT DO UPDATE (upsert).
   */
  async store(doc: Document): Promise<boolean> {
    try {
      await this.db.query(
        `INSERT INTO documents (id, type, title, content, url, author, subreddit, reddit_score, comment_count, created_utc, collected_at, processed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           reddit_score = EXCLUDED.reddit_score,
           comment_count = EXCLUDED.comment_count,
           collected_at = EXCLUDED.collected_at`,
        [
          doc.id, doc.type || 'post', doc.title, doc.content, doc.url,
          doc.author, doc.subreddit, doc.redditScore || 0, doc.commentCount || 0,
          doc.createdUtc, doc.collectedAt || new Date(), doc.processed || false,
        ]
      );
      return true;
    } catch (error) {
      logger.error('Failed to store document', { id: doc.id, error });
      return false;
    }
  }

  /**
   * Stores multiple documents in a single transaction.
   */
  async storeMany(docs: Document[]): Promise<number> {
    if (docs.length === 0) return 0;

    let stored = 0;
    await this.db.transaction(async (client) => {
      for (const doc of docs) {
        await client.query(
          `INSERT INTO documents (id, type, title, content, url, author, subreddit, reddit_score, comment_count, created_utc, collected_at, processed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             reddit_score = EXCLUDED.reddit_score,
             comment_count = EXCLUDED.comment_count,
             collected_at = EXCLUDED.collected_at`,
          [
            doc.id, doc.type || 'post', doc.title, doc.content, doc.url,
            doc.author, doc.subreddit, doc.redditScore || 0, doc.commentCount || 0,
            doc.createdUtc, doc.collectedAt || new Date(), doc.processed || false,
          ]
        );
        stored++;
      }
    });

    logger.info('Stored documents in batch', { count: stored });
    return stored;
  }

  /**
   * Retrieves a document by ID.
   */
  async getById(id: string): Promise<Document | null> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    return row ? this.rowToDocument(row) : null;
  }

  /**
   * Retrieves all documents with optional filtering.
   */
  async getAll(filter?: DocumentFilter): Promise<Document[]> {
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (filter?.subreddit) {
      query += ` AND subreddit = $${paramIdx++}`;
      params.push(filter.subreddit);
    }
    if (filter?.dateFrom) {
      query += ` AND created_utc >= $${paramIdx++}`;
      params.push(filter.dateFrom);
    }
    if (filter?.dateTo) {
      query += ` AND created_utc <= $${paramIdx++}`;
      params.push(filter.dateTo);
    }

    query += ' ORDER BY created_utc DESC';

    if (filter?.limit) {
      query += ` LIMIT $${paramIdx++}`;
      params.push(filter.limit);
    }
    if (filter?.offset) {
      query += ` OFFSET $${paramIdx++}`;
      params.push(filter.offset);
    }

    const result = await this.db.query<any>(query, params);
    return result.rows.map(this.rowToDocument);
  }

  /**
   * Updates a document's fields.
   */
  async update(id: string, updates: Partial<Document>): Promise<boolean> {
    try {
      await this.db.query(
        'UPDATE documents SET processed = $1, collected_at = $2 WHERE id = $3',
        [updates.processed ?? false, updates.collectedAt ?? new Date(), id]
      );
      return true;
    } catch (error) {
      logger.error('Failed to update document', { id, error });
      return false;
    }
  }

  /**
   * Returns document statistics.
   */
  async getStats(): Promise<DocumentStats> {
    const [countResult, subredditResult] = await Promise.all([
      this.db.query<any>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type = 'post') as posts,
          COUNT(*) FILTER (WHERE type = 'comment') as comments
        FROM documents
      `),
      this.db.query<any>('SELECT DISTINCT subreddit FROM documents WHERE subreddit IS NOT NULL LIMIT 100'),
    ]);

    const counts = countResult.rows[0];
    return {
      totalDocuments: parseInt(counts.total) || 0,
      postCount: parseInt(counts.posts) || 0,
      commentCount: parseInt(counts.comments) || 0,
      subreddits: subredditResult.rows.map((r: any) => r.subreddit),
    };
  }

  /**
   * Returns total document count (for compatibility with in-memory store).
   */
  async getTotalDocuments(): Promise<number> {
    const result = await this.db.queryOne<any>('SELECT COUNT(*) as count FROM documents');
    return parseInt(result?.count) || 0;
  }

  private rowToDocument(row: any): Document {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content || '',
      url: row.url || '',
      author: row.author || '',
      subreddit: row.subreddit || '',
      redditScore: row.reddit_score || 0,
      commentCount: row.comment_count || 0,
      createdUtc: row.created_utc ? new Date(row.created_utc) : new Date(),
      collectedAt: row.collected_at ? new Date(row.collected_at) : new Date(),
      processed: row.processed || false,
    };
  }
}
