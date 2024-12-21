import { useState, useEffect } from 'react';
import { isOnline, onNetworkStatusChange } from '../utils/networkErrorHandler';

/**
 * Hook to track network status
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const cleanup = onNetworkStatusChange(setOnline);
    return cleanup;
  }, []);

  return online;
}

/**
 * Hook to show offline notification
 */
export function useOfflineNotification() {
  const isOnlineStatus = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isOnlineStatus) {
      setShowNotification(true);
    } else {
      // Hide notification after coming back online
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnlineStatus]);

  return {
    isOnline: isOnlineStatus,
    showNotification,
  };
}
