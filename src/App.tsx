import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import AboutAkshay from './pages/AboutAkshay';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import VideoPost from './pages/VideoPost';
import SearchPage from './pages/SearchPage';
import ThemeShowcase from './pages/ThemeShowcase';
import AccentTest from './pages/AccentTest';
import Verify from './pages/verify';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Login from './pages/Login';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              theme="system"
            />
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public routes */}
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="about-akshay" element={<AboutAkshay />} />
                <Route path="contact" element={<Contact />} />
                <Route path="blog" element={<Blog />} />
                <Route path="post/:id" element={<PostDetail />} />
                <Route path="video/:id" element={<VideoPost />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="theme-showcase" element={<ThemeShowcase />} />
                <Route path="accent-test" element={<AccentTest />} />
                
                {/* Auth routes */}
                <Route path="login" element={<Login />} />
                <Route path="verify" element={<Verify />} />
                
                {/* Admin routes */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/login" element={<AdminLogin />} />
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                
                {/* Catch all route */}
                <Route path="*" element={
                  <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-display mb-4 text-high-contrast">404 - Page Not Found</h1>
                      <p className="text-body-lg text-medium-contrast mb-8">
                        The page you're looking for doesn't exist.
                      </p>
                      <a 
                        href="/" 
                        className="inline-flex items-center px-6 py-3 bg-gradient-flow text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Go Home
                      </a>
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