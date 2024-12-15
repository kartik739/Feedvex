import { MessageCircle, TrendingUp, Calendar, User } from 'lucide-react';
import { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const SNIPPET_LIMIT = 200;
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    api.logClick(query, result.id);
    
    // Create ripple effect
    const card = e.currentTarget.closest('.result-card') as HTMLElement;
    if (card) {
      const ripple = document.createElement('span');
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple');
      
      card.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    }
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

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    // Split query into terms and filter out empty strings
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    if (terms.length === 0) return text;
    
    // Create a regex pattern that matches any of the query terms
    const pattern = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    // Split text by matches and wrap matches in mark tags
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = terms.some(term => part.toLowerCase() === term);
      return isMatch ? `<mark>${part}</mark>` : part;
    }).join('');
  };

  const shouldShowExpand = result.snippet && result.snippet.length > SNIPPET_LIMIT;
  const displaySnippet = shouldShowExpand && !isExpanded 
    ? result.snippet!.substring(0, SNIPPET_LIMIT) + '...'
    : result.snippet;

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-type">{result.type}</span>
        <span className="result-subreddit">r/{result.subreddit}</span>
        <span className="result-date">
          <Calendar size={14} />
          {formatDate(result.createdAt)}
        </span>
      </div>

      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="result-title"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
      />

      {result.snippet && (
        <div className="result-snippet-container">
          <p 
            className={`result-snippet ${isExpanded ? 'expanded' : ''}`}
            dangerouslySetInnerHTML={{ __html: highlightText(displaySnippet || '', query) }} 
          />
          {shouldShowExpand && (
            <button
              className="expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Show less' : 'Read more'}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      <div className="result-footer">
        <span className="result-author">
          <User size={14} />
          u/{result.author}
        </span>
        <span className="result-score">
          <TrendingUp size={14} />
          {result.score}
        </span>
        <span className="result-comments">
          <MessageCircle size={14} />
          {result.commentCount}
        </span>
        <span className="result-relevance">
          Relevance: {(result.relevanceScore * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
