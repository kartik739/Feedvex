import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  color = 'var(--color-primary)',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''}`} role="status">
      <svg
        className={`loading-spinner ${size}`}
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
        />
      </svg>
      {message && <p className="loading-spinner-message">{message}</p>}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );

  return spinner;
}
