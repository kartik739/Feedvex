import { Link } from 'react-router-dom';
import { Search, Zap, Shield, BarChart3, TrendingUp, Users, Database } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import './HomePage.css';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState({
    documents: 0,
    queries: 0,
    users: 0,
  });

  useEffect(() => {
    // Animate counters
    const targetStats = {
      documents: 150000,
      queries: 50000,
      users: 1200,
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        documents: Math.floor(targetStats.documents * progress),
        queries: Math.floor(targetStats.queries * progress),
        users: Math.floor(targetStats.users * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-background"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title animate-fade-in">
              Search Reddit Content
              <br />
              <span className="gradient-text">Faster & Smarter</span>
            </h1>
            <p className="hero-description animate-fade-in-delay">
              Powerful search engine for Reddit with advanced filtering,
              real-time results, and intelligent BM25 ranking algorithm.
            </p>
            <div className="hero-actions animate-fade-in-delay-2">
              {isAuthenticated ? (
                <Link to="/search" className="btn btn-primary btn-lg btn-glow">
                  <Search size={20} />
                  Start Searching
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg btn-glow">
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

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <Database />
              </div>
              <div className="stat-number">{stats.documents.toLocaleString()}</div>
              <div className="stat-label">Documents Indexed</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp />
              </div>
              <div className="stat-number">{stats.queries.toLocaleString()}</div>
              <div className="stat-label">Searches Performed</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Users />
              </div>
              <div className="stat-number">{stats.users.toLocaleString()}</div>
              <div className="stat-label">Active Users</div>
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
              <p>Get search results in milliseconds with our optimized BM25 ranking algorithm and intelligent caching.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Search />
              </div>
              <h3>Smart Search</h3>
              <p>Advanced text processing with stemming, stopword removal, and real-time autocomplete suggestions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Secure & Private</h3>
              <p>Your searches are private and secure with enterprise-grade security and data protection.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 />
              </div>
              <h3>Analytics</h3>
              <p>Track search trends, popular queries, and system performance with detailed analytics dashboards.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
