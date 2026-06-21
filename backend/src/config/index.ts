import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OG_RPC_URL: z.string().default('https://evmrpc.0g.ai'),
  OG_CHAIN_ID: z.string().default('16661'),
  OG_INDEXER_URL: z.string().default('https://indexer-storage-turbo.0g.ai'),
  OG_STORAGE_PRIVATE_KEY: z.string().optional(),
  ARENA_CONTRACT_ADDRESS: z.string().optional(),
  AGENT_NFT_CONTRACT: z.string().optional(),
  BATTLE_CONTRACT: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_MODEL_API_KEY: z.string().optional(),
  AI_MODEL_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  WS_PORT: z.string().default('3002'),
  WS_HEARTBEAT_INTERVAL: z.string().default('30000'),
  BATTLE_TICK_RATE: z.string().default('1500'),
  MAX_BATTLE_ROUNDS: z.string().default('100'),
  ADMIN_WALLET_ADDRESSES: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed — check your .env file against .env.example');
}

const env = parsed.data;

export const config = {
  server: {
    port: parseInt(env.PORT),
    nodeEnv: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  og: {
    rpcUrl: env.OG_RPC_URL,
    chainId: parseInt(env.OG_CHAIN_ID),
    indexerUrl: env.OG_INDEXER_URL,
    storagePrivateKey: env.OG_STORAGE_PRIVATE_KEY,
    contracts: {
      arena: env.ARENA_CONTRACT_ADDRESS,
      agentNft: env.AGENT_NFT_CONTRACT,
      battle: env.BATTLE_CONTRACT,
    },
  },
  ai: {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    openrouterApiKey: env.OPENROUTER_API_KEY,
    apiKey: env.AI_MODEL_API_KEY,
    modelUrl: env.AI_MODEL_URL,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  },
  websocket: {
    port: parseInt(env.WS_PORT),
    heartbeatInterval: parseInt(env.WS_HEARTBEAT_INTERVAL),
  },
  battle: {
    tickRate: parseInt(env.BATTLE_TICK_RATE),
    maxRounds: parseInt(env.MAX_BATTLE_ROUNDS),
  },
  admin: {
    walletAddresses: (env.ADMIN_WALLET_ADDRESSES || '').split(',').filter(Boolean),
  },
};

export type Config = typeof config;
