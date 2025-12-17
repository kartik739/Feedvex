import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchStore } from '../store/searchStore';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import { Filter, X, Calendar, TrendingUp } from 'lucide-react';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { results, isLoading, error, search } = useSearchStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subreddit: '',
    sortBy: 'relevance',
    dateRange: 'all',
  });
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      subreddit: '',
      sortBy: 'relevance',
      dateRange: 'all',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== 'relevance' && v !== 'all'
  ).length;

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <h1>Search Reddit</h1>
          <SearchBar onSearch={handleSearch} initialQuery={query} />
        </div>

        {query && (
          <div className="search-controls">
            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            {results && (
              <div className="search-stats">
                <TrendingUp size={16} />
                <span>
                  {results.total.toLocaleString()} results in {results.processingTime}ms
                </span>
              </div>
            )}
          </div>
        )}

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filter Results</h3>
              {activeFiltersCount > 0 && (
                <button className="clear-filters" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>

            <div className="filters-grid">
              <div className="filter-group">
                <label>Subreddit</label>
                <input
                  type="text"
                  placeholder="e.g., python, programming"
                  value={filters.subreddit}
                  onChange={(e) => handleFilterChange('subreddit', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="filter-select"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Most Recent</option>
                  <option value="score">Highest Score</option>
                </select>
              </div>

              <div className="filter-group">
                <label>
                  <Calendar size={16} />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="active-filters">
                {filters.subreddit && (
                  <span className="filter-chip">
                    r/{filters.subreddit}
                    <button onClick={() => handleFilterChange('subreddit', '')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.sortBy !== 'relevance' && (
                  <span className="filter-chip">
                    Sort: {filters.sortBy}
                    <button onClick={() => handleFilterChange('sortBy', 'relevance')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="filter-chip">
                    {filters.dateRange}
                    <button onClick={() => handleFilterChange('dateRange', 'all')}>
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

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
            <div className="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <h3>Start Your Search</h3>
            <p>Enter a search query above to find Reddit content</p>
          </div>
        )}
      </div>
    </div>
  );
}
