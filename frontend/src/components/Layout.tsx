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
      <div className="app-main">
        <Header />
        <main id="main-content" role="main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
