// TEMPORARY DEBUG CONFIGURATION
// All environment variables have been hardcoded to eliminate
// deployment configuration issues.
// Once the application is confirmed working, migrate these values
// back to secure environment variables.

export const appConfig = {
  // ─── Firebase Configuration ─────────────────────────────────────
  firebase: {
    apiKey: 'AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck',
    authDomain: 'cw-prod-v2.firebaseapp.com',
    projectId: 'cw-prod-v2',
    storageBucket: 'cw-prod-v2.firebasestorage.app',
    messagingSenderId: '726639239023',
    appId: '1:726639239023:web:b104ea415f7961e346529a',
    measurementId: 'G-C0RZYXB6VL',
  },

  // ─── reCAPTCHA Configuration ────────────────────────────────────
  recaptcha: {
    siteKey: '', // Not yet configured - get from https://www.google.com/recaptcha/admin
  },

  // ─── Twilio SMS Service ─────────────────────────────────────────
  twilio: {
    accountSid: 'ACd5aec9f89c48838e877c775fc2f9d7b5',
    authToken: '', // REQUIRED - get from Twilio Console → Account → Auth Token
    phoneNumber: '+916264507878',
  },

  // ─── Email Service ──────────────────────────────────────────────
  email: {
    resendApiKey: 're_2Xwf15TR_P1L52bsB6qZLxmbZYc8sLAVh',
    fromEmail: 'Carelwave Media <noreply@carelwave.com>',
    replyToEmail: 'contact@carelwave.com',
  },

  // ─── Analytics ──────────────────────────────────────────────────
  analytics: {
    gaMeasurementId: 'G-C0RZYXB6VL',
    googleAnalyticsPropertyId: '11543981244',
    googleAnalyticsServiceKey: '', // DO NOT put service account keys in frontend
    realtimeMeasurementId: 'G-PLQ0H8HTTZ',
    realtimeStreamId: '11543981244',
  },

  // ─── Site / Domain ──────────────────────────────────────────────
  site: {
    domain: 'https://carelwave.com',
    title: 'Carelwave Media',
    description: 'Modern content management platform',
  },

  // ─── GitHub ─────────────────────────────────────────────────────
  github: {
    username: 'Akshay18280',
  },

  // ─── Video Services (Optional - not yet configured) ─────────────
  video: {
    youtubeApiKey: '',
    youtubeClientId: '',
    vimeoClientId: '',
    vimeoAccessToken: '',
  },

  // ─── AI Services ───────────────────────────────────────────────
  ai: {
    openaiApiKey: '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',
    openaiOrgId: '',
    // RAG backend URL — Go API that handles document ingestion + chat
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  },

  // ─── WebSocket ──────────────────────────────────────────────────
  websocket: {
    host: '', // Falls back to window.location.host at runtime
    port: '3001',
  },

  // ─── Push Notifications ─────────────────────────────────────────
  notifications: {
    vapidPublicKey: '',
  },

  // ─── Feature Flags ──────────────────────────────────────────────
  // Only enable features that have working configuration.
  // Disabled features are safely skipped at runtime — no crashes.
  features: {
    enablePWA: true,
    enableAnalytics: true,           // GA measurement ID is configured
    enableVoiceCommands: true,       // Uses browser Web Speech API, no key needed
    enableOpenAI: true,              // OpenAI API key is configured
    enableYoutube: false,            // Feature disabled — YouTube API key not provided
    enableVimeo: false,              // Feature disabled — Vimeo access token not provided
    enableRecaptcha: false,          // Feature disabled — reCAPTCHA site key not provided
    enablePushNotifications: false,  // Feature disabled — VAPID public key not provided
    enableWebSocket: false,          // Feature disabled — no WebSocket server deployed
    enableTwilioSMS: false,          // Feature disabled — Twilio auth token not provided
    enableResendEmail: true,         // Resend API key is configured
    aiLab: true,                     // AI Lab portfolio section — AI Knowledge Copilot demo
    automationLab: true,             // Automation Lab — AI newsroom research + publish pipeline
    debugMode: false,
  },

  // ─── Admin / IP Auth ───────────────────────────────────────────
  admin: {
    ipAuthEnabled: true,
    allowedIPs: [] as string[], // Add your admin IPs here
  },

  // ─── CDN Endpoints ─────────────────────────────────────────────
  cdn: {
    endpoints: [
      'https://cdn1.carelwave.com',
      'https://cdn2.carelwave.com',
      'https://cdn3.carelwave.com',
    ],
    devEndpoint: 'http://localhost:3001',
  },
} as const;

// Helper: check if we're in production build
// Vite still sets import.meta.env.PROD / import.meta.env.DEV at build time.
// These are compile-time constants and NOT environment variables - they are safe.
export const isProd = import.meta.env.PROD;
export const isDev = import.meta.env.DEV;
