import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

// Battle state cache keys
export const BattleKeys = {
  state: (battleId: string) => `battle:${battleId}:state`,
  participants: (battleId: string) => `battle:${battleId}:participants`,
  logs: (battleId: string) => `battle:${battleId}:logs`,
};

// Tournament state cache keys
export const TournamentKeys = {
  state: (tournamentId: string) => `tournament:${tournamentId}:state`,
  bracket: (tournamentId: string) => `tournament:${tournamentId}:bracket`,
};

// Royale state cache keys
export const RoyaleKeys = {
  state: (roomId: string) => `royale:${roomId}:state`,
  participants: (roomId: string) => `royale:${roomId}:participants`,
};

// User session keys
export const SessionKeys = {
  nonce: (walletAddress: string) => `session:${walletAddress}:nonce`,
  token: (walletAddress: string) => `session:${walletAddress}:token`,
};

export default redis;
