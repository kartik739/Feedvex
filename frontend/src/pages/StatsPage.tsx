import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './StatsPage.css';

interface Stats {
  totalQueries: number;
  totalClicks: number;
  averageResponseTime: number;
  cacheHitRate: number;
  popularQueries: Array<{ query: string; count: number }>;
  topSubreddits: Array<{ subreddit: string; count: number }>;
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
        <h1>System Statistics</h1>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon">🔍</div>
            <div className="stat-number">{stats.totalQueries.toLocaleString()}</div>
            <div className="stat-label">Total Queries</div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">👆</div>
            <div className="stat-number">{stats.totalClicks.toLocaleString()}</div>
            <div className="stat-label">Total Clicks</div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">⚡</div>
            <div className="stat-number">{stats.averageResponseTime}ms</div>
            <div className="stat-label">Avg Response Time</div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">💾</div>
            <div className="stat-number">{(stats.cacheHitRate * 100).toFixed(1)}%</div>
            <div className="stat-label">Cache Hit Rate</div>
          </div>
        </div>

        <div className="stats-tables">
          <div className="stats-table-card">
            <h2>Popular Queries</h2>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.popularQueries.map((item, index) => (
                  <tr key={index}>
                    <td>{item.query}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stats-table-card">
            <h2>Top Subreddits</h2>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Subreddit</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSubreddits.map((item, index) => (
                  <tr key={index}>
                    <td>r/{item.subreddit}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
