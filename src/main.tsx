import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';

import ErrorBoundary from './components/ErrorBoundary';
import { appConfig } from '@/config/appConfig';
import './index.css';

// Service Worker Registration
if ('serviceWorker' in navigator && appConfig.features.enablePWA) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('SW registered: ', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  });
}

// Development logging removed for production

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="bottom-right" />
    </ErrorBoundary>
  </React.StrictMode>
);

// React mount complete

// Hide loading screen once React is ready
setTimeout(() => {
  if ('hideLoadingScreen' in window && typeof window.hideLoadingScreen === 'function') {
    window.hideLoadingScreen();
  }
}, 100);
