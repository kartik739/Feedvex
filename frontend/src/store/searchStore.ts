import { create } from 'zustand';
import { api } from '../services/api';

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
  total: number;
  page: number;
  pageSize: number;
  processingTime: number;
}

interface SearchState {
  query: string;
  results: SearchResults | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  search: (query: string, page?: number, pageSize?: number, filters?: any) => Promise<void>;
  setQuery: (query: string) => void;
  setResults: (results: SearchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: null,
  isLoading: false,
  error: null,
  currentPage: 1,

  search: async (query: string, page = 1, pageSize = 10, filters?: any) => {
    set({ isLoading: true, error: null, query });
    try {
      const response = await api.search(query, page, pageSize, filters);
      set({
        results: {
          results: response.results || [],
          total: response.totalCount || 0,
          page: response.page || page,
          pageSize: response.pageSize || pageSize,
          processingTime: response.queryTimeMs || 0,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
        results: null,
      });
    }
  },

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
