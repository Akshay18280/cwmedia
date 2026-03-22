import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages (eagerly loaded — critical path)
import Home from './pages/Home';
import About from './pages/About';

// Lazy-loaded pages
const AiLab = lazy(() => import('./pages/AiLab'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AboutAkshay = lazy(() => import('./pages/AboutAkshay'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const VideoPost = lazy(() => import('./pages/VideoPost'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ThemeShowcase = lazy(() => import('./pages/ThemeShowcase'));
const AccentTest = lazy(() => import('./pages/AccentTest'));
const Verify = lazy(() => import('./pages/verify'));
const AutomationLab = lazy(() => import('./pages/AutomationLab'));
const Careers = lazy(() => import('./pages/Careers'));

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Login from './pages/Login';

const PageFallback = () => (
  <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
  </div>
);

const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

function App() {
  React.useEffect(() => {
    const fallback = document.getElementById('fallback-content');
    if (fallback) fallback.style.display = 'none';
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-center"
              richColors
              closeButton
              theme="system"
            />
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public routes */}
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="ai-lab" element={<ProtectedRoute><LazyPage><AiLab /></LazyPage></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute><LazyPage><Dashboard /></LazyPage></ProtectedRoute>} />
                <Route path="automation-lab" element={<ProtectedRoute requireAdmin><LazyPage><AutomationLab /></LazyPage></ProtectedRoute>} />
                <Route path="about-akshay" element={<LazyPage><AboutAkshay /></LazyPage>} />
                <Route path="contact" element={<LazyPage><Contact /></LazyPage>} />
                <Route path="careers" element={<LazyPage><Careers /></LazyPage>} />
                <Route path="blog" element={<LazyPage><Blog /></LazyPage>} />
                <Route path="post/:id" element={<LazyPage><PostDetail /></LazyPage>} />
                <Route path="video/:id" element={<LazyPage><VideoPost /></LazyPage>} />
                <Route path="search" element={<LazyPage><SearchPage /></LazyPage>} />
                <Route path="theme-showcase" element={<LazyPage><ThemeShowcase /></LazyPage>} />
                <Route path="accent-test" element={<LazyPage><AccentTest /></LazyPage>} />

                {/* Auth routes */}
                <Route path="login" element={<Login />} />
                <Route path="verify" element={<LazyPage><Verify /></LazyPage>} />

                {/* Admin routes */}
                <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="admin/login" element={<AdminLogin />} />
                <Route path="admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />

                {/* Catch all */}
                <Route path="*" element={
                  <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-display mb-4 text-high-contrast">404 - Page Not Found</h1>
                      <p className="text-body-lg text-medium-contrast mb-8">The page you're looking for doesn't exist.</p>
                      <a href="/" className="inline-flex items-center px-6 py-3 bg-gradient-flow text-white rounded-lg hover:opacity-90 transition-opacity">Go Home</a>
                    </div>
                  </div>
                } />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
