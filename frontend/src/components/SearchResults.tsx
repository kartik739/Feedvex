import ResultCard from './ResultCard';
import SkeletonLoader from './SkeletonLoader';
import './SearchResults.css';

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

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
}

export default function SearchResults({ results, query, isLoading = false }: SearchResultsProps) {
  if (isLoading) {
    return <SkeletonLoader count={5} />;
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-icon">
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="empty-state-illustration"
          >
            {/* Background circle with gradient */}
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            
            {/* Background */}
            <circle cx="80" cy="80" r="70" fill="url(#bgGradient)" />
            
            {/* Magnifying glass */}
            <circle 
              cx="65" 
              cy="65" 
              r="25" 
              stroke="url(#iconGradient)" 
              strokeWidth="4" 
              fill="none"
              strokeLinecap="round"
            />
            <line 
              x1="85" 
              y1="85" 
              x2="105" 
              y2="105" 
              stroke="url(#iconGradient)" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
            
            {/* Question mark inside magnifying glass */}
            <text 
              x="65" 
              y="75" 
              fontSize="32" 
              fontWeight="bold" 
              fill="var(--color-text-tertiary)"
              textAnchor="middle"
            >
              ?
            </text>
            
            {/* Decorative dots */}
            <circle cx="30" cy="30" r="3" fill="var(--color-primary)" opacity="0.4" />
            <circle cx="130" cy="40" r="4" fill="var(--color-secondary)" opacity="0.4" />
            <circle cx="120" cy="120" r="3" fill="var(--color-primary)" opacity="0.4" />
            <circle cx="40" cy="130" r="4" fill="var(--color-secondary)" opacity="0.4" />
          </svg>
        </div>
        <h3 className="no-results-title">No results found</h3>
        <p className="no-results-message">
          We couldn't find any results for "<strong className="query-highlight">{query}</strong>"
        </p>
        <div className="no-results-suggestions">
          <p className="suggestions-title">Suggestions to improve your search:</p>
          <ul className="suggestions-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="var(--color-primary)" opacity="0.6" />
              </svg>
              <span>Try different or more general keywords</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="var(--color-primary)" opacity="0.6" />
              </svg>
              <span>Check your spelling</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="var(--color-primary)" opacity="0.6" />
              </svg>
              <span>Use fewer filters or broader date ranges</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="var(--color-primary)" opacity="0.6" />
              </svg>
              <span>Search for related or similar topics</span>
            </li>
          </ul>
        </div>
        <div className="popular-searches">
          <p className="popular-title">Popular searches:</p>
          <div className="popular-tags">
            <button className="tag-button">JavaScript</button>
            <button className="tag-button">React</button>
            <button className="tag-button">Python</button>
            <button className="tag-button">Machine Learning</button>
            <button className="tag-button">Web Development</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} query={query} />
      ))}
    </div>
  );
}
