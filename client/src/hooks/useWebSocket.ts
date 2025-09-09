import { useState, useEffect, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

export function useWebSocket(url?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Determine WebSocket URL
  const wsUrl = url || (() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  })();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'sample_processed':
              // Handle sample processing completion
              break;
            case 'new_detection':
              // Handle new species detection
              break;
            case 'new_alert':
              // Handle new conservation alert
              break;
            default:
              console.log('Received WebSocket message:', message);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isConnected) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection error");
        setIsConnected(false);
      };

      setSocket(ws);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionError("Failed to connect");
    }
  }, [wsUrl, isConnected]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    connectionError,
    connect,
    disconnect,
    sendMessage
  };
}