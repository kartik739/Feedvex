import { create } from 'zustand';

export interface SearchResult {
  docId: string;
  title: string;
  url: string;
  snippet: string;
  score: number;
  metadata: {
    author: string;
    subreddit: string;
    redditScore: number;
    commentCount: number;
    createdUtc: string;
  };
}

export interface SearchResults {
  results: SearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  queryTimeMs: number;
}

interface SearchState {
  query: string;
  results: SearchResults | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  setQuery: (query: string) => void;
  setResults: (results: SearchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: null,
  isLoading: false,
  error: null,
  currentPage: 1,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  reset: () => set({
    query: '',
    results: null,
    isLoading: false,
    error: null,
    currentPage: 1,
  }),
}));
