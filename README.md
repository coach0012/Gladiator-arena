# Gladiator Arena

An AI battle platform built on the 0G blockchain. Describe a warrior in plain English, an AI model turns that description into a fighter with real stats and abilities, and you send them through a 7-level gauntlet of increasingly difficult AI opponents.

**Live contract:** `0x098A002308Feb8dfF60656F5e85eF94Ba546B6fc` on 0G Mainnet (Aristotle, chain ID 16661)

## What's working today

- **Wallet connect** — real EIP-6963 wallet picker (MetaMask, OKX, Backpack, and any other installed wallet), sign-in via message signature, no mock data
- **AI-powered agent creation** — prompts are parsed by an AI model (OpenRouter, free tier) into real stats, class, personality, and abilities. Vague or unrelated prompts are rejected with feedback instead of silently generating a generic fighter
- **Prompt "power words"** — specific descriptive language in your prompt gives real stat boosts. This is the actual skill expressed in the game, especially at higher levels
- **7-level single-player ladder** — Level 1 is an easy warm-up; levels 4-7 scale up sharply in opponent stats and combat edge. Level 7 is a genuine, rare-to-win challenge
- **Real combat engine** — critical hits, blocks, dodges, and rare last-second "saved" moments, all influenced by fighter stats (speed affects dodge chance, intelligence affects crit chance, etc.)
- **Original warrior artwork** — six class-based SVG avatars (Warrior, Striker, Defender, Assassin, Mage, Tank), each with a signature weapon that swings on attack
- **Battle animation** — lunge/impact animation synced to combat log, floating damage numbers, distinct visual treatment per outcome (crit/block/dodge/save)
- **Procedural sound effects** — hit, block, victory, defeat, and UI sounds, generated at runtime via the Web Audio API (no audio files to host)
- **Real leaderboard** — backed by actual battle/agent data, not mock data
- **On-chain + decentralized storage** — battle results and agent data are written to 0G Storage; the Arena smart contract is live on 0G Mainnet

## Not yet built

- **Knockout Bracket** and **Collective Royale** (multiplayer room-based modes) — UI exists but is disabled with a "coming soon" label; no backend logic yet
- **Persistent database** — currently uses an in-memory store (`backend/src/db/memory.ts`); all data resets when the backend restarts. Prisma/PostgreSQL schema exists but isn't wired up
- **WebSocket live battle streaming** — battles currently compute fully on the backend and replay client-side; no live multiplayer spectating yet

## Tech stack

**Frontend:** React + TypeScript, Vite, Tailwind CSS, Framer Motion
**Backend:** Node.js + Express + TypeScript, in-memory data store
**Blockchain:** 0G Mainnet (Aristotle), Solidity (Foundry), ethers.js
**Storage:** 0G Storage (`@0gfoundation/0g-storage-ts-sdk`)
**AI:** OpenRouter (free-tier models, with keyword-based fallback if unavailable)

## Project structure

```
gladiator-arena/
├── src/                      # Frontend (React + Vite)
│   ├── App.tsx                # Main app — all views and game logic
│   ├── lib/
│   │   ├── api.ts             # Backend API client
│   │   ├── wallet.ts          # EIP-6963 wallet connection
│   │   ├── avatars.tsx        # Original SVG warrior artwork
│   │   ├── sounds.ts          # Procedural sound effects
│   │   └── config.ts          # 0G network + contract config
│   └── index.css              # Cyberpunk theme styling
├── backend/                  # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── routes/            # auth, agents, battle, leaderboard
│   │   ├── services/
│   │   │   ├── agentGenerator.ts   # AI prompt parsing
│   │   │   ├── battleEngine.ts     # Combat simulation + level scaling
│   │   │   └── storage.service.ts  # 0G Storage uploads
│   │   ├── db/memory.ts       # In-memory data store
│   │   └── config/            # Environment validation
│   └── prisma/                # Database schema (not yet wired up)
└── contracts/                 # Solidity smart contracts (Foundry)
    └── src/Arena.sol          # Deployed on 0G Mainnet
```

## Running locally

**Prerequisites:** Node.js 18+, a 0G-funded wallet, an OpenRouter API key (free tier works)

```bash
# Backend
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev             # http://localhost:3001

# Frontend (separate terminal)
cd ..
cp .env.example .env   # fill in contract address
npm install
npm run dev             # http://localhost:5173
```

## Security notes

- Never commit `.env` files — both `backend/.env` and the root `.env` contain real private keys and are gitignored
- `OG_STORAGE_PRIVATE_KEY` should ideally be a separate wallet from your main funds, funded with a small amount, used only for backend storage uploads
- This is a demo/hackathon build — the in-memory database, lack of rate limiting on some endpoints, and synchronous battle computation are known simplifications, not production-ready patterns
