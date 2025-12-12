-- Feedvex Database Initialization Script
-- Creates tables, indexes, and initial data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'comment')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    subreddit VARCHAR(255) NOT NULL,
    reddit_score INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_utc TIMESTAMP NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_subreddit ON documents(subreddit);
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author);
CREATE INDEX IF NOT EXISTS idx_documents_created_utc ON documents(created_utc DESC);
CREATE INDEX IF NOT EXISTS idx_documents_reddit_score ON documents(reddit_score DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON documents(processed);
CREATE INDEX IF NOT EXISTS idx_documents_collected_at ON documents(collected_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_title_content_fts ON documents 
    USING gin(to_tsvector('english', title || ' ' || content));

-- Analytics queries table
CREATE TABLE IF NOT EXISTS analytics_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    session_id VARCHAR(255)
);

-- Indexes for analytics_queries
CREATE INDEX IF NOT EXISTS idx_analytics_queries_query ON analytics_queries(query);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_timestamp ON analytics_queries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_user_id ON analytics_queries(user_id);

-- Analytics clicks table
CREATE TABLE IF NOT EXISTS analytics_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    doc_id VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for analytics_clicks
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_query ON analytics_clicks(query);
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_doc_id ON analytics_clicks(doc_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_timestamp ON analytics_clicks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_user_id ON analytics_clicks(user_id);

-- Collection metadata table
CREATE TABLE IF NOT EXISTS collection_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subreddit VARCHAR(255) NOT NULL,
    documents_collected INTEGER NOT NULL DEFAULT 0,
    errors TEXT[],
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for collection_metadata
CREATE INDEX IF NOT EXISTS idx_collection_metadata_subreddit ON collection_metadata(subreddit);
CREATE INDEX IF NOT EXISTS idx_collection_metadata_start_time ON collection_metadata(start_time DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for popular queries
CREATE OR REPLACE VIEW popular_queries AS
SELECT 
    query,
    COUNT(*) as query_count,
    AVG(latency_ms) as avg_latency_ms,
    AVG(result_count) as avg_result_count,
    MAX(timestamp) as last_queried
FROM analytics_queries
GROUP BY query
ORDER BY query_count DESC;

-- View for document statistics
CREATE OR REPLACE VIEW document_stats AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE type = 'post') as post_count,
    COUNT(*) FILTER (WHERE type = 'comment') as comment_count,
    COUNT(DISTINCT subreddit) as unique_subreddits,
    COUNT(DISTINCT author) as unique_authors,
    AVG(reddit_score) as avg_reddit_score,
    AVG(comment_count) as avg_comment_count,
    MIN(created_utc) as oldest_document,
    MAX(created_utc) as newest_document
FROM documents;

-- View for CTR (Click-Through Rate) by query
CREATE OR REPLACE VIEW query_ctr AS
SELECT 
    q.query,
    COUNT(DISTINCT q.id) as total_queries,
    COUNT(DISTINCT c.id) as total_clicks,
    CASE 
        WHEN COUNT(DISTINCT q.id) > 0 
        THEN ROUND((COUNT(DISTINCT c.id)::NUMERIC / COUNT(DISTINCT q.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as ctr_percentage
FROM analytics_queries q
LEFT JOIN analytics_clicks c ON q.query = c.query 
    AND c.timestamp >= q.timestamp 
    AND c.timestamp <= q.timestamp + INTERVAL '5 minutes'
GROUP BY q.query
HAVING COUNT(DISTINCT q.id) >= 5
ORDER BY ctr_percentage DESC;

-- Insert sample data (optional - comment out for production)
-- INSERT INTO documents (id, type, title, content, url, author, subreddit, reddit_score, comment_count, created_utc)
-- VALUES 
--     ('sample_1', 'post', 'Welcome to Feedvex', 'This is a sample post for testing.', 'https://reddit.com/r/test/sample_1', 'testuser', 'test', 10, 5, CURRENT_TIMESTAMP),
--     ('sample_2', 'post', 'Getting Started with Search', 'Learn how to use the search engine.', 'https://reddit.com/r/test/sample_2', 'testuser', 'test', 20, 10, CURRENT_TIMESTAMP);

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO feedvex;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO feedvex;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO feedvex;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Feedvex database initialized successfully!';
END $$;
