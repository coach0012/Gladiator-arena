import config from './config';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth
  async connectWallet(walletAddress: string) {
    return this.request<{ nonce: string }>('/auth/connect-wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verifySignature(walletAddress: string, signature: string) {
    const response = await this.request<{ token: string; user: unknown }>('/auth/verify-signature', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    });
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async disconnect() {
    const response = await this.request('/auth/disconnect', { method: 'POST' });
    this.setToken(null);
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Agents
  async createAgent(data: { name: string; prompt: string; avatar: string }) {
    return this.request('/agents/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgents() {
    return this.request('/agents');
  }

  async getAgent(id: string) {
    return this.request(`/agents/${id}`);
  }

  async deleteAgent(id: string) {
    return this.request(`/agents/${id}`, { method: 'DELETE' });
  }

  // Battles
  async startBattle(agentId: string, level: number = 1) {
    return this.request('/battle/start', {
      method: 'POST',
      body: JSON.stringify({ agentId, level }),
    });
  }

  async getBattle(id: string) {
    return this.request(`/battle/${id}`);
  }

  async getBattleHistory(address: string) {
    return this.request(`/history/${address}`);
  }

  // Tournaments
  async createTournament(data: { name: string; playerCount: number; description?: string }) {
    return this.request('/tournament/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTournaments() {
    return this.request('/tournament');
  }

  async getTournament(id: string) {
    return this.request(`/tournament/${id}`);
  }

  async joinTournament(id: string, agentId: string) {
    return this.request(`/tournament/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  // Royale
  async createRoyale(data: { name: string; maxPlayers: number }) {
    return this.request('/royale/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinRoyale(data: { code: string; agentId: string }) {
    return this.request('/royale/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRoyale(id: string) {
    return this.request(`/royale/${id}`);
  }

  // Leaderboard
  async getLeaderboard(limit: number = 100) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  async getUserRank(address: string) {
    return this.request(`/leaderboard/user/${address}`);
  }

  // Achievements
  async getAchievements() {
    return this.request('/achievements');
  }
}

export const api = new ApiService();
export default api;
