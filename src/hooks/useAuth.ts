import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import wallet from '../lib/wallet';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  profileImage?: string;
  totalWins: number;
  totalLosses: number;
  arenaPoints: number;
  rank: number;
}

interface AuthState {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  user: User | null;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isConnected: false,
    isLoading: false,
    address: null,
    user: null,
    error: null,
  });

  const checkExistingSession = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await api.getProfile();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          user