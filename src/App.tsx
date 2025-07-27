import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Blog from './pages/Blog';
import About from './pages/About';
import PostDetail from './pages/PostDetail';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Unsubscribe from './pages/Unsubscribe';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<PostDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;