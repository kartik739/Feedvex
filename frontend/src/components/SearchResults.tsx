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
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="60" r="50" fill="var(--color-bg-secondary)" />
            <circle cx="45" cy="50" r="8" fill="var(--color-text-tertiary)" />
            <circle cx="75" cy="50" r="8" fill="var(--color-text-tertiary)" />
            <path
              d="M40 75 Q60 65 80 75"
              stroke="var(--color-text-tertiary)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>
        <h3 className="no-results-title">No results found</h3>
        <p className="no-results-message">
          We couldn't find any results for "<strong>{query}</strong>"
        </p>
        <div className="no-results-suggestions">
          <p className="suggestions-title">Try:</p>
          <ul className="suggestions-list">
            <li>Using different keywords</li>
            <li>Checking your spelling</li>
            <li>Using more general terms</li>
            <li>Searching for related topics</li>
          </ul>
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
