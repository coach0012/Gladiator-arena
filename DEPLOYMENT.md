# Gladiator Arena - 0G Mainnet Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database
3. Redis server
4. MetaMask or compatible Web3 wallet
5. 0G tokens for gas fees

## Step 1: Deploy Smart Contracts to 0G

### Install Foundry (if not installed)
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Deploy Contracts

This repo does not yet include a `contracts/` folder — you need to create
one with your Arena/AgentNFT/Battle Solidity contracts before this step
will work. A minimal starting point:

```bash
mkdir contracts && cd contracts
forge init --no-git
# write contracts/src/Arena.sol
forge build
forge create --rpc-url https://evmrpc.0g.ai --private-key YOUR_PRIVATE_KEY src/Arena.sol:Arena
```

Note the deployed contract addresses and add them to your `.env` files.

## Step 2: Backend Deployment

### Environment Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your production values
```

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:5432/gladiator_arena
REDIS_URL=redis://host:6379
JWT_SECRET=your-secure-jwt-secret-min-32-chars
OG_RPC_URL=https://evmrpc.0g.ai
OG_CHAIN_ID=16661
OG_INDEXER_URL=https://indexer-storage-turbo.0g.ai
OG_STORAGE_PRIVATE_KEY=your-funded-wallet-private-key
ARENA_CONTRACT_ADDRESS=0x...
```

Note: the current app uses an in-memory store (`backend/src/db/memory.ts`)
as the actual source of truth for users, agents, and battles — not the
Prisma/PostgreSQL schema. `DATABASE_URL` and the Prisma migrate step below
only matter once you finish migrating auth and routes over to Prisma. Until
then, data resets on every server restart.

### Deploy Backend
```bash
npm install
npm run db:generate
npm run db:migrate
npm run build
npm start
```

## Step 3: Frontend Deployment

### Environment Setup
```bash
cd ..
cp .env.example .env
# Edit .env with production API URLs and contract addresses
```

### Build and Deploy
```bash
npm install
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- IPFS (for decentralized hosting)

## Step 4: 0G Storage Integration

### Upload Agent Data
When agents are created, their data is automatically uploaded to 0G Storage:

```typescript
import { storageService } from './services/storage.service';

const hash = await storageService.uploadAgent(agentData);
// Returns: { hash: "0x...", size: 1234, timestamp: 1234567890 }
```

### Retrieve Agent Data
```typescript
const result = await storageService.download(hash);
const agent = result.data;
```

## Step 5: Verify Deployment

1. Connect wallet on your deployed frontend
2. Ensure wallet is connected to 0G Mainnet (Chain ID: 16661)
3. Create an agent
4. Start a battle
5. Check data is stored on 0G Storage

## Production Checklist

- [ ] PostgreSQL database configured
- [ ] Redis server running
- [ ] Environment variables set
- [ ] Smart contracts deployed to 0G
- [ ] Backend API running
- [ ] WebSocket server running
- [ ] Frontend deployed
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Error monitoring set up
- [ ] Database backups configured

## Monitoring

### Health Check Endpoints
- `GET /api/v1/health` - API health
- `GET /api/v1/health/db` - Database connection
- `GET /api/v1/health/redis` - Redis connection

### Logs
Logs are written to `logs/combined.log` and `logs/error.log`

## Scaling

### Horizontal Scaling
- Use PM2 or Kubernetes for multiple backend instances
- Use Redis pub/sub for WebSocket synchronization
- Use a load balancer (nginx, AWS ALB)

### Database Scaling
- Use read replicas for leaderboard queries
- Implement connection pooling
- Consider sharding for large user bases

## Security

1. Never expose private keys
2. Use environment variables for secrets
3. Enable rate limiting
4. Validate all inputs
5. Use HTTPS everywhere
6. Implement CORS properly
7. Regular security audits

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Discord: [your-discord]
- Twitter: @GladiatorArena
