/**
 * Environment Setup for Jest Testing
 * Configures environment variables and global settings for tests
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_FIREBASE_API_KEY = 'test_firebase_api_key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:test';
process.env.VITE_FIREBASE_MEASUREMENT_ID = 'G-TEST123';

// Feature flags for testing
process.env.VITE_ENABLE_VOICE_COMMANDS = 'true';
process.env.VITE_ENABLE_PWA = 'true';
process.env.VITE_ENABLE_ANALYTICS = 'true';
process.env.VITE_ENABLE_ERROR_TRACKING = 'false'; // Disable in tests
process.env.VITE_ENABLE_PERFORMANCE_MONITORING = 'false'; // Disable in tests

// API configuration for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3001';
process.env.VITE_SITE_URL = 'http://localhost:3000';

// Mock service configurations
process.env.VITE_TWILIO_ACCOUNT_SID = 'test_twilio_sid';
process.env.VITE_TWILIO_AUTH_TOKEN = 'test_twilio_token';
process.env.VITE_TWILIO_PHONE_NUMBER = '+15551234567';
process.env.VITE_RESEND_API_KEY = 'test_resend_key';

// Security keys for testing
process.env.VITE_SECRET_KEY = 'test_secret_key_for_testing_only';
process.env.VITE_JWT_SECRET = 'test_jwt_secret_for_testing_only';

// Disable console warnings in tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // Allow specific warnings that are useful in tests
  if (
    typeof args[0] === 'string' && 
    !args[0].includes('React Router') &&
    !args[0].includes('deprecated') &&
    !args[0].includes('Warning: ')
  ) {
    originalWarn.apply(console, args);
  }
};

console.error = (...args) => {
  // Allow errors but filter out known test-related warnings
  if (
    typeof args[0] === 'string' && 
    !args[0].includes('Warning: ') &&
    !args[0].includes('validateDOMNesting')
  ) {
    originalError.apply(console, args);
  }
};

// Global test configuration
global.testConfig = {
  timeout: 30000,
  retries: 2,
  verbose: process.env.JEST_VERBOSE === 'true'
};

// Performance mark for test timing
if (typeof performance !== 'undefined') {
  performance.mark('jest-setup-start');
}

console.log('🧪 Jest environment setup completed'); 