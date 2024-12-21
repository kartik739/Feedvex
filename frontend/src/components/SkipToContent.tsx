export default function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      // Remove tabindex after focus to restore normal tab order
      mainContent.addEventListener('blur', () => {
        mainContent.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      href="#main-content"
      className="skip-to-content"
      onClick={handleSkip}
    >
      Skip to main content
    </a>
  );
}
