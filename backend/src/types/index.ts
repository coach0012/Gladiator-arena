import { Request } from 'express';

// User Types
export interface UserPayload {
  id: string;
  walletAddress: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Agent Types
export type AgentClass = 'Warrior' | 'Striker' | 'Defender' | 'Assassin' | 'Mage' | 'Tank';
export type CombatStyle = 'Aggressive' | 'Defensive' | 'Balanced' | 'Tactical' | 'Berserker' | 'Strategic';

export interface AgentStats {
  strength: number;
  defense: number;
  speed: number;
  intelligence: number;
}

export interface CreateAgentDto {
  name: string;
  prompt: string;
  avatar: string;
}

export interface GeneratedAgent {
  name: string;
  class: AgentClass;
  personality: string;
  combatStyle: CombatStyle;
  stats: AgentStats;
  specialAbility: string;
  abilities: string[];
  weaknesses: string[];
}

export interface Agent {
  id: string;
  name: string;
  class: AgentClass;
  personality: string;
  combatStyle: CombatStyle;
  stats: AgentStats;
  specialAbility: string;
  avatar: string;
  owner: string;
  wins: number;
  losses: number;
  points: number;
  createdAt: number;
  updatedAt: number;
}

export type BattleType = 'single' | 'tournament' | 'royale';
export type BattleStatus = 'waiting' | 'in-progress' | 'completed';
export type BattleAction = 'attack' | 'defend' | 'special' | 'dodge' | 'counter';

export interface BattleEvent {
  round: number;
  attackerId: string;
  defenderId: string;
  action: BattleAction;
  ability: string;
  damage: number;
  effect: string;
  attackerHealth: number;
  defenderHealth: number;
  commentary?: string;
  animationData?: AnimationData;
}

export interface AnimationData {
  type: string;
  source: string;
  target: string;
  effect: string;
  duration: number;
}

export interface BattleState {
  battleId: string;
  status: BattleStatus;
  round: number;
  participants: BattleParticipantState[];
  logs: BattleEvent[];
  winner?: string;
}

export interface BattleParticipantState {
  agentId: string;
  userId: string;
  health: number;
  maxHealth: number;
  status: 'alive' | 'eliminated';
}

export interface BattlePlayer {
  agentId: string;
  owner: string;
  health: number;
  maxHealth: number;
  status: 'alive' | 'eliminated';
}

export interface BattleLog {
  round: number;
  attacker: string;
  defender: string;
  action: BattleAction;
  ability: string;
  damage: number;
  effectTag: 'critical' | 'blocked' | 'dodged' | 'saved' | 'normal';
  effect: string;
  attackerHealth: number;
  defenderHealth: number;
  timestamp: number;
}

export interface Battle {
  id: string;
  type: BattleType;
  status: BattleStatus;
  players: BattlePlayer[];
  logs: BattleLog[];
  winner: string | null;
  createdAt: number;
  endedAt: number | null;
}

export type TournamentStatus = 'waiting' | 'registration' | 'in-progress' | 'completed';

export interface CreateTournamentDto {
  name: string;
  playerCount: 4 | 8 | 16 | 32;
  description?: string;
  entryFee?: number;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  currentRound: number;
  champion?: string;
}

export interface TournamentRound {
  round: number;
  matches: TournamentMatchData[];
}

export interface TournamentMatchData {
  matchId: string;
  player1?: string;
  player2?: string;
  winner?: string;
  status: 'pending' | 'ready' | 'in-progress' | 'completed';
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  playerCount: 4 | 8 | 16 | 32;
  status: TournamentStatus;
  bracket: TournamentBracket;
  participants: string[];
  createdAt: number;
}

export type RoyaleStatus = 'waiting' | 'in-progress' | 'completed';

export interface CreateRoyaleDto {
  name: string;
  maxPlayers: number;
}

export interface JoinRoyaleDto {
  code: string;
  agentId: string;
}

export interface RoyaleState {
  roomId: string;
  status: RoyaleStatus;
  participants: RoyaleParticipantState[];
  aliveCount: number;
  winner?: string;
}

export interface RoyaleParticipantState {
  agentId: string;
  userId: string;
  status: 'alive' | 'eliminated';
  placement?: number;
  kills: number;
}

export interface RoyaleRoom {
  id: string;
  code: string;
  name: string;
  maxPlayers: number;
  status: RoyaleStatus;
  participants: RoyaleParticipantState[];
  winner?: string;
  createdAt: number;
}

export interface UserStats {
  totalBattles: number;
  wins: number;
  losses: number;
  points: number;
  tournamentsWon: number;
  royalesWon: number;
  highestStreak: number;
  currentStreak: number;
}

export interface User {
  address: string;
  nonce: string;
  agents: string[];
  stats: UserStats;
  createdAt: number;
  lastLogin: number;
}

export type WSEventType = 
  | 'battle_event'
  | 'battle_start'
  | 'battle_end'
  | 'tournament_update'
  | 'tournament_match_start'
  | 'tournament_match_end'
  | 'royale_elimination'
  | 'royale_winner'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  walletAddress: string;
  username?: string;
  agentId?: string;
  agentName?: string;
  totalWins: number;
  totalLosses: number;
  arenaPoints: number;
  tournamentsWon?: number;
  streak?: number;
}

export interface AchievementDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt?: Date;
}
