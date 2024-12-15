import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  count?: number;
}

export default function SkeletonLoader({ count = 5 }: SkeletonLoaderProps) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="skeleton-header">
            <div className="skeleton-badge" />
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-sm" />
          </div>
          <div className="skeleton-title" />
          <div className="skeleton-snippet">
            <div className="skeleton-text skeleton-text-full" />
            <div className="skeleton-text skeleton-text-full" />
            <div className="skeleton-text skeleton-text-half" />
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
