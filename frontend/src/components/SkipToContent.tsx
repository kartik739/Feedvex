export default function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.addEventListener('blur', () => {
        mainContent.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      style={{
        position: 'fixed',
        top: '-100px',
        left: 0,
        zIndex: 9999,
        padding: '8px 16px',
        background: '#10b981',
        color: '#003824',
        fontWeight: 700,
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'top 0.2s',
      }}
      onFocus={(e) => { (e.target as HTMLElement).style.top = '8px'; }}
      onBlur={(e) => { (e.target as HTMLElement).style.top = '-100px'; }}
    >
      Skip to main content
    </a>
  );
}
