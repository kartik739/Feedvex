import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchStore } from '../store/searchStore';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { results, isLoading, error, search } = useSearchStore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      search(query, currentPage, pageSize);
    }
  }, [query, currentPage, search]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <h1>Search Reddit</h1>
          <SearchBar onSearch={handleSearch} initialQuery={query} />
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        ) : results ? (
          <>
            <div className="results-info">
              <p>
                Found {results.total} results in {results.processingTime}ms
              </p>
            </div>
            <SearchResults results={results.results} query={query} />
            {results.total > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(results.total / pageSize)}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : query ? (
          <div className="empty-state">
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>Enter a search query to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
