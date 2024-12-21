import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SkipToContent from './SkipToContent';
import OfflineNotification from './OfflineNotification';

export default function Layout() {
  return (
    <>
      <SkipToContent />
      <OfflineNotification />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main id="main-content" role="main" style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
