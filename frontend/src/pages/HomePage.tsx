import { Link } from 'react-router-dom';
import { Search, Zap, Shield, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './HomePage.css';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Search Reddit Content
              <br />
              <span className="gradient-text">Faster & Smarter</span>
            </h1>
            <p className="hero-description">
              Powerful search engine for Reddit with advanced filtering,
              real-time results, and intelligent ranking.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/search" className="btn btn-primary btn-lg">
                  <Search size={20} />
                  Start Searching
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Feedvex?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>Lightning Fast</h3>
              <p>Get search results in milliseconds with our optimized BM25 ranking algorithm.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Search />
              </div>
              <h3>Smart Search</h3>
              <p>Advanced text processing with stemming, stopword removal, and autocomplete.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Secure & Private</h3>
              <p>Your searches are private and secure with enterprise-grade security.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 />
              </div>
              <h3>Analytics</h3>
              <p>Track search trends and popular queries with detailed analytics.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
