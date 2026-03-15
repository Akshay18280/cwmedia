import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { appConfig } from '@/config/appConfig';

// Firebase configuration - loaded from centralized config
const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
  measurementId: appConfig.firebase.measurementId,
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.warn('🔥 Firebase initialization failed:', error);
  app = null;
}

// Initialize Firebase services
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined' && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}
export { analytics };

export default app;
