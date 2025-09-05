// Configuration for testing vs production
export const CONFIG = {
  // For testing, use devnet and test tokens
  IS_TESTNET: process.env.NEXT_PUBLIC_NETWORK === 'devnet',
  
  // Token decimals (adjust based on your token)
  TOKEN_DECIMALS: 9,
  
  // Gambling amount in base units
  GAMBLE_AMOUNT: 1000,
  
  // For testing without real tokens
  MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  
  // RPC endpoint
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
  
  // Worker URL
  WORKER_URL: process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787',
}

// For testing without tokens
export const MOCK_WALLET = {
  balance: 10000,
  address: '11111111111111111111111111111111',
}