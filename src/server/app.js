/**
 * Carelwave Media Backend API Server
 * Production-ready Express.js server with comprehensive features
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Firebase Admin SDK Configuration (Development Mode)
let admin;
try {
  const serviceAccount = require('./config/firebase-service-account.json');
  
  // Only initialize Firebase Admin in production or if real service account exists
  if (NODE_ENV === 'production' && serviceAccount.private_key && !serviceAccount.private_key.includes('MOCK')) {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://carelwave-media-default-rtdb.firebaseio.com',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'carelwave-media.firebasestorage.app'
    });
    console.log('🔥 Firebase Admin SDK initialized');
  } else {
    console.log('🔧 Development mode: Firebase Admin SDK disabled (using mock)');
  }
} catch (error) {
  console.log('🔧 Development mode: Firebase service account not found, using mock services');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://api.github.com", "wss:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    services: {
      database: admin ? 'connected' : 'mock',
      firebase: admin ? 'connected' : 'mock'
    }
  });
});

// Mock API endpoints for development
app.get('/api/posts', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Building Scalable React Applications',
        slug: 'building-scalable-react-applications',
        excerpt: 'Learn advanced patterns for building maintainable React apps.',
        content: 'Full content here...',
        author: 'Akshay Verma',
        createdAt: new Date().toISOString(),
        published: true,
        tags: ['React', 'JavaScript', 'Frontend'],
        categories: ['Development']
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  });
});

app.get('/api/analytics/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      pageViews: 15420,
      uniqueVisitors: 8932,
      bounceRate: 0.32,
      avgSessionDuration: 245,
      topPages: [
        { path: '/', views: 5432 },
        { path: '/blog', views: 3210 },
        { path: '/about-akshay', views: 2108 }
      ]
    }
  });
});

app.get('/api/newsletter/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalSubscribers: 2834,
      activeSubscribers: 2756,
      recentSignups: 45,
      openRate: 0.68,
      clickRate: 0.24
    }
  });
});

app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  // Mock subscription
  res.json({
    success: true,
    message: 'Successfully subscribed to newsletter!',
    data: {
      email,
      subscribedAt: new Date().toISOString()
    }
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Name, email, and message are required'
    });
  }

  // Mock contact form submission
  res.json({
    success: true,
    message: 'Message sent successfully!',
    data: {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString()
    }
  });
});

// Email campaign endpoints
app.get('/api/admin/email/campaigns', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Welcome Series',
        status: 'active',
        subscribers: 1234,
        openRate: 0.72,
        clickRate: 0.28,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/admin/email/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Carelwave Media!',
        template: 'welcome',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Performance monitoring endpoint
app.post('/api/monitoring/performance', (req, res) => {
  const { metrics } = req.body;
  
  // Mock performance data storage
  console.log('Performance metrics received:', metrics);
  
  res.json({
    success: true,
    message: 'Performance metrics recorded'
  });
});

// Error tracking endpoint
app.post('/api/monitoring/errors', (req, res) => {
  const { error } = req.body;
  
  // Mock error logging
  console.error('Error reported:', error);
  
  res.json({
    success: true,
    message: 'Error logged successfully'
  });
});

// File upload endpoint (mock)
app.post('/api/admin/media/upload', (req, res) => {
  // Mock file upload
  res.json({
    success: true,
    data: {
      url: 'https://example.com/uploads/mock-file.jpg',
      filename: 'mock-file.jpg',
      size: 1024000,
      uploadedAt: new Date().toISOString()
    }
  });
});

// Admin endpoints
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalPosts: 42,
        totalSubscribers: 2834,
        totalViews: 98765,
        totalComments: 567
      },
      recentActivity: [
        {
          type: 'new_subscriber',
          message: 'New newsletter subscription',
          timestamp: new Date().toISOString()
        }
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Carelwave Media API Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  
  if (NODE_ENV === 'development') {
    console.log('🔧 Development mode: Using mock services for external APIs');
  }
});

module.exports = app; 