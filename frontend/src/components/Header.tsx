import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, BarChart3, User, LogOut, Menu, X, Keyboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

interface HeaderProps {
  onShowShortcuts?: () => void;
}

export default function Header({ onShowShortcuts }: HeaderProps) {
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
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-header py-3' : 'bg-transparent py-5'} ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <Search className="w-5 h-5 text-[#864535]" />
            <h1 className="font-serif text-xl font-bold tracking-tight">Feedvex</h1>
          </Link>

          <nav className={`hidden md:flex items-center gap-8 ${isMenuOpen ? 'block' : ''}`}>
            <Link
              to="/search"
              className={`flex items-center gap-2 label-caps hover:text-[#864535] transition-colors ${isActiveLink('/search') ? 'text-[#864535]' : 'text-white/60'}`}
            >
              <Search size={16} />
              <span>SEARCH</span>
            </Link>
            <Link
              to="/stats"
              className={`flex items-center gap-2 label-caps hover:text-[#864535] transition-colors ${isActiveLink('/stats') ? 'text-[#864535]' : 'text-white/60'}`}
            >
              <BarChart3 size={16} />
              <span>STATS</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="text-[#A3A3A3] hover:text-white transition-colors p-2"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {onShowShortcuts && (
              <button
                onClick={onShowShortcuts}
                className="text-[#A3A3A3] hover:text-white transition-colors p-2"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard size={18} />
              </button>
            )}

            {isAuthenticated ? (
              <div className="relative user-menu">
                <button
                  className="flex items-center gap-2 text-white/80 hover:text-white p-2"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-[#1D1D1D] flex items-center justify-center border border-white/10">
                    <User size={14} className="text-[#864535]" />
                  </div>
                  <span className="font-sans text-sm">{user?.username}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-white/5 shadow-2xl rounded-sm overflow-hidden backdrop-blur-xl">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-[#1D1D1D] transition-colors"
                    >
                      <User size={14} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#864535] hover:text-[#A35D4B] hover:bg-[#1D1D1D] transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4 ml-4">
                <Link to="/login" className="label-caps hover:text-white transition-colors">
                  LOGIN
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#864535] text-white px-5 py-2 text-xs font-bold tracking-widest hover:bg-[#A35D4B] transition-colors rounded-sm shadow-lg"
                >
                  SIGN UP
                </Link>
              </div>
            )}

            <button className="md:hidden text-white p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
              <Link
                to="/search"
                className={`mobile-nav-link ${isActiveLink('/search') ? 'active' : ''}`}
              >
                <Search size={20} />
                <span>Search</span>
              </Link>
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
