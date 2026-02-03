import { useEffect, useRef, useState, useCallback } from 'react';
import { createEchoInstance } from '../config/echo';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for managing WebSocket connections with Laravel Echo/Reverb
 * Provides real-time notification capabilities
 */
export const useWebSocket = () => {
  const { user, isAuthenticated, token } = useAuth();
  const echoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize Echo connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    try {
      // Create new Echo instance
      const echo = createEchoInstance(token);
      echoRef.current = echo;

      // Listen for connection events
      echo.connector.pusher.connection.bind('connected', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      });

      echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      echo.connector.pusher.connection.bind('error', (error) => {
        console.error('WebSocket error:', error);
        setConnectionError(error);
        setIsConnected(false);
      });

      // Cleanup on unmount
      return () => {
        if (echoRef.current) {
          echoRef.current.disconnect();
          echoRef.current = null;
          setIsConnected(false);
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionError(error);
    }
  }, [isAuthenticated, token]);

  /**
   * Subscribe to user-specific private notification channel
   */
  const subscribeToUserNotifications = useCallback((callback) => {
    if (!echoRef.current || !user?.id) return null;

    const channel = echoRef.current.private(`notifications.${user.id}`);
    
    channel
      .listen('.notification.new', (data) => {
        callback({ type: 'notification', data });
      })
      .listen('.booking.status.changed', (data) => {
        callback({ type: 'booking_status', data });
      });

    return () => {
      echoRef.current?.leave(`notifications.${user.id}`);
    };
  }, [user?.id]);

  /**
   * Subscribe to admin notification channel (for admins/coordinators only)
   */
  const subscribeToAdminNotifications = useCallback((callback) => {
    if (!echoRef.current) return null;

    const channel = echoRef.current.private('admin.notifications');
    
    channel
      .listen('.booking.created', (data) => {
        callback({ type: 'new_booking', data });
      })
      .listen('.booking.status.changed', (data) => {
        callback({ type: 'booking_status', data });
      })
      .listen('.inquiry.created', (data) => {
        callback({ type: 'new_inquiry', data });
      });

    return () => {
      echoRef.current?.leave('admin.notifications');
    };
  }, []);

  /**
   * Leave a specific channel
   */
  const leaveChannel = useCallback((channelName) => {
    if (echoRef.current) {
      echoRef.current.leave(channelName);
    }
  }, []);

  /**
   * Disconnect from all channels
   */
  const disconnect = useCallback(() => {
    if (echoRef.current) {
      echoRef.current.disconnect();
      echoRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    connectionError,
    subscribeToUserNotifications,
    subscribeToAdminNotifications,
    leaveChannel,
    disconnect,
    echo: echoRef.current,
  };
};

export default useWebSocket;
