import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email: string, username: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, username, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (username: string, email: string) => {
    const response = await apiClient.patch('/auth/profile', { username, email });
    return response.data;
  },
};

// Search API
export const api = {
  search: async (query: string, page: number = 1, pageSize: number = 10, filters?: any) => {
    const response = await apiClient.post('/search', { query, page, pageSize, filters });
    return response.data;
  },

  getAutocomplete: async (prefix: string, limit: number = 10) => {
    const response = await apiClient.get('/autocomplete', {
      params: { prefix, limit },
    });
    return response.data;
  },

  logClick: async (query: string, docId: string) => {
    await apiClient.post('/click', { query, docId, position: 0 });
  },

  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  getHistory: async (limit: number = 50) => {
    const response = await apiClient.get('/history', {
      params: { limit },
    });
    return response.data;
  },

  deleteHistoryEntry: async (entryId: string) => {
    const response = await apiClient.delete(`/history/${entryId}`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await apiClient.delete('/history');
    return response.data;
  },
};

export default apiClient;
