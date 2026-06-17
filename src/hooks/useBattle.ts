import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import { useWebSocket } from './useWebSocket';

interface BattleEvent {
  round: number;
  attackerId: string;
  defenderId: string;
  action: string;
  ability: string;
  damage: number;
  effect: string;
  attackerHealth: number;
  defenderHealth: number;
  commentary?: string;
}

interface BattleParticipant {
  agentId: string;
  agentName: string;
  userId: string;
  health: number;
  maxHealth: number;
  status: 'alive' | 'eliminated';
}

interface BattleState {
  id: string;
  status: 'waiting' | 'in-progress' | 'completed';
  round: number;
  participants: BattleParticipant[];
  logs: BattleEvent[];
  winner?: string;
}

export function useBattle(battleId: string | null) {
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { subscribe, joinBattle, isConnected, connect } = useWebSocket();

  const fetchBattle = useCallback(async () => {
    if (!battleId) return;

    setIsLoading(true);
    setError(null);

    const response = await api.getBattle(battleId);
    
    if (response.success && response.data) {
      setBattle(response.data as BattleState);
    } else {
      setError(response.error || 'Failed to fetch battle');
    }

    setIsLoading(false);
  }, [battleId]);

  const startBattle = useCallback(async (agentId: string) => {
    setIsLoading(true);
    setError(null);

    const response = await api.startBattle(agentId);

    if (response.success && response.data) {
      const newBattle = response.data as BattleState;
      setBattle(newBattle);
      
      if (isConnected) {
        joinBattle(newBattle.id);
      }
      
      return newBattle;
    } else {
      setError(response.error || 'Failed to start battle');
      return null;
    }
  }, [isConnected, joinBattle]);

  useEffect(() => {
    if (battleId) {
      fetchBattle();
      
      if (isConnected) {
        joinBattle(battleId);
      }
    }
  }, [battleId, fetchBattle, isConnected, joinBattle]);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      subscribe('battle_event', (payload: unknown) => {
        const event = payload as BattleEvent;
        setBattle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            round: event.round,
            logs: [...prev.logs, event],
            participants: prev.participants.map(p => {
              if (p.agentId === event.attackerId) {
                return { ...p, health: event.attackerHealth };
              }
              if (p.agentId === event.defenderId) {
                return { ...p, health: event.defenderHealth };
              }
              return p;
            }),
          };
        });
      })
    );

    unsubscribers.push(
      subscribe('battle_end', (payload: unknown) => {
        const data = payload as { winner: string };
        setBattle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'completed',
            winner: data.winner,
          };
        });
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  return {
    battle,
    isLoading,
    error,
    startBattle,
    fetchBattle,
  };
}

export default useBattle;
