import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { isSignedIn } = useAuth();
  const { openSignUp, openSignIn } = useClerk();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!isSignedIn) {
      openSignUp();
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#e5e2e1',
        fontFamily: "'Manrope', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px 120px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {/* ── LEFT: Hero & Search ── */}
        <section>
          {/* Tag line */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(78,222,163,0.08)',
              border: '1px solid rgba(78,222,163,0.18)',
              borderRadius: '100px',
              padding: '4px 12px',
              marginBottom: '32px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#4edea3',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#4edea3',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              12M+ Threads Indexed
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#f0eeec',
              margin: '0 0 24px',
            }}
          >
            The Terminal <em style={{ color: '#4edea3', fontStyle: 'italic' }}>for</em> Human
            Knowledge.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: '#8a9490',
              margin: '0 0 48px',
              maxWidth: '440px',
              fontWeight: 400,
            }}
          >
            We index developer Reddit threads so you can search them in milliseconds — even after
            they're deleted.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ maxWidth: '480px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '6px 6px 6px 16px',
                gap: '8px',
                transition: 'border-color 0.2s',
              }}
              onFocus={() => {}}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isSignedIn ? 'Search Reddit for technical answers...' : 'Sign up to search...'
                }
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#e5e2e1',
                  fontFamily: "'Manrope', sans-serif",
                  padding: '8px 0',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#10b981',
                  color: '#00291a',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = 'none';
                }}
              >
                {isSignedIn ? 'Search' : 'Get Started'}
              </button>
            </div>
          </form>

          {/* Auth nudge */}
          {!isSignedIn && (
            <p style={{ fontSize: '13px', color: '#555', marginTop: '16px' }}>
              Already have an account?{' '}
              <button
                onClick={() => openSignIn()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4edea3',
                  fontSize: '13px',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </section>

        {/* ── RIGHT: Stats & Preview ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <StatCard value="12M+" label="Threads Indexed" />
            <StatCard value="800k+" label="Devs Active" live />
            <StatCard value="0.4s" label="Avg Search Time" />
            <StatCard value="142" label="Subreddits" />
          </div>

          {/* Sample thread preview */}
          <div
            style={{
              background: '#181818',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '20px 24px',
              borderLeft: '3px solid rgba(78,222,163,0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#4edea3',
                  background: 'rgba(78,222,163,0.1)',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  letterSpacing: '0.06em',
                }}
              >
                r/rust
              </span>
              <span style={{ fontSize: '11px', color: '#444' }}>4m ago</span>
            </div>
            <p
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#e5e2e1',
                margin: '0 0 12px',
              }}
            >
              Memory safety in concurrent pipelines: A deep dive into ownership transfer patterns.
            </p>
            <span
              style={{
                fontSize: '11px',
                color: '#444',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              128 experts discussing
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ value, label, live }: { value: string; label: string; live?: boolean }) {
  return (
    <div
      style={{
        background: '#181818',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {live && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#4edea3',
            color: '#00291a',
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '100px',
            letterSpacing: '0.08em',
          }}
        >
          LIVE
        </span>
      )}
      <div
        style={{
          fontFamily: "'Noto Serif', Georgia, serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#f0eeec',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: '6px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#555',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}
