import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// CRITICAL: Pre-import React to ensure it's available before lazy components load
// This prevents "Cannot read properties of null (reading 'useState')" errors
import React from 'react'
// Ensure React is available globally before any imports
if (typeof window !== 'undefined') {
  window.React = React;
}
import App from './App.jsx'
import { ErrorBoundary } from './components/ui'
import './index.css'


// Development cache clearing and Service Worker unregistration logic
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  } else {
    // Unregister any existing service workers in development
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Service Worker unregistered for development');
            // Force reload if we found and unregistered a SW to ensure clean state
            window.location.reload();
          }
        });
      }
    });

    // Clear Cache storage in development
    if (window.caches) {
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
          console.log('Deleted cache storage:', name);
        }
      });
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

