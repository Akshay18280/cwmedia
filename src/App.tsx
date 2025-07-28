import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import PostDetail from './pages/PostDetail';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Verify from './pages/verify';
import Unsubscribe from './pages/Unsubscribe';
import TestingDashboard from './components/TestingDashboard';
import AnalyticsSetupGuide from './components/AnalyticsSetupGuide';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import PhoneAuthDebug from './components/PhoneAuthDebug';
import AuthDebug from './components/AuthDebug';
import ThemeShowcase from './pages/ThemeShowcase';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog/:id" element={<PostDetail />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/testing" element={<TestingDashboard />} />
              <Route path="/analytics-setup" element={<AnalyticsSetupGuide />} />
              <Route path="/phone-auth-debug" element={<PhoneAuthDebug />} />
              <Route path="/auth-debug" element={<AuthDebug />} />
              <Route path="/theme-showcase" element={<ThemeShowcase />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;