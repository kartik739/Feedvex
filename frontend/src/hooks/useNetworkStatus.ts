import { useState, useEffect } from 'react';

/**
 * Hook to track network status
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
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
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnlineStatus]);

  return {
    isOnline: isOnlineStatus,
    showNotification,
  };
}
