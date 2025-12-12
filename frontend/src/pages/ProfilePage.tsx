import { useAuthStore } from '../store/authStore';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h1>{user.username}</h1>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Searches</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Clicks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Saved</div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
