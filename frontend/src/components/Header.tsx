import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, BarChart3, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import './Header.css';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <Search className="logo-icon" />
            <h1>Feedvex</h1>
          </Link>

          <nav className="nav">
            {isAuthenticated && (
              <Link to="/search" className="nav-link">
                Search
              </Link>
            )}
            <Link to="/stats" className="nav-link">
              <BarChart3 size={18} />
              Stats
            </Link>
          </nav>

          <div className="header-actions">
            <button
              onClick={toggleTheme}
              className="icon-button"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {isAuthenticated ? (
              <div className="user-menu">
                <button className="user-button">
                  <User size={18} />
                  <span>{user?.username}</span>
                </button>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} />
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item">
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
