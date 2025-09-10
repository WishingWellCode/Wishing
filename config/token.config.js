// Token Configuration for Wishing Well
// Update these values when launching with your real token

const TOKEN_CONFIG = {
  // IMPORTANT: Update these values for production launch
  PRODUCTION: {
    // Your real token contract address (CA)
    WISH_TOKEN_MINT: "DgSwxG6JdFn8CZWqkJpRbmeaHZ11UUg2KmJ4btanpump",
    
    // Your real dev wallet public key
    POOL_WALLET_PUBLIC: "3A16eieUnz9tSjCwS528MLdoE6uuqJMqL7hQaQs5qYDu",
    
    // Solana RPC (keep current or update if needed)
    SOLANA_RPC_URL: "https://solana-mainnet.g.alchemy.com/v2/SYEG70FAIl_t9bDEkh4ki",
    
    // Burn address (standard Solana burn address - don't change)
    BURN_ADDRESS: "11111111111111111111111111111111"
  },
  
  // Current test configuration (for reference)
  TESTING: {
    WISH_TOKEN_MINT: "4ijaKXxNvEurES66hFsRqLysz9YK2grAMA1Aj...",
    POOL_WALLET_PUBLIC: "8i8xRFD3HoQzgY623r2K88rWdqjKxUPczSRFT...",
    SOLANA_RPC_URL: "https://solana-mainnet.g.alchemy.com/v2/SYEG70FAIl_t9bDEkh4ki",
    BURN_ADDRESS: "11111111111111111111111111111111"
  }
}

// Export current config (change to PRODUCTION when ready to launch)
const CURRENT_CONFIG = TOKEN_CONFIG.PRODUCTION // Switched to PRODUCTION for launch

module.exports = {
  TOKEN_CONFIG,
  CURRENT_CONFIG,
  
  // Helper function to validate config
  validateConfig: (config) => {
    const required = ['WISH_TOKEN_MINT', 'POOL_WALLET_PUBLIC', 'SOLANA_RPC_URL', 'BURN_ADDRESS']
    const missing = required.filter(key => !config[key] || config[key].includes('YOUR_REAL'))
    
    if (missing.length > 0) {
      console.error('❌ Missing required config values:', missing)
      return false
    }
    
    console.log('✅ Token config validation passed')
    return true
  }
}