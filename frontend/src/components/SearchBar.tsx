import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Clock, Mic, MicOff } from 'lucide-react';
import { api } from '../services/api';
import './SearchBar.css';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

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
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update query with interim results for real-time feedback
        if (interimTranscript) {
          setQuery(interimTranscript);
        }
        
        // When final result is available, set it and potentially search
        if (finalTranscript) {
          setQuery(finalTranscript);
          // Auto-search if the transcript seems complete (ends with punctuation or is long enough)
          if (finalTranscript.trim().length > 2 && 
              (finalTranscript.endsWith('.') || finalTranscript.endsWith('?') || finalTranscript.endsWith('!'))) {
            setTimeout(() => {
              onSearch(finalTranscript.trim());
              addToRecentSearches(finalTranscript.trim());
            }, 500);
          }
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error messages
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access to use voice search.');
        } else if (event.error === 'no-speech') {
          // This is normal, just means no speech was detected
        } else {
          console.warn('Voice search error:', event.error);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSearch]);

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

  const toggleVoiceSearch = () => {
    if (!isVoiceSupported || !recognitionRef.current) {
      alert('Voice search is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Clear current query when starting voice search
      setQuery('');
      recognitionRef.current.start();
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
            placeholder={isListening ? "Listening..." : "Search Reddit posts and comments..."}
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
          {isVoiceSupported && (
            <button
              type="button"
              className={`voice-search-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceSearch}
              title={isListening ? "Stop voice search" : "Start voice search"}
              aria-label={isListening ? "Stop voice search" : "Start voice search"}
            >
              {isListening ? (
                <MicOff className="voice-icon" size={20} />
              ) : (
                <Mic className="voice-icon" size={20} />
              )}
              {isListening && <div className="voice-pulse" />}
            </button>
          )}
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
