import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserButton, SignedIn, SignedOut, useClerk } from '@clerk/clerk-react';
import { useState } from 'react';

export default function SiteNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSignIn, openSignUp } = useClerk();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const isHome = location.pathname === '/';
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '?');

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      background: 'rgba(10, 10, 10, 0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontFamily: "'Noto Serif', Georgia, serif",
          fontSize: '17px',
          fontWeight: 600,
          fontStyle: 'italic',
          color: '#4edea3',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}>
          FeedVex
        </Link>

        {/* Nav links + Search — always shown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          <NavLink to="/search?q=" label="Search" active={location.pathname.startsWith('/search')} />
          <NavLink to="/stats" label="Stats" active={isActive('/stats')} />
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '5px 10px',
              marginLeft: '12px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search threads..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e5e2e1',
                fontSize: '13px',
                fontFamily: "'Manrope', sans-serif",
                width: '200px',
              }}
            />
          </form>
        </div>

        {/* Right: Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: { width: '30px', height: '30px', borderRadius: '6px' } } }}
            />
          </SignedIn>
          <SignedOut>
            <button
              onClick={() => openSignIn()}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: "'Manrope', sans-serif",
                color: '#999',
                padding: '6px 12px',
                borderRadius: '6px',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#999';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              Sign in
            </button>
            <button
              onClick={() => openSignUp()}
              style={{
                background: '#10b981',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Manrope', sans-serif",
                color: '#00291a',
                padding: '7px 16px',
                borderRadius: '6px',
                letterSpacing: '0.02em',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
            >
              Get Started
            </button>
          </SignedOut>
        </div>

      </div>
    </nav>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: "'Manrope', sans-serif",
        color: active ? '#4edea3' : '#777',
        textDecoration: 'none',
        padding: '5px 12px',
        borderRadius: '6px',
        background: active ? 'rgba(78, 222, 163, 0.08)' : 'transparent',
        transition: 'color 0.15s, background 0.15s',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = '#e5e2e1';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = '#777';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      {label}
    </Link>
  );
}
