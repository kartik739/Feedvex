import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p>&copy; 2025 Feedvex. Powered by Reddit API.</p>
          <div className="footer-links">
            <a href="/api/v1/health" target="_blank" rel="noopener noreferrer">
              Health
            </a>
            <a href="/api/v1/metrics" target="_blank" rel="noopener noreferrer">
              Metrics
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
