import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Clock } from 'lucide-react';
import { api } from '../services/api';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const RECENT_SEARCHES_KEY = 'feedvex_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await api.getAutocomplete(query);
        setSuggestions(data.suggestions);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const trimmedQuery = query.trim();
      onSearch(trimmedQuery);
      setShowSuggestions(false);
      
      // Add to recent searches
      addToRecentSearches(trimmedQuery);
    }
  };

  const addToRecentSearches = (searchQuery: string) => {
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s !== searchQuery);
      // Add to beginning
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // Save to localStorage
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    addToRecentSearches(suggestion);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + (recentSearches.length > 0 && query.length < 2 ? recentSearches.length : 0);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      
      // Determine which list the selected item is from
      if (query.length < 2 && recentSearches.length > 0) {
        handleSuggestionClick(recentSearches[selectedIndex]);
      } else {
        handleSuggestionClick(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
          <div className="search-icon-wrapper">
            <Search className="search-icon" size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search Reddit posts and comments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
          />
          {isLoading && (
            <div className="loading-spinner">
              <Loader2 className="spinner-icon" size={20} />
            </div>
          )}
        </div>
        <button type="submit" className="search-button" disabled={!query.trim()}>
          Search
        </button>
      </form>

      {showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && query.length < 2)) && (
        <div className="suggestions-dropdown">
          {/* Recent Searches Section */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                <span className="suggestions-title">Recent Searches</span>
                <button
                  type="button"
                  className="clear-recent-btn"
                  onClick={clearRecentSearches}
                >
                  Clear
                </button>
              </div>
              <ul className="suggestions-list">
                {recentSearches.map((search, index) => (
                  <li
                    key={`recent-${index}`}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(search)}
                  >
                    <Clock size={16} className="suggestion-icon" />
                    <span className="suggestion-text">{search}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Autocomplete Suggestions Section */}
          {suggestions.length > 0 && (
            <div className="suggestions-section">
              {query.length >= 2 && (
                <div className="suggestions-header">
                  <span className="suggestions-title">Suggestions</span>
                </div>
              )}
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`suggestion-${index}`}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search size={16} className="suggestion-icon" />
                    <span className="suggestion-text">
                      {highlightMatch(suggestion, query)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
