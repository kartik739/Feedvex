import { api } from '../services/api';
import './ResultCard.css';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  commentCount: number;
  createdAt: string;
  type: 'post' | 'comment';
  snippet?: string;
  relevanceScore: number;
}

interface ResultCardProps {
  result: SearchResult;
  query: string;
}

export default function ResultCard({ result, query }: ResultCardProps) {
  const handleClick = () => {
    api.logClick(query, result.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-type">{result.type}</span>
        <span className="result-subreddit">r/{result.subreddit}</span>
        <span className="result-date">{formatDate(result.createdAt)}</span>
      </div>

      <
a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="result-title"
        onClick={handleClick}
      >
        {result.title}
      </a>

      {result.snippet && (
        <p className="result-snippet" dangerouslySetInnerHTML={{ __html: result.snippet }} />
      )}

      <div className="result-footer">
        <span className="result-author">u/{result.author}</span>
        <span className="result-score">↑ {result.score}</span>
        <span className="result-comments">💬 {result.commentCount}</span>
        <span className="result-relevance">
          Relevance: {(result.relevanceScore * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
