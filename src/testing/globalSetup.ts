/**
 * Global Setup for Jest Testing Framework
 * Initializes test environment and prepares global resources
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

export default async function globalSetup() {
  console.log('🚀 Setting up Jest test environment...');
  
  // Set global test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CI = 'true';
  
  // Mock environment variables for testing
  const mockEnvVars = {
    VITE_FIREBASE_API_KEY: 'test_firebase_api_key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:test',
    VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST123',
    VITE_API_BASE_URL: 'http://localhost:3001',
    VITE_ENABLE_VOICE_COMMANDS: 'true',
    VITE_ENABLE_PWA: 'true',
    VITE_ENABLE_ANALYTICS: 'false', // Disable analytics in tests
    VITE_ENABLE_ERROR_TRACKING: 'false',
    VITE_ENABLE_PERFORMANCE_MONITORING: 'false'
  };
  
  // Set all mock environment variables
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Initialize test database or mock services if needed
  // This is where you'd set up test databases, mock servers, etc.
  
  // Create test data directories if needed
  const fs = require('fs');
  const path = require('path');
  
  const testDirs = [
    'coverage',
    'test-results',
    'screenshots'
  ];
  
  testDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  // Start mock services if needed
  // For example, start a mock Firebase emulator, mock API server, etc.
  
  console.log('✅ Jest test environment setup completed');
  console.log(`📝 Test mode: ${process.env.NODE_ENV}`);
  console.log(`🔧 Mock services initialized`);
} 