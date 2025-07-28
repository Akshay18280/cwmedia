/**
 * WebSocket Server for Real-time Features
 * Handles live comments, visitor tracking, and notifications
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for WebSocket
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Initialize WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store connected clients
const clients = new Map();
const rooms = new Map(); // For page-specific subscriptions
const visitors = new Map(); // Track active visitors
const typingUsers = new Map(); // Track typing users per post

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const broadcast = (data, excludeId = null) => {
  const message = JSON.stringify(data);
  clients.forEach((client, id) => {
    if (id !== excludeId && client.readyState === client.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        removeClient(id);
      }
    }
  });
};

const broadcastToRoom = (room, data, excludeId = null) => {
  if (!rooms.has(room)) return;
  
  const message = JSON.stringify(data);
  rooms.get(room).forEach(clientId => {
    if (clientId !== excludeId && clients.has(clientId)) {
      const client = clients.get(clientId);
      if (client.readyState === client.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error broadcasting to room:', error);
          removeClientFromRoom(room, clientId);
        }
      }
    }
  });
};

const removeClient = (clientId) => {
  // Remove from clients
  clients.delete(clientId);
  
  // Remove from all rooms
  rooms.forEach((clientIds, room) => {
    clientIds.delete(clientId);
    if (clientIds.size === 0) {
      rooms.delete(room);
    }
  });
  
  // Remove from visitors
  visitors.delete(clientId);
  
  // Remove from typing users
  typingUsers.forEach((users, postId) => {
    const updated = users.filter(u => u.clientId !== clientId);
    if (updated.length !== users.length) {
      typingUsers.set(postId, updated);
      broadcastToRoom(`post_${postId}`, {
        type: 'user_stopped_typing',
        data: { postId, userId: clientId }
      });
    }
  });
  
  console.log(`Client ${clientId} disconnected. Active clients: ${clients.size}`);
};

const removeClientFromRoom = (room, clientId) => {
  if (rooms.has(room)) {
    rooms.get(room).delete(clientId);
    if (rooms.get(room).size === 0) {
      rooms.delete(room);
    }
  }
};

const joinRoom = (clientId, room) => {
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room).add(clientId);
  console.log(`Client ${clientId} joined room ${room}`);
};

const leaveRoom = (clientId, room) => {
  removeClientFromRoom(room, clientId);
  console.log(`Client ${clientId} left room ${room}`);
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = generateId();
  clients.set(clientId, ws);
  
  // Set client metadata
  ws.clientId = clientId;
  ws.isAlive = true;
  ws.rooms = new Set();
  
  console.log(`Client ${clientId} connected. Active clients: ${clients.size}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    data: { clientId, timestamp: Date.now() }
  }));

  // Message handler
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(clientId, data, ws);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });

  // Pong handler for heartbeat
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Close handler
  ws.on('close', () => {
    removeClient(clientId);
  });

  // Error handler
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    removeClient(clientId);
  });
});

// Message handler
const handleMessage = (clientId, data, ws) => {
  const { type, data: payload } = data;

  switch (type) {
    case 'ping':
      // Respond to ping
      ws.send(JSON.stringify({
        type: 'pong',
        data: { timestamp: payload.timestamp }
      }));
      break;

    case 'auth':
      // Handle authentication
      handleAuth(clientId, payload, ws);
      break;

    case 'join_room':
      // Join a specific room (e.g., page, post)
      joinRoom(clientId, payload.room);
      ws.rooms.add(payload.room);
      break;

    case 'leave_room':
      // Leave a specific room
      leaveRoom(clientId, payload.room);
      ws.rooms.delete(payload.room);
      break;

    case 'visitor_join':
      // Handle visitor joining
      handleVisitorJoin(clientId, payload);
      break;

    case 'visitor_update':
      // Handle visitor update
      handleVisitorUpdate(clientId, payload);
      break;

    case 'visitor_leave':
      // Handle visitor leaving
      handleVisitorLeave(clientId, payload);
      break;

    case 'page_view':
      // Handle page view tracking
      handlePageView(clientId, payload);
      break;

    case 'comment_add':
      // Handle new comment
      handleCommentAdd(clientId, payload);
      break;

    case 'comment_update':
      // Handle comment update
      handleCommentUpdate(clientId, payload);
      break;

    case 'comment_delete':
      // Handle comment deletion
      handleCommentDelete(clientId, payload);
      break;

    case 'comment_like':
      // Handle comment like
      handleCommentLike(clientId, payload);
      break;

    case 'user_typing':
      // Handle typing indicator
      handleUserTyping(clientId, payload);
      break;

    case 'user_stopped_typing':
      // Handle stop typing
      handleUserStoppedTyping(clientId, payload);
      break;

    case 'notification_send':
      // Handle notification sending
      handleNotificationSend(clientId, payload);
      break;

    default:
      console.log(`Unknown message type: ${type}`);
      break;
  }
};

// Message handlers
const handleAuth = (clientId, payload, ws) => {
  ws.userId = payload.userId;
  ws.userToken = payload.token;
  
  console.log(`Client ${clientId} authenticated as user ${payload.userId}`);
  
  // Send auth success
  ws.send(JSON.stringify({
    type: 'auth_success',
    data: { clientId, userId: payload.userId }
  }));
};

const handleVisitorJoin = (clientId, payload) => {
  const visitor = {
    ...payload.visitor,
    clientId,
    joinedAt: new Date(),
    lastSeen: new Date()
  };
  
  visitors.set(clientId, visitor);
  
  // Join page room
  const pageRoom = `page_${visitor.location.page}`;
  joinRoom(clientId, pageRoom);
  
  // Broadcast to page room
  broadcastToRoom(pageRoom, {
    type: 'visitor_joined',
    data: { visitor }
  }, clientId);
  
  // Send visitor stats
  sendVisitorStats();
};

const handleVisitorUpdate = (clientId, payload) => {
  if (visitors.has(clientId)) {
    const visitor = visitors.get(clientId);
    Object.assign(visitor, payload.visitor, { lastSeen: new Date() });
    
    // Broadcast update to relevant rooms
    visitor.rooms?.forEach(room => {
      broadcastToRoom(room, {
        type: 'visitor_updated',
        data: { visitor }
      }, clientId);
    });
  }
};

const handleVisitorLeave = (clientId, payload) => {
  if (visitors.has(clientId)) {
    const visitor = visitors.get(clientId);
    
    // Broadcast leave to page room
    const pageRoom = `page_${visitor.location.page}`;
    broadcastToRoom(pageRoom, {
      type: 'visitor_left',
      data: { visitorId: clientId }
    }, clientId);
    
    visitors.delete(clientId);
  }
  
  sendVisitorStats();
};

const handlePageView = (clientId, payload) => {
  // Track page view
  const pageView = {
    ...payload.pageView,
    clientId,
    timestamp: new Date()
  };
  
  // Join new page room
  const pageRoom = `page_${pageView.page}`;
  joinRoom(clientId, pageRoom);
  
  // Broadcast page view
  broadcastToRoom(pageRoom, {
    type: 'page_view',
    data: { pageView, visitor: payload.visitor }
  }, clientId);
  
  sendVisitorStats();
};

const handleCommentAdd = (clientId, payload) => {
  const comment = {
    ...payload,
    clientId,
    timestamp: new Date()
  };
  
  // Broadcast to post room
  const postRoom = `post_${comment.postId}`;
  broadcastToRoom(postRoom, {
    type: 'comment_added',
    data: comment
  }, clientId);
  
  // Send notification to post author and mentioned users
  sendCommentNotification(comment);
};

const handleCommentUpdate = (clientId, payload) => {
  const postRoom = `post_${payload.postId}`;
  broadcastToRoom(postRoom, {
    type: 'comment_updated',
    data: { ...payload, clientId }
  }, clientId);
};

const handleCommentDelete = (clientId, payload) => {
  const postRoom = `post_${payload.postId}`;
  broadcastToRoom(postRoom, {
    type: 'comment_deleted',
    data: { ...payload, clientId }
  }, clientId);
};

const handleCommentLike = (clientId, payload) => {
  const postRoom = `post_${payload.postId}`;
  broadcastToRoom(postRoom, {
    type: 'comment_liked',
    data: { ...payload, clientId }
  }, clientId);
};

const handleUserTyping = (clientId, payload) => {
  const { postId, userId, userName } = payload;
  
  if (!typingUsers.has(postId)) {
    typingUsers.set(postId, []);
  }
  
  const users = typingUsers.get(postId);
  const existingUser = users.find(u => u.userId === userId);
  
  if (!existingUser) {
    users.push({
      userId,
      userName,
      clientId,
      timestamp: new Date()
    });
  } else {
    existingUser.timestamp = new Date();
  }
  
  // Broadcast to post room
  const postRoom = `post_${postId}`;
  broadcastToRoom(postRoom, {
    type: 'user_typing',
    data: { postId, userId, userName, timestamp: Date.now() }
  }, clientId);
  
  // Auto-cleanup typing after 5 seconds
  setTimeout(() => {
    handleUserStoppedTyping(clientId, { postId, userId });
  }, 5000);
};

const handleUserStoppedTyping = (clientId, payload) => {
  const { postId, userId } = payload;
  
  if (typingUsers.has(postId)) {
    const users = typingUsers.get(postId);
    const filtered = users.filter(u => u.userId !== userId);
    typingUsers.set(postId, filtered);
    
    // Broadcast to post room
    const postRoom = `post_${postId}`;
    broadcastToRoom(postRoom, {
      type: 'user_stopped_typing',
      data: { postId, userId }
    }, clientId);
  }
};

const handleNotificationSend = (clientId, payload) => {
  const notification = {
    ...payload,
    timestamp: new Date()
  };
  
  if (payload.targetUserId) {
    // Send to specific user
    const targetClient = Array.from(clients.entries())
      .find(([id, ws]) => ws.userId === payload.targetUserId);
    
    if (targetClient) {
      targetClient[1].send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
  } else {
    // Broadcast to all authenticated users
    broadcast({
      type: 'notification',
      data: notification
    });
  }
};

// Utility functions
const sendVisitorStats = () => {
  const stats = {
    totalVisitors: visitors.size,
    activeVisitors: visitors.size,
    pageVisitors: {},
    realTimeData: {
      timestamp: new Date(),
      visitors: visitors.size,
      pages: []
    }
  };
  
  // Calculate page visitor counts
  visitors.forEach(visitor => {
    const page = visitor.location?.page || '/';
    stats.pageVisitors[page] = (stats.pageVisitors[page] || 0) + 1;
  });
  
  // Convert to pages array
  stats.realTimeData.pages = Object.entries(stats.pageVisitors)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);
  
  // Broadcast stats
  broadcast({
    type: 'visitor_stats',
    data: { stats }
  });
};

const sendCommentNotification = (comment) => {
  // Create notification for comment
  const notification = {
    type: 'comment',
    title: 'New Comment',
    message: `${comment.authorName} commented on a post`,
    category: 'engagement',
    priority: 'normal',
    actionUrl: `/blog/${comment.postId}#comments`
  };
  
  // Send to all users (in production, filter by subscription preferences)
  broadcast({
    type: 'notification',
    data: notification
  });
};

// Heartbeat to keep connections alive
const heartbeat = () => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      removeClient(ws.clientId);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
};

setInterval(heartbeat, 30000); // Every 30 seconds

// Cleanup typing users periodically
setInterval(() => {
  const now = new Date();
  typingUsers.forEach((users, postId) => {
    const filtered = users.filter(u => {
      const timeDiff = now.getTime() - u.timestamp.getTime();
      return timeDiff < 10000; // Remove if inactive for 10 seconds
    });
    
    if (filtered.length !== users.length) {
      typingUsers.set(postId, filtered);
      // Broadcast updates for users that were removed
      const postRoom = `post_${postId}`;
      users.forEach(u => {
        if (!filtered.includes(u)) {
          broadcastToRoom(postRoom, {
            type: 'user_stopped_typing',
            data: { postId, userId: u.userId }
          });
        }
      });
    }
  });
}, 5000); // Every 5 seconds

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    clients: clients.size,
    rooms: rooms.size,
    visitors: visitors.size,
    uptime: process.uptime()
  });
});

// API endpoint for visitor analytics
app.get('/api/analytics/visitors', (req, res) => {
  const stats = {
    totalVisitors: visitors.size,
    activeVisitors: visitors.size,
    pageVisitors: {},
    demographics: {
      countries: [],
      browsers: [],
      devices: []
    }
  };
  
  // Calculate demographics
  const countries = {};
  const browsers = {};
  const devices = {};
  
  visitors.forEach(visitor => {
    if (visitor.metadata) {
      const country = visitor.metadata.country || 'Unknown';
      const browser = visitor.metadata.browser || 'Unknown';
      const device = visitor.metadata.device || 'Unknown';
      
      countries[country] = (countries[country] || 0) + 1;
      browsers[browser] = (browsers[browser] || 0) + 1;
      devices[device] = (devices[device] || 0) + 1;
    }
    
    const page = visitor.location?.page || '/';
    stats.pageVisitors[page] = (stats.pageVisitors[page] || 0) + 1;
  });
  
  stats.demographics.countries = Object.entries(countries)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
    
  stats.demographics.browsers = Object.entries(browsers)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);
    
  stats.demographics.devices = Object.entries(devices)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
  
  res.json(stats);
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 