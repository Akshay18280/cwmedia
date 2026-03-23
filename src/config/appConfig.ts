// Configuration loaded from environment variables.
// For local development, create .env.local with values from .env.example.
// For production, set these in Vercel dashboard → Environment Variables.

export const appConfig = {
  // ─── Firebase Configuration ─────────────────────────────────────
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  },

  // ─── reCAPTCHA Configuration ────────────────────────────────────
  recaptcha: {
    siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  },

  // ─── Twilio SMS Service ─────────────────────────────────────────
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
    phoneNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '',
  },

  // ─── Email Service ──────────────────────────────────────────────
  email: {
    resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
    fromEmail: 'Carelwave Media <noreply@carelwave.com>',
    replyToEmail: 'contact@carelwave.com',
  },

  // ─── Analytics ──────────────────────────────────────────────────
  analytics: {
    gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
    googleAnalyticsPropertyId: import.meta.env.VITE_GA_PROPERTY_ID || '',
    googleAnalyticsServiceKey: '', // DO NOT put service account keys in frontend
    realtimeMeasurementId: import.meta.env.VITE_GA_REALTIME_MEASUREMENT_ID || '',
    realtimeStreamId: import.meta.env.VITE_GA_PROPERTY_ID || '',
  },

  // ─── Site / Domain ──────────────────────────────────────────────
  site: {
    domain: import.meta.env.VITE_SITE_DOMAIN || 'https://carelwave.com',
    title: 'Carelwave Media',
    description: 'Modern content management platform',
  },

  // ─── GitHub ─────────────────────────────────────────────────────
  github: {
    username: 'Akshay18280',
  },

  // ─── Video Services (Optional) ─────────────────────────────────
  video: {
    youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
    youtubeClientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID || '',
    vimeoClientId: import.meta.env.VITE_VIMEO_CLIENT_ID || '',
    vimeoAccessToken: import.meta.env.VITE_VIMEO_ACCESS_TOKEN || '',
  },

  // ─── AI Services ───────────────────────────────────────────────
  ai: {
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    openaiOrgId: import.meta.env.VITE_OPENAI_ORG_ID || '',
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
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
  },

  // ─── Feature Flags ──────────────────────────────────────────────
  // Only enable features that have working configuration.
  // Disabled features are safely skipped at runtime — no crashes.
  features: {
    enablePWA: true,
    enableAnalytics: true,
    enableVoiceCommands: true,
    enableOpenAI: true,
    enableYoutube: false,
    enableVimeo: false,
    enableRecaptcha: false,
    enablePushNotifications: false,
    enableWebSocket: false,
    enableTwilioSMS: false,
    enableResendEmail: true,
    aiLab: true,
    automationLab: true,
    debugMode: false,
  },

  // ─── Admin / IP Auth ───────────────────────────────────────────
  admin: {
    ipAuthEnabled: true,
    allowedIPs: [] as string[],
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
};

// Helper: check if we're in production build
export const isProd = import.meta.env.PROD;
export const isDev = import.meta.env.DEV;
