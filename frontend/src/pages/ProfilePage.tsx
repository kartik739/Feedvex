import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api, authAPI } from '../services/api';
import { User, Mail, Save, Camera, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import './ProfilePage.css';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface HistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.getHistory(10);
      setSearchHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all search history?')) {
      return;
    }

    try {
      await api.clearHistory();
      setSearchHistory([]);
      showNotification('success', 'Search history cleared successfully!');
    } catch (error) {
      showNotification('error', 'Failed to clear search history');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await api.deleteHistoryEntry(entryId);
      setSearchHistory(searchHistory.filter(entry => entry.id !== entryId));
      showNotification('success', 'Entry deleted');
    } catch (error) {
      showNotification('error', 'Failed to delete entry');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  if (!user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await authAPI.updateProfile(formData.username, formData.email);
      setIsSaving(false);
      setIsEditing(false);
      showNotification('success', 'Profile updated successfully!');
    } catch (error) {
      setIsSaving(false);
      showNotification('error', 'Failed to update profile');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAvatarClick = () => {
    showNotification('success', 'Avatar upload feature coming soon!');
  };

  return (
    <div className="profile-page">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button className="avatar-upload-btn" onClick={handleAvatarClick}>
                <Camera size={16} />
              </button>
            </div>
            <div className="profile-info">
              <h1>{user.username}</h1>
              <p className="profile-email">
                <Mail size={16} />
                {user.email}
              </p>
              <p className="profile-joined">
                <Clock size={16} />
                Joined December 2024
              </p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">127</div>
              <div className="stat-label">Searches</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">45</div>
              <div className="stat-label">Clicks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12</div>
              <div className="stat-label">Saved</div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!isEditing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="username">
                  <User size={16} />
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user.username,
                        email: user.email,
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="profile-history-section">
            <h2>Recent Searches</h2>
            {isLoadingHistory ? (
              <div className="loading-state">Loading history...</div>
            ) : searchHistory.length > 0 ? (
              <div className="search-history">
                {searchHistory.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div>
                      <span className="history-query">{entry.query}</span>
                      <span className="history-time">{formatTimeAgo(entry.timestamp)}</span>
                      <span className="history-results">{entry.resultCount} results</span>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No search history yet</div>
            )}
            {searchHistory.length > 0 && (
              <button className="btn btn-secondary btn-sm clear-history-btn" onClick={handleClearHistory}>
                Clear History
              </button>
            )}
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
