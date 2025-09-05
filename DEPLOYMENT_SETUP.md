# Wishing Well Deployment Setup Guide

## Pre-deployment Checklist

### 1. Token Configuration
Before deploying, you need to configure your $WISH token details:

**Update `.env.local`:**
```env
NEXT_PUBLIC_WISH_TOKEN_MINT=your_actual_token_mint_address
NEXT_PUBLIC_WORKER_URL=https://wish-well-worker.your-subdomain.workers.dev
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 2. Pool Wallet Setup
Create a dedicated pool wallet for payouts:

1. Generate a new Solana wallet specifically for payouts
2. Fund it with $WISH tokens for payouts (recommended: at least 1M tokens)
3. Keep the private key secure - you'll need it for the Worker

### 3. Cloudflare Workers Configuration

**Update `wrangler.toml`:**
```toml
[vars]
SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
WISH_TOKEN_MINT = "your_actual_token_mint_address"
BURN_ADDRESS = "11111111111111111111111111111111"
POOL_WALLET_PUBLIC = "your_pool_wallet_public_key"
```

**Set secure environment variables:**
```bash
# Set the pool wallet private key as a secret
wrangler secret put POOL_WALLET_PRIVATE_KEY
# Enter: [1,2,3...] (JSON array of private key bytes)
```

### 4. KV Namespace Setup
Create the required KV namespaces in Cloudflare:

```bash
wrangler kv:namespace create "FOUNTAIN_POOL"
wrangler kv:namespace create "GAMBLE_LOGS"  
wrangler kv:namespace create "USER_STATS"
wrangler kv:namespace create "GAMBLING_SESSIONS"
```

Update `wrangler.toml` with the returned namespace IDs.

## Deployment Steps

### 1. Deploy Cloudflare Worker
```bash
cd "C:\Users\Kimberly\Desktop\Ollie\ClaudeProjects\Wishing Well"
npm run worker:deploy
```

### 2. Deploy Frontend to Cloudflare Pages
```bash
npm run build
# Upload dist/ folder to Cloudflare Pages
# or connect GitHub repo to Cloudflare Pages
```

## Testing the Burn/Payout System

### Development Testing
1. Connect Phantom wallet with test tokens
2. Approach the fountain in the game
3. Click "Throw 1,000 $WISH"
4. Sign the burn transaction
5. Verify payout is received (if won)

### Production Verification
- Monitor Cloudflare Worker logs
- Check burn transactions on Solana Explorer
- Verify payout transactions from pool wallet
- Monitor pool wallet balance

## Security Considerations

1. **Private Key Storage**: Pool wallet private key is stored as encrypted Cloudflare secret
2. **Transaction Verification**: All burns are verified on-chain before payouts
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **Monitoring**: Set up alerts for unusual activity

## Gambling Probabilities (Verified)

The system uses cryptographically secure randomness:
- **Jackpot (15,000x)**: 0.001% chance
- **Major Win (180x)**: ~0.15% chance  
- **Large Win (25x)**: ~0.35% chance
- **Medium Win (9x)**: ~0.5% chance
- **Small Wins**: ~9% combined
- **Break Even**: ~30% chance
- **Lose**: ~60% chance

## Support Commands

```bash
# Check Worker logs
wrangler tail

# Update Worker variables
wrangler secret put VARIABLE_NAME

# Check KV storage
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# View gambling sessions
wrangler kv:key get "session:SESSION_ID" --namespace-id=YOUR_GAMBLING_SESSIONS_ID
```

## Ready for Your Test Token!

The system is now configured to work with any SPL token. Just update the environment variables with your current test token details and deploy!