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


// Register service worker for caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

