# 🚀 Wishing Well Token Launch Deployment Checklist

## Pre-Launch Requirements ✅

### 1. Token Contract Deployment
- [ ] Deploy your real $WNDR token on Solana
- [ ] Get the Contract Address (CA) from the deployment
- [ ] Verify token has correct decimals (usually 6 or 9)
- [ ] Test token transfers work correctly

### 2. Wallet Setup
- [ ] Your real dev wallet is funded with SOL for gas fees
- [ ] Your real dev wallet has sufficient $WNDR tokens for payouts
- [ ] Backup your real dev wallet private key securely

## Configuration Updates 🔧

### 3. Update Token Configuration
**File: `config/token.config.js`**
- [ ] Replace `YOUR_REAL_TOKEN_CA_HERE` with your actual token Contract Address
- [ ] Replace `YOUR_REAL_DEV_WALLET_PUBLIC_KEY_HERE` with your real dev wallet public key
- [ ] Change `CURRENT_CONFIG = TOKEN_CONFIG.TESTING` to `TOKEN_CONFIG.PRODUCTION`

### 4. Update Wrangler Configuration  
**File: `wrangler.toml`**
- [ ] Update `WNDR_TOKEN_MINT = "YOUR_REAL_TOKEN_CA"`
- [ ] Update `POOL_WALLET_PUBLIC = "YOUR_REAL_DEV_WALLET_PUBLIC_KEY"`

### 5. Update Cloudflare Worker Secrets
**Run these commands in terminal:**
```bash
# Set your real dev wallet private key
wrangler secret put POOL_WALLET_PRIVATE_KEY
# Enter your base58 private key when prompted
```

### 6. Frontend Token References
**Files to check for hardcoded token addresses:**
- [ ] `src/lib/solanaUtils.ts` - Check for any hardcoded token mint
- [ ] `src/components/WalletConnectionManager.tsx` - Verify token detection
- [ ] Any component that might reference the old test token

## Testing Phase 🧪

### 7. Pre-Production Testing
- [ ] Test gambling mechanism with small amounts
- [ ] Verify burn transactions work
- [ ] Verify payout transactions work  
- [ ] Test wallet connection with your real token
- [ ] Test housing upgrades work
- [ ] Verify leaderboard shows correct data

### 8. Gambling System Tests
- [ ] Test all payout tiers (BUST, BREAK EVEN, WIN, BIG WIN, MEGA WIN, JACKPOT)
- [ ] Verify RNG buckets work correctly (0-9999 system)
- [ ] Check payout amounts are correct (1×, 3×, 5×, 10×, 25×, 100×)
- [ ] Test house boost system works with real tokens

## Deployment Steps 🚀

### 9. Deploy Worker Updates
```bash
# Deploy updated worker with new config
wrangler deploy

# Deploy updated frontend
npm run build
wrangler pages deploy out --project-name="wishing-well"
```

### 10. Verify Deployment
- [ ] Check worker logs for any errors: `wrangler tail wish-well-worker`
- [ ] Test gambling functionality on live site
- [ ] Verify all token transactions work
- [ ] Check multiplayer system works
- [ ] Test all social links work (especially new Telegram link)

## Post-Launch Monitoring 📊

### 11. Monitor Systems
- [ ] Watch Cloudflare Worker logs for errors
- [ ] Monitor token balance in dev wallet
- [ ] Check leaderboard updates correctly
- [ ] Monitor user complaints/feedback
- [ ] Verify Solscan links work for transactions

### 12. Emergency Procedures
- [ ] Know how to quickly disable gambling if needed
- [ ] Have backup dev wallet ready
- [ ] Document how to update token config quickly
- [ ] Plan for potential smart contract issues

## Files That Need Updates 📁

### Critical Files (MUST UPDATE):
1. `config/token.config.js` - Token addresses and config
2. `wrangler.toml` - Worker environment variables  
3. Cloudflare Worker Secrets - Private key via `wrangler secret put`

### Files to Check (MAY NEED UPDATE):
4. `src/lib/solanaUtils.ts` - Token utilities
5. `src/components/WalletConnectionManager.tsx` - Wallet detection
6. `worker/index.js` - Gambling logic (should auto-use new config)

### Recently Updated:
✅ `src/pages/links.tsx` - Updated with Telegram link

## Quick Launch Commands 🏃‍♂️

```bash
# 1. Update config file first, then:

# 2. Set private key secret
wrangler secret put POOL_WALLET_PRIVATE_KEY

# 3. Deploy worker
wrangler deploy

# 4. Build and deploy frontend  
npm run build
wrangler pages deploy out --project-name="wishing-well"

# 5. Monitor logs
wrangler tail wish-well-worker
```

## Troubleshooting 🛠️

### Common Issues:
- **"Invalid token mint"** → Check CA address is correct
- **"Insufficient funds"** → Ensure dev wallet has enough SOL and tokens
- **"Transaction failed"** → Check token decimals and amounts
- **"Payout failed"** → Verify dev wallet private key is set correctly

### Emergency Rollback:
If something breaks, you can quickly revert to test config:
1. Change `CURRENT_CONFIG = TOKEN_CONFIG.TESTING` in `config/token.config.js`
2. Run `wrangler deploy`

---
**⚠️ IMPORTANT**: Test everything thoroughly on a small scale before full launch!