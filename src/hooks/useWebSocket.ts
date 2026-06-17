import { useState, useEffect, useCallback, useRef } from 'react';
import config from '../lib/config';

type WSEventType = 
  | 'battle_event'
  | 'battle_start'
  | 'battle_end'
  | 'tournament_update'
  | 'tournament_match_start'
  | 'tournament_match_end'
  | 'royale_elimination'
  | 'royale_winner'
  | 'error';

interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: number;
}

type MessageHandler<T = unknown> = (payload: T) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<WSEventType, Set<MessageHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(config.api.wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (event) => {
      setError('WebSocket error');
      console.error('WebSocket error:', event);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        const handlers = handlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message.payload));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const subscribe = useCallback(<T,>(eventType: WSEventType, handler: MessageHandler<T>) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler as MessageHandler);

    return () => {
      handlersRef.current.get(eventType)?.delete(handler as MessageHandler);
    };
  }, []);

  const send = useCallback(<T,>(type: string, payload: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const joinBattle = useCallback((battleId: string) => {
    send('join_battle', { battleId });
  }, [send]);

  const joinTournament = useCallback((tournamentId: string) => {
    send('join_tournament', { tournamentId });
  }, [send]);

  const joinRoyale = useCallback((roomId: string) => {
    send('join_royale', { roomId });
  }, [send]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    send,
    joinBattle,
    joinTournament,
    joinRoyale,
  };
}

export default useWebSocket;
