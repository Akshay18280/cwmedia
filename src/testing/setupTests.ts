/**
 * Test Setup Configuration for Carelwave Media
 * Global test configuration, mocks, and utilities
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn().mockImplementation(id => clearTimeout(id));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock Speech Recognition API
const mockSpeechRecognition = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: true,
  interimResults: false,
  lang: 'en-US',
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
}));

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn().mockReturnValue([]),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

// Mock Notification API
const mockNotification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  onclick: null,
  onclose: null,
  onerror: null,
  onshow: null,
  close: jest.fn(),
}));

Object.defineProperty(window, 'Notification', {
  writable: true,
  value: mockNotification,
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted'),
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'mock-endpoint',
          keys: {
            p256dh: 'mock-p256dh',
            auth: 'mock-auth',
          },
          toJSON: jest.fn().mockReturnValue({
            endpoint: 'mock-endpoint',
            keys: {
              p256dh: 'mock-p256dh',
              auth: 'mock-auth',
            },
          }),
          unsubscribe: jest.fn().mockResolvedValue(true),
        }),
        getSubscription: jest.fn().mockResolvedValue(null),
      },
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      sync: {
        register: jest.fn().mockResolvedValue(undefined),
      },
      periodicSync: {
        register: jest.fn().mockResolvedValue(undefined),
      },
    }),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});

// Mock fetch
global.fetch = jest.fn().mockImplementation((url, options) => {
  console.log(`Mock fetch called: ${url}`, options);
  
  // Default mock response
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    blob: jest.fn().mockResolvedValue(new Blob()),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    clone: jest.fn().mockReturnValue(this),
  });
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  error: null,
  onload: null,
  onerror: null,
  onabort: null,
  abort: jest.fn(),
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
  readyState: 0,
}));

// Mock Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn().mockReturnValue('mock-uuid-1234-5678-9012'),
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      sign: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
      verify: jest.fn().mockResolvedValue(true),
      generateKey: jest.fn().mockResolvedValue({}),
      importKey: jest.fn().mockResolvedValue({}),
      exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
      totalJSHeapSize: 2 * 1024 * 1024, // 2MB
      jsHeapSizeLimit: 4 * 1024 * 1024, // 4MB
    },
    navigation: {
      type: 0,
      redirectCount: 0,
    },
    timing: {
      navigationStart: Date.now() - 1000,
      domContentLoadedEventEnd: Date.now() - 500,
      loadEventEnd: Date.now() - 200,
    },
  },
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn().mockReturnValue([]),
}));

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    getByteFrequencyData: jest.fn(),
    fftSize: 256,
    frequencyBinCount: 128,
  }),
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
  }),
  state: 'running',
  suspend: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
}));

global.webkitAudioContext = global.AudioContext;

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([]),
    getSupportedConstraints: jest.fn().mockReturnValue({}),
  },
});

// Mock navigator properties
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  },
});

Object.defineProperty(navigator, 'share', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: jest.fn().mockReturnValue(true),
});

// Mock Firebase (basic mock)
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({}),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({
    user: { uid: 'test-uid', email: 'test@example.com' },
  }),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
    user: { uid: 'test-uid', email: 'test@example.com' },
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
  PhoneAuthProvider: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ test: 'data' }),
  }),
  getDocs: jest.fn().mockResolvedValue({
    docs: [],
    size: 0,
  }),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn().mockReturnValue(new Date()),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn().mockReturnValue({}),
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({
    metadata: { fullPath: 'test-path' },
  }),
  getDownloadURL: jest.fn().mockResolvedValue('https://test-url.com'),
}));

// Console suppression for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress React warnings about useLayoutEffect in test environment
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('useLayoutEffect does nothing on the server')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router') || args[0].includes('deprecated'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  isAdmin: false,
};

export const mockAdmin = {
  uid: 'admin-user-id',
  email: 'admin@carelwavemedia.com',
  displayName: 'Admin User',
  isAdmin: true,
};

export const mockPost = {
  id: 'test-post-id',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Test excerpt',
  content: 'Test content',
  author: 'test-author',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  published: true,
  tags: ['test'],
  categories: ['testing'],
};

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage/sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Global test timeout
jest.setTimeout(30000); 