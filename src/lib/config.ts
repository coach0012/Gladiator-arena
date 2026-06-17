// 0G Network Configuration
export const config = {
  // 0G Mainnet — Aristotle
  network: {
    chainId: 16661,
    chainName: '0G-Aristotle',
    rpcUrl: 'https://evmrpc.0g.ai',
    blockExplorer: 'https://chainscan.0g.ai',
    nativeCurrency: {
      name: '0G',
      symbol: '0G',
      decimals: 18,
    },
  },
  
  // 0G Testnet — Galileo (for testing)
  testnet: {
    chainId: 16601,
    chainName: '0G Testnet (Galileo)',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    blockExplorer: 'https://chainscan-galileo.0g.ai',
    nativeCurrency: {
      name: '0G',
      symbol: '0G',
      decimals: 18,
    },
  },
  
  // Backend API
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',
  },
  
  // 0G Storage
  storage: {
    indexerUrl: 'https://indexer-storage-turbo.0g.ai',
    kvNodeUrl: 'http://3.101.147.150:6789',
  },
  
  // Contracts (deploy these on 0G)
  contracts: {
    arena: import.meta.env.VITE_ARENA_CONTRACT || '',
    agentNft: import.meta.env.VITE_AGENT_NFT_CONTRACT || '',
    battle: import.meta.env.VITE_BATTLE_CONTRACT || '',
  },
};

export default config;
