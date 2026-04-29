import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Clock, Mic, MicOff } from 'lucide-react';
import { api } from '../services/api';

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
          if (
            finalTranscript.trim().length > 2 &&
            (finalTranscript.endsWith('.') ||
              finalTranscript.endsWith('?') ||
              finalTranscript.endsWith('!'))
          ) {
            setTimeout(() => {
              onSearch(finalTranscript.trim());
              addToRecentSearches(finalTranscript.trim());
            }, 500);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);

        // Show user-friendly error messages only for critical errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert(
            'Microphone access denied. Please allow microphone access in your browser settings to use voice search.'
          );
        } else if (event.error === 'network') {
          // Network errors are common and temporary - fail silently
          console.warn('Voice search network error - this is usually temporary');
        } else if (event.error === 'no-speech') {
          // No speech detected - this is normal, don't show error
          console.log('No speech detected');
        } else if (event.error === 'aborted') {
          // User stopped - don't show error
          console.log('Voice search stopped');
        } else {
          // Other errors - log but don't alert
          console.warn('Voice search error:', event.error, event.message);
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
        <mark key={index} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems =
      suggestions.length +
      (recentSearches.length > 0 && query.length < 2 ? recentSearches.length : 0);

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
    <div className="relative w-full max-w-3xl mx-auto z-40 group">
      <form
        onSubmit={handleSubmit}
        className="w-full relative shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      >
        <div
          className={`relative flex items-center bg-[#1D1D1D] transition-all duration-300 p-2 md:p-3 ${isFocused ? 'bg-[#1D1D1D] ring-2 ring-[#864535]/50' : 'hover:bg-[#252525]'}`}
        >
          <div className="pl-4">
            <Search size={22} className="text-[#864535]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl px-4 md:px-6 text-white placeholder-white/20 font-sans outline-none"
            placeholder={isListening ? 'Listening...' : 'Query technical threads or events...'}
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
              className={`p-3 mr-2 transition-colors rounded-full ${isListening ? 'text-[#864535] bg-[#864535]/10 animate-pulse' : 'text-white/40 hover:text-white'}`}
              onClick={toggleVoiceSearch}
              title={isListening ? 'Stop voice search' : 'Start voice search'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          {isLoading && (
            <div className="absolute right-40 pr-2 pointer-events-none">
              <Loader2 className="animate-spin text-white/50" size={20} />
            </div>
          )}

          <button
            type="submit"
            className="action-btn px-6 md:px-8 py-3 text-xs md:text-sm font-bold tracking-widest uppercase"
            disabled={!query.trim()}
          >
            SEARCH
          </button>
        </div>
      </form>

      {showSuggestions &&
        (suggestions.length > 0 || (recentSearches.length > 0 && query.length < 2)) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl max-h-[60vh] overflow-y-auto">
            {/* Recent Searches Section */}
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between px-6 py-2">
                  <span className="label-caps">Recent Searches</span>
                  <button
                    type="button"
                    className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    onClick={clearRecentSearches}
                  >
                    Clear
                  </button>
                </div>
                <ul className="mb-2">
                  {recentSearches.map((search, index) => (
                    <li
                      key={`recent-${index}`}
                      className={`flex items-center gap-4 px-6 py-3 cursor-pointer border-l-2 ${index === selectedIndex ? 'bg-[#1D1D1D] border-[#864535]' : 'border-transparent hover:bg-[#1D1D1D]'}`}
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <Clock size={16} className="text-[#864535]" />
                      <span className="text-white/80 font-sans">{search}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Autocomplete Suggestions Section */}
            {suggestions.length > 0 && (
              <div className="py-2 border-t border-white/5">
                {query.length >= 2 && (
                  <div className="px-6 py-3">
                    <span className="label-caps">Suggestions</span>
                  </div>
                )}
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={`suggestion-${index}`}
                      className={`flex items-center gap-4 px-6 py-3 cursor-pointer border-l-2 ${index === selectedIndex ? 'bg-[#1D1D1D] border-[#864535]' : 'border-transparent hover:bg-[#1D1D1D]'}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search size={16} className="text-[#864535]" />
                      <span className="text-white/80 font-sans">
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
