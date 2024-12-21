import { useOfflineNotification } from '../hooks/useNetworkStatus';
import './OfflineNotification.css';

export default function OfflineNotification() {
  const { isOnline, showNotification } = useOfflineNotification();

  if (!showNotification) return null;

  return (
    <div
      className={`offline-notification ${isOnline ? 'online' : 'offline'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="offline-notification-content">
        <span className="offline-notification-icon">
          {isOnline ? '✓' : '⚠'}
        </span>
        <span className="offline-notification-message">
          {isOnline
            ? 'You are back online'
            : 'No internet connection. Some features may be unavailable.'}
        </span>
      </div>
    </div>
  );
}
