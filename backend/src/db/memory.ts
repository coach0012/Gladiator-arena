import { v4 as uuidv4 } from 'uuid';
import type { Agent, Battle, Tournament, RoyaleRoom, User, LeaderboardEntry } from '../types';

class MemoryDatabase {
  private agents: Map<string, Agent> = new Map();
  private battles: Map<string, Battle> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  private royaleRooms: Map<string, RoyaleRoom> = new Map();
  private users: Map<string, User> = new Map();
  private leaderboard: LeaderboardEntry[] = [];

  // Agents
  createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent {
    const newAgent: Agent = {
      ...agent,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.agents.set(newAgent.id, newAgent);
    this.updateLeaderboard();
    return newAgent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgentsByOwner(owner: string): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.owner === owner);
  }

  updateAgent(id: string, updates: Partial<Agent>): Agent | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    const updated = { ...agent, ...updates, updatedAt: Date.now() };
    this.agents.set(id, updated);
    this.updateLeaderboard();
    return updated;
  }

  deleteAgent(id: string): boolean {
    const deleted = this.agents.delete(id);
    if (deleted) this.updateLeaderboard();
    return deleted;
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Battles
  createBattle(battle: Omit<Battle, 'id' | 'createdAt'>): Battle {
    const newBattle: Battle = {
      ...battle,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    this.battles.set(newBattle.id, newBattle);
    return newBattle;
  }

  getBattle(id: string): Battle | undefined {
    return this.battles.get(id);
  }

  updateBattle(id: string, updates: Partial<Battle>): Battle | undefined {
    const battle = this.battles.get(id);
    if (!battle) return undefined;
    const updated = { ...battle, ...updates };
    this.battles.set(id, updated);
    return updated;
  }

  getBattlesByAgent(agentId: string): Battle[] {
    return Array.from(this.battles.values()).filter(
      b => b.players.some(p => p.agentId === agentId)
    );
  }

  // Tournaments
  createTournament(tournament: Omit<Tournament, 'id' | 'createdAt'>): Tournament {
    const newTournament: Tournament = {
      ...tournament,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    this.tournaments.set(newTournament.id, newTournament);
    return newTournament;
  }

  getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  updateTournament(id: string, updates: Partial<Tournament>): Tournament | undefined {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    const updated = { ...tournament, ...updates };
    this.tournaments.set(id, updated);
    return updated;
  }

  getActiveTournaments(): Tournament[] {
    return Array.from(this.tournaments.values()).filter(
      t => t.status === 'waiting' || t.status === 'registration' || t.status === 'in-progress'
    );
  }

  // Royale Rooms
  createRoyaleRoom(room: Omit<RoyaleRoom, 'id' | 'createdAt' | 'code'>): RoyaleRoom {
    const newRoom: RoyaleRoom = {
      ...room,
      id: uuidv4(),
      code: this.generateRoomCode(),
      createdAt: Date.now(),
    };
    this.royaleRooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  getRoyaleRoom(id: string): RoyaleRoom | undefined {
    return this.royaleRooms.get(id);
  }

  getRoyaleRoomByCode(code: string): RoyaleRoom | undefined {
    return Array.from(this.royaleRooms.values()).find(r => r.code === code);
  }

  updateRoyaleRoom(id: string, updates: Partial<RoyaleRoom>): RoyaleRoom | undefined {
    const room = this.royaleRooms.get(id);
    if (!room) return undefined;
    const updated = { ...room, ...updates };
    this.royaleRooms.set(id, updated);
    return updated;
  }

  getActiveRoyaleRooms(): RoyaleRoom[] {
    return Array.from(this.royaleRooms.values()).filter(
      r => r.status === 'waiting' || r.status === 'in-progress'
    );
  }

  // Users
  createUser(address: string): User {
    const user: User = {
      address,
      nonce: this.generateNonce(),
      agents: [],
      stats: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        points: 0,
        tournamentsWon: 0,
        royalesWon: 0,
        highestStreak: 0,
        currentStreak: 0,
      },
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    this.users.set(address, user);
    return user;
  }

  getUser(address: string): User | undefined {
    return this.users.get(address);
  }

  updateUser(address: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(address);
    if (!user) return undefined;
    const updated = { ...user, ...updates, lastLogin: Date.now() };
    this.users.set(address, updated);
    return updated;
  }

  // Leaderboard
  getLeaderboard(limit: number = 100): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  private updateLeaderboard(): void {
    // Exclude AI-controlled enemy agents — they're disposable opponents
    // generated per single-player battle, not real competitors.
    const agents = Array.from(this.agents.values()).filter(a => a.owner !== 'AI');

    const entries: LeaderboardEntry[] = agents.map(agent => ({
      rank: 0,
      userId: agent.owner,
      walletAddress: agent.owner,
      agentId: agent.id,
      agentName: agent.name,
      totalWins: agent.wins,
      totalLosses: agent.losses,
      arenaPoints: agent.points,
      streak: 0,
      tournamentsWon: 0,
    }));

    entries.sort((a, b) => b.arenaPoints - a.arenaPoints);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const db = new MemoryDatabase();
