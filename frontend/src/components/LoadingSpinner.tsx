interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  color = '#864535',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/50 backdrop-blur-sm z-50' 
    : 'flex flex-col items-center justify-center p-4';

  const spinner = (
    <div className={containerClasses} role="status">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-t-2 animate-spin`}
           style={{ borderColor: `${color}33`, borderTopColor: color }} />
      {message && <p className="mt-4 text-sm text-white/60 font-sans">{message}</p>}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );

  return spinner;
}
