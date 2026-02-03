import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally (required by Laravel Echo)
window.Pusher = Pusher;

/**
 * Create and configure Laravel Echo instance for real-time WebSocket connections
 * Uses Laravel Reverb as the WebSocket server
 */
export const createEchoInstance = (authToken) => {
  // Get configuration from environment or use defaults
  const wsHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
  const wsPort = import.meta.env.VITE_REVERB_PORT || 8080;
  const wsScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
  const appKey = import.meta.env.VITE_REVERB_APP_KEY || 'dreams-key-local';
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const echo = new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wsPort,
    forceTLS: wsScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${apiUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    },
  });

  return echo;
};

export default createEchoInstance;
