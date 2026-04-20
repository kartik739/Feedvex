import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SkipToContent from './SkipToContent';
import OfflineNotification from './OfflineNotification';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import SiteNav from './SiteNav';

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
      <SiteNav />
      <div className="flex-1 flex flex-col min-h-[calc(100vh-73px)]">
        <main id="main-content" role="main">
          <Outlet />
        </main>
      </div>
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
