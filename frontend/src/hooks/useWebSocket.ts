/**
 * WebSocket hook for real-time updates.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WSMessage, Transaction } from '../types';
import { WS_URL } from '../utils/constants';

type MessageHandler = (message: WSMessage) => void;

interface UseWebSocketReturn {
  connected: boolean;
  connectionStatus: string;
  sendMessage: (message: Record<string, unknown>) => void;
  subscribe: (handler: MessageHandler) => () => void;
  investigate: (transaction: Transaction) => void;
  lastMessage: WSMessage | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const isConnectingRef = useRef(false);

  // Connect to WebSocket
  useEffect(() => {
    const connect = () => {
      // Prevent multiple simultaneous connections
      if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }
      
      isConnectingRef.current = true;
      
      try {
        setConnectionStatus('Connecting...');
        console.log('Connecting to WebSocket at:', WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          isConnectingRef.current = false;
          setConnected(true);
          setConnectionStatus('Connected');
          console.log('WebSocket connected');
        };

        ws.onclose = (event) => {
          isConnectingRef.current = false;
          setConnected(false);
          setConnectionStatus('Disconnected');
          wsRef.current = null;
          console.log('WebSocket disconnected:', event.code, event.reason);

          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        };

        ws.onerror = (error) => {
          isConnectingRef.current = false;
          console.error('WebSocket error:', error);
          setConnectionStatus('Error');
        };

        ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message.type);
            setLastMessage(message);
            // Notify all handlers
            handlersRef.current.forEach(handler => handler(message));
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        isConnectingRef.current = false;
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('Error');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty deps - only run once on mount

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send:', message);
    }
  }, []);

  // Subscribe to messages - returns unsubscribe function
  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  // Investigate a transaction
  const investigate = useCallback((transaction: Transaction) => {
    console.log('Starting investigation for:', transaction.transaction_id);
    // Send full transaction data for custom transactions (CUSTOM- prefix)
    // or just ID for existing transactions that can be looked up
    const isCustomTransaction = transaction.transaction_id.startsWith('CUSTOM-');
    
    if (isCustomTransaction) {
      sendMessage({ 
        type: 'investigate', 
        transaction_id: transaction.transaction_id,
        transaction_data: {
          transaction_id: transaction.transaction_id,
          timestamp: transaction.timestamp,
          from_account: transaction.from_account,
          to_account: transaction.to_account,
          amount: transaction.amount,
          merchant_category: transaction.merchant_category,
          device_id: transaction.device_id,
          location: transaction.location,
          hour: new Date(transaction.timestamp).getHours(),
          day_of_week: new Date(transaction.timestamp).toLocaleDateString('en-US', { weekday: 'long' }),
          velocity: 1,
          is_fraud: 0,
          fraud_reason: '',
        }
      });
    } else {
      sendMessage({ 
        type: 'investigate', 
        transaction_id: transaction.transaction_id 
      });
    }
  }, [sendMessage]);

  return {
    connected,
    connectionStatus,
    sendMessage,
    subscribe,
    investigate,
    lastMessage,
  };
}
