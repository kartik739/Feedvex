import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Save, Camera, Clock, CheckCircle, XCircle } from 'lucide-react';
import './ProfilePage.css';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

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

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      showNotification('success', 'Profile updated successfully!');
    }, 1000);
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
            <div className="search-history">
              <div className="history-item">
                <span className="history-query">machine learning python</span>
                <span className="history-time">2 hours ago</span>
              </div>
              <div className="history-item">
                <span className="history-query">react hooks tutorial</span>
                <span className="history-time">5 hours ago</span>
              </div>
              <div className="history-item">
                <span className="history-query">typescript best practices</span>
                <span className="history-time">1 day ago</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm clear-history-btn">
              Clear History
            </button>
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
