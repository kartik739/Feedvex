import ResultCard from './ResultCard';
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
}

export default function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>No results found for "{query}"</p>
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
