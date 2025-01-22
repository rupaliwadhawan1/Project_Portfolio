import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketHookOptions {
  url: string;
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
  maxRetries?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectInterval = 5000,
  maxRetries = 3,
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (retriesRef.current < maxRetries) {
          retriesRef.current += 1;
          setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError(new Error('WebSocket error'));
        ws.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
    }
  }, [url, onMessage, reconnectInterval, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, error, send };
}