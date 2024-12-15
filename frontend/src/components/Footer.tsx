import { Github, Twitter, Linkedin, Heart, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-gradient" />
      <div className="container">
        <div className="footer-content">
          <div className="footer-section footer-brand">
            <h3 className="footer-logo">Feedvex</h3>
            <p className="footer-description">
              Search Reddit content with powerful, fast, and relevant results.
            </p>
            <div className="footer-social">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-links">
              <li>
                <a href="/search" className="footer-link">Search</a>
              </li>
              <li>
                <a href="/stats" className="footer-link">Statistics</a>
              </li>
              <li>
                <a href="/api/v1/health" target="_blank" rel="noopener noreferrer" className="footer-link">
                  API Health
                </a>
              </li>
              <li>
                <a href="/api/v1/metrics" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Metrics
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="https://www.reddit.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Reddit
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">Support</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="footer-link">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="footer-link">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Feedvex. Made with <Heart size={14} className="heart-icon" /> by developers.
          </p>
          <p className="footer-powered">
            Powered by Reddit API
          </p>
        </div>
      </div>
    </footer>
  );
}
