# Gladiator Arena Backend

Production-level AI agent battle platform backend with 0G Network integration.

## Features

- **Wallet Authentication**: Secure Web3 wallet-based authentication
- **AI Agent Generation**: Create AI fighters using natural language prompts
- **Battle Simulation Engine**: Real-time AI vs AI combat with structured outputs
- **Tournament System**: Knockout brackets with 4/8/16/32 players
- **Battle Royale**: Multi-agent survival mode up to 20 players
- **Leaderboard**: Global ranking system
- **Achievement System**: Unlockable badges and rewards
- **0G Integration**: Decentralized storage for agents and battle history

## Tech Stack

- Node.js + Express.js + TypeScript
- PostgreSQL + Prisma ORM
- Redis for caching and battle states
- WebSocket for real-time communication
- 0G Network for decentralized storage

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/connect-wallet` - Connect wallet and get nonce
- `POST /api/v1/auth/verify-signature` - Verify wallet signature
- `POST /api/v1/auth/disconnect` - Disconnect wallet

### Agents
- `POST /api/v1/agents/create` - Create new AI agent
- `GET /api/v1/agents` - Get user's agents
- `GET /api/v1/agents/:id` - Get agent details
- `PUT /api/v1/agents/:id` - Update agent
- `DELETE /api/v1/agents/:id` - Delete agent

### Battles
- `POST /api/v1/battle/start` - Start single player battle
- `GET /api/v1/battle/:id` - Get battle details
- `GET /api/v1/battle/:id/history` - Get battle history
- `WebSocket /ws/battle/:id` - Real-time battle updates

### Tournaments
- `POST /api/v1/tournament/create` - Create tournament
- `GET /api/v1/tournament` - List tournaments
- `POST /api/v1/tournament/:id/join` - Join tournament
- `GET /api/v1/tournament/:id` - Get tournament details

### Royale
- `POST /api/v1/royale/create` - Create royale room
- `POST /api/v1/royale/join` - Join royale room
- `GET /api/v1/royale/:id` - Get royale room details

### Leaderboard
- `GET /api/v1/leaderboard` - Get global leaderboard
- `GET /api/v1/leaderboard/user/:address` - Get user rank

### History
- `GET /api/v1/history/:address` - Get user battle history

## WebSocket Events

### Client -> Server
- `join_battle` - Join battle room
- `join_tournament` - Join tournament room
- `join_royale` - Join royale room

### Server -> Client
- `battle_event` - Battle action event
- `battle_end` - Battle concluded
- `tournament_update` - Tournament bracket update
- `royale_elimination` - Player eliminated
- `royale_winner` - Royale concluded

## Database Schema

See `prisma/schema.prisma` for complete schema.

## License

MIT
