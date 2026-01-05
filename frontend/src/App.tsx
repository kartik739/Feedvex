import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppRoutes() {
  return (
    <Router>
      <ThemeProvider>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </ThemeProvider>
    </Router>
  );
}

function App() {
  // If Clerk key is configured, wrap with ClerkProvider
  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <AppRoutes />
      </ClerkProvider>
    );
  }

  // Dev fallback without Clerk
  return <AppRoutes />;
}

export default App;
