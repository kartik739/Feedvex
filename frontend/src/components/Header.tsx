import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, BarChart3, User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import './Header.css';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state for styling
      setIsScrolled(currentScrollY > 10);
      
      // Hide/show header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsHeaderVisible(false);
      } else {
        // Scrolling up
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''} ${isHeaderVisible ? 'visible' : 'hidden'}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <Search className="logo-icon" />
            <h1 className="logo-text">Feedvex</h1>
          </Link>

          <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
            {isAuthenticated && (
              <Link 
                to="/search" 
                className={`nav-link ${isActiveLink('/search') ? 'active' : ''}`}
              >
                <Search size={18} />
                <span>Search</span>
              </Link>
            )}
            <Link 
              to="/stats" 
              className={`nav-link ${isActiveLink('/stats') ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              <span>Stats</span>
            </Link>
          </nav>

          <div className="header-actions">
            <button
              onClick={toggleTheme}
              className="icon-button theme-toggle"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon size={20} className="theme-icon" />
              ) : (
                <Sun size={20} className="theme-icon" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="user-menu">
                <button 
                  className="user-button" 
                  aria-label="User menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="user-avatar">
                    <User size={18} />
                  </div>
                  <span className="user-name">{user?.username}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
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

            <button
              className="mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <nav className="mobile-nav">
              {isAuthenticated && (
                <Link 
                  to="/search" 
                  className={`mobile-nav-link ${isActiveLink('/search') ? 'active' : ''}`}
                >
                  <Search size={20} />
                  <span>Search</span>
                </Link>
              )}
              <Link 
                to="/stats" 
                className={`mobile-nav-link ${isActiveLink('/stats') ? 'active' : ''}`}
              >
                <BarChart3 size={20} />
                <span>Stats</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/profile" className="mobile-nav-link">
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button onClick={handleLogout} className="mobile-nav-link">
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
