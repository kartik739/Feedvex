import { create } from 'zustand';
import { ToastType } from '../components/Toast';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for common toast types
export const toast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', message, duration });
  },
  
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', message, duration });
  },
  
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', message, duration });
  },
  
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', message, duration });
  },
};
