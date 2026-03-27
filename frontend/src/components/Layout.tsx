import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SkipToContent from './SkipToContent';
import OfflineNotification from './OfflineNotification';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Layout() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Register global keyboard shortcuts (/, h, s, p, t, ?)
  useGlobalKeyboardShortcuts();

  // Listen for ? key event dispatched by useGlobalKeyboardShortcuts
  useEffect(() => {
    const handler = () => setShowShortcuts(true);
    window.addEventListener('showShortcuts', handler);
    return () => window.removeEventListener('showShortcuts', handler);
  }, []);

  return (
    <>
      <SkipToContent />
      <OfflineNotification />
      <div className="app-main">
        <Header onShowShortcuts={() => setShowShortcuts(true)} />
        <main id="main-content" role="main">
          <Outlet />
        </main>
        <Footer />
      </div>
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
