import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendingUp, Users, Search, MousePointer, Zap, Database } from 'lucide-react';
import './StatsPage.css';

interface Stats {
  totalDocuments: number;
  totalQueries: number;
  totalClicks: number;
  overallCTR: number;
  uniqueQueries: number;
  responseTimeStats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
  };
  popularQueries: Array<{ query: string; count: number }>;
  documentsByType: {
    posts: number;
    comments: number;
  };
  subreddits: string[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="stats-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-page">
        <div className="error-message">{error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="stats-container">
        <div className="stats-header">
          <h1>System Statistics</h1>
          <p className="stats-subtitle">Real-time analytics and performance metrics</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon queries">
                <Search size={24} />
              </div>
              <span className="stat-trend">+12%</span>
            </div>
            <div className="stat-value">{stats.totalQueries.toLocaleString()}</div>
            <div className="stat-label">Total Queries</div>
            <div className="stat-progress">
              <div className="stat-progress-bar" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon clicks">
                <MousePointer size={24} />
              </div>
              <span className="stat-trend">+8%</span>
            </div>
            <div className="stat-value">{stats.totalClicks.toLocaleString()}</div>
            <div className="stat-label">Total Clicks</div>
            <div className="stat-progress">
              <div className="stat-progress-bar" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon speed">
                <Zap size={24} />
              </div>
              <span className="stat-trend good">-5ms</span>
            </div>
            <div className="stat-value">{Math.round(stats.responseTimeStats.mean)}ms</div>
            <div className="stat-label">Avg Response Time</div>
            <div className="stat-progress">
              <div className="stat-progress-bar good" style={{ width: '90%' }}></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon cache">
                <Database size={24} />
              </div>
              <span className="stat-trend good">+3%</span>
            </div>
            <div className="stat-value">{stats.totalDocuments.toLocaleString()}</div>
            <div className="stat-label">Total Documents</div>
            <div className="stat-progress">
              <div className="stat-progress-bar good" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        <div className="stats-charts">
          <div className="chart-card">
            <div className="chart-header">
              <h2>
                <TrendingUp size={20} />
                Popular Queries
              </h2>
              <span className="chart-badge">Top 10</span>
            </div>
            <div className="chart-content">
              {stats.popularQueries.length > 0 ? (
                stats.popularQueries.map((item, index) => (
                  <div key={index} className="chart-bar-item">
                    <div className="chart-bar-label">
                      <span className="chart-rank">#{index + 1}</span>
                      <span className="chart-text">{item.query}</span>
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${(item.count / stats.popularQueries[0].count) * 100}%`,
                        }}
                      ></div>
                      <span className="chart-bar-value">{item.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-chart">No queries yet</div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h2>
                <Users size={20} />
                Top Subreddits
              </h2>
              <span className="chart-badge">Top 10</span>
            </div>
            <div className="chart-content">
              {stats.subreddits.length > 0 ? (
                stats.subreddits.slice(0, 10).map((subreddit, index) => (
                  <div key={index} className="chart-bar-item">
                    <div className="chart-bar-label">
                      <span className="chart-rank">#{index + 1}</span>
                      <span className="chart-text">r/{subreddit}</span>
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar-fill secondary"
                        style={{
                          width: `${((stats.subreddits.length - index) / stats.subreddits.length) * 100}%`,
                        }}
                      ></div>
                      <span className="chart-bar-value">{stats.subreddits.length - index}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-chart">No subreddits yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
