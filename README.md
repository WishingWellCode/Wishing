# $WISH Wishing Well - Multiplayer Solana Game

A pixel-art multiplayer game where players throw $WISH tokens into a magical fountain for a chance to win big!

## 🎮 Game Features

- **Multiplayer Hub World**: See other players in real-time
- **WASD Movement**: Classic top-down RPG controls
- **Gambling Mechanic**: Throw 1000 $WISH tokens with varying win probabilities
- **Phantom Wallet Integration**: Seamless Solana blockchain connectivity
- **Real-time Updates**: Live fountain pool and winner displays

## 🎲 Gambling Probabilities

- 60% - Lose all tokens
- 39% - Break even or small gain (1000-1500 $WISH)
- 0.5% - Medium win (5,000 $WISH)
- 0.35% - Large win (10,000 $WISH)
- 0.14999% - Major win (100,000 $WISH)
- 0.00001% - JACKPOT (1,000,000 $WISH)

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- GitHub account
- Phantom wallet
- $WISH token contract address

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/wish-wishing-well.git
cd wish-wishing-well
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
- `NEXT_PUBLIC_RPC_URL`: Solana RPC endpoint
- `NEXT_PUBLIC_WORKER_URL`: Your Cloudflare Worker URL
- `NEXT_PUBLIC_WISH_TOKEN_MINT`: $WISH token mint address
- `NEXT_PUBLIC_DEV_WALLET_PUBLIC_KEY`: Dev wallet for payouts

### Cloudflare Worker Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create KV namespaces:
```bash
wrangler kv:namespace create "FOUNTAIN_POOL"
wrangler kv:namespace create "GAMBLE_LOGS"
wrangler kv:namespace create "USER_STATS"
```

4. Update `wrangler.toml` with your KV namespace IDs

5. Deploy the worker:
```bash
npm run worker:deploy
```

### Frontend Deployment

#### GitHub Pages + Cloudflare Pages

1. Push to GitHub:
```bash
git add .
git commit -m "Initial game setup"
git push origin main
```

2. In Cloudflare Dashboard:
   - Go to Pages
   - Create a new project
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set build output: `out`
   - Add environment variables from `.env.local`

3. Deploy will happen automatically on push to main branch

### Development

Run locally:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Worker
npm run worker:dev
```

## 🎨 Adding Art Assets

Place your pixel art assets in the corresponding folders:
- `/public/assets/backgrounds/` - Background images
- `/public/assets/sprites/` - Character and object sprites
- `/public/assets/animations/` - Animation spritesheets
- `/public/assets/ui/` - UI elements

See `ART_ASSETS_REQUIREMENTS.md` for detailed specifications.

## 🔧 Configuration

### Solana Wallet Setup

1. Create a dev wallet for game payouts
2. Fund it with $WISH tokens
3. Store private key securely in Cloudflare secrets:
```bash
wrangler secret put DEV_WALLET_PRIVATE_KEY
```

### Game Settings

Edit `worker/index.js` to adjust:
- Gambling probabilities
- Payout amounts
- Pool management
- Win messages

## 📊 Admin Features

Access game statistics at:
- `/api/stats` - Global game statistics
- `/api/leaderboard` - Player rankings

## 🛠 Tech Stack

- **Frontend**: Next.js, React, Phaser.js
- **Backend**: Cloudflare Workers, Durable Objects
- **Blockchain**: Solana, $WISH token
- **Multiplayer**: WebSockets
- **Styling**: Tailwind CSS

## 🔐 Security

- All random numbers use cryptographic random generation
- Transactions signed client-side via Phantom
- Server validates all gambling attempts
- Rate limiting on Cloudflare Worker

## 📈 Monitoring

Monitor your game via Cloudflare Dashboard:
- Worker analytics
- KV storage usage
- WebSocket connections
- Error logs

## 🐛 Troubleshooting

### Common Issues

1. **Wallet not connecting**: Ensure Phantom is installed and on mainnet
2. **Assets not loading**: Check asset paths match exactly
3. **Worker errors**: Check wrangler logs: `wrangler tail`
4. **WebSocket issues**: Verify Worker URL in environment variables

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🎮 Game Commands

- **WASD** - Move around
- **E** - Interact with fountain
- **ESC** - Open menu (future feature)

## 💰 Token Information

$WISH token details:
- Network: Solana Mainnet
- Launched on: pump.fun
- Contract: [YOUR_TOKEN_ADDRESS]

## 🚦 Roadmap

- [x] Phase 1: Core game with fountain gambling
- [ ] Phase 2: Additional rooms (Inn, Marketplace)
- [ ] Phase 3: Mini-games (Fishing, Quests)
- [ ] Phase 4: NFT avatars
- [ ] Phase 5: Token staking mechanics

---

Built with 💜 for the $WISH community