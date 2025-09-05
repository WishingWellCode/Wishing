// Polyfill Buffer for Cloudflare Workers
if (typeof Buffer === 'undefined') {
  globalThis.Buffer = class Buffer extends Uint8Array {
    constructor(input, encoding) {
      if (typeof input === 'string') {
        const bytes = new TextEncoder().encode(input)
        super(bytes)
      } else if (typeof input === 'number') {
        super(input)
      } else if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
        super(input)
      } else if (Array.isArray(input)) {
        super(input)
      } else {
        super(0)
      }
    }

    static from(input, encoding) {
      return new Buffer(input, encoding)
    }

    static alloc(size) {
      return new Buffer(size)
    }

    static allocUnsafe(size) {
      return new Buffer(size)
    }

    toString(encoding) {
      if (encoding === 'hex') {
        return Array.from(this, byte => byte.toString(16).padStart(2, '0')).join('')
      } else if (encoding === 'base64') {
        return btoa(String.fromCharCode(...this))
      } else {
        return new TextDecoder().decode(this)
      }
    }

    static isBuffer(obj) {
      return obj instanceof Buffer
    }
  }
}

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js'

import { 
  createBurnInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'

// Base58 conversion without Buffer dependency
function base58ToUint8Array(base58String) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const decoded = []
  
  for (let i = 0; i < base58String.length; i++) {
    const char = base58String[i]
    const charIndex = alphabet.indexOf(char)
    
    if (charIndex === -1) {
      throw new Error('Invalid base58 character: ' + char)
    }
    
    let carry = charIndex
    for (let j = 0; j < decoded.length; j++) {
      carry += decoded[j] * 58
      decoded[j] = carry & 0xff
      carry >>= 8
    }
    
    while (carry) {
      decoded.push(carry & 0xff)
      carry >>= 8
    }
  }
  
  // Count leading zeros
  for (let i = 0; i < base58String.length && base58String[i] === '1'; i++) {
    decoded.push(0)
  }
  
  return new Uint8Array(decoded.reverse())
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Handle WebSocket upgrade for multiplayer
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocketUpgrade(request, env)
    }
    
    // Handle API routes
    if (url.pathname === '/api/fountain/start') {
      return handleFountainStart(request, env)
    }
    
    if (url.pathname === '/api/fountain/resolve') {
      return handleFountainResolve(request, env)
    }
    
    if (url.pathname === '/api/fountain/clear') {
      return handleClearSession(request, env)
    }
    
    if (url.pathname === '/api/stats') {
      return handleStats(request, env)
    }
    
    if (url.pathname === '/api/leaderboard') {
      return handleLeaderboard(request, env)
    }
    
    return new Response('Wish Well API', { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}

async function handleWebSocketUpgrade(request, env) {
  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)
  
  await handleWebSocketSession(server, env)
  
  return new Response(null, {
    status: 101,
    webSocket: client
  })
}

async function handleWebSocketSession(websocket, env) {
  websocket.accept()
  
  const playerId = crypto.randomUUID()
  let playerData = null
  
  websocket.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'join':
          playerData = {
            id: playerId,
            walletAddress: message.walletAddress,
            x: 400,
            y: 300,
            sprite: 'player'
          }
          
          // Store player in Durable Object
          const id = env.GAME_STATE.idFromName('main')
          const gameState = env.GAME_STATE.get(id)
          await gameState.fetch(new Request('http://game/addPlayer', {
            method: 'POST',
            body: JSON.stringify(playerData)
          }))
          
          // Send confirmation
          websocket.send(JSON.stringify({
            type: 'joined',
            playerId,
            player: playerData
          }))
          
          // Broadcast to other players
          broadcast(env, {
            type: 'playerJoined',
            player: playerData
          }, playerId)
          break
          
        case 'move':
          if (playerData) {
            playerData.x = message.x
            playerData.y = message.y
            
            broadcast(env, {
              type: 'playerMoved',
              playerId,
              x: message.x,
              y: message.y
            }, playerId)
          }
          break
          
        case 'gamble':
          broadcast(env, {
            type: 'fountainUpdate',
            pool: await getFountainPool(env),
            lastWinners: message.result
          })
          break
      }
    } catch (error) {
      console.error('WebSocket error:', error)
    }
  })
  
  websocket.addEventListener('close', async () => {
    if (playerData) {
      const id = env.GAME_STATE.idFromName('main')
      const gameState = env.GAME_STATE.get(id)
      await gameState.fetch(new Request('http://game/removePlayer', {
        method: 'POST',
        body: JSON.stringify({ playerId })
      }))
      
      broadcast(env, {
        type: 'playerLeft',
        playerId
      }, playerId)
    }
  })
}

async function handleFountainStart(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { walletAddress, clientSeed } = await request.json()
  
  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'Wallet address required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Check for existing pending session
  const existingSession = await env.GAMBLING_SESSIONS.get(`pending:${walletAddress}`)
  if (existingSession) {
    const session = JSON.parse(existingSession)
    // If session is older than 5 minutes, delete it
    if (Date.now() - session.timestamp > 5 * 60 * 1000) {
      await env.GAMBLING_SESSIONS.delete(`pending:${walletAddress}`)
      await env.GAMBLING_SESSIONS.delete(`session:${session.sessionId}`)
    } else {
      return new Response(JSON.stringify({ 
        error: 'Already have pending session',
        sessionId: session.sessionId,
        age: Date.now() - session.timestamp
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
  }

  // Generate server seed and commit
  const serverSeed = crypto.randomUUID() + crypto.randomUUID()
  const serverCommit = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serverSeed))
  const serverCommitHex = Array.from(new Uint8Array(serverCommit))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  // Generate session ID
  const sessionId = crypto.randomUUID()
  
  // Generate client seed if not provided
  const finalClientSeed = clientSeed || crypto.randomUUID()

  // Store session
  const session = {
    sessionId,
    walletAddress,
    serverSeed,
    serverCommit: serverCommitHex,
    clientSeed: finalClientSeed,
    timestamp: Date.now(),
    status: 'pending'
  }

  await env.GAMBLING_SESSIONS.put(`pending:${walletAddress}`, JSON.stringify(session))
  await env.GAMBLING_SESSIONS.put(`session:${sessionId}`, JSON.stringify(session))

  return new Response(JSON.stringify({
    success: true,
    sessionId,
    serverCommit: serverCommitHex,
    clientSeed: finalClientSeed,
    burnAddress: env.BURN_ADDRESS || '11111111111111111111111111111111', // Null address for burn
    exactStake: 1000,
    message: 'Send exactly 1000 $WISH tokens to burn address, then call /resolve'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

async function handleFountainResolve(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { sessionId, txSignature } = await request.json()
  
  if (!sessionId || !txSignature) {
    return new Response(JSON.stringify({ error: 'Session ID and transaction signature required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Get session
  const sessionData = await env.GAMBLING_SESSIONS.get(`session:${sessionId}`)
  if (!sessionData) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  const session = JSON.parse(sessionData)
  
  if (session.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Session already resolved' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Verify burn transaction on Solana
  const connection = new Connection(env.SOLANA_RPC_URL)
  let burnVerified = false
  
  try {
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed'
    })
    
    if (tx && !tx.meta?.err) {
      // TODO: Add more specific verification:
      // 1. Check if transaction burns exactly 1000 tokens
      // 2. Verify burn is from correct wallet
      // 3. Verify token mint matches WISH token
      burnVerified = true
      console.log('✅ Burn transaction verified:', txSignature)
    } else {
      console.log('❌ Burn transaction failed or not found:', txSignature)
    }
  } catch (error) {
    console.error('Error verifying burn transaction:', error)
  }
  
  if (!burnVerified) {
    return new Response(JSON.stringify({ error: 'Burn transaction not verified' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Generate result using commit-reveal
  const result = await calculateGamblingResult(session.serverSeed, session.clientSeed, txSignature)
  
  // Calculate payout
  const payout = Math.floor(1000 * result.multiplier)
  
  // Send payout if won (from pool wallet)
  let payoutTx = null
  if (payout > 0) {
    try {
      console.log(`💰 Attempting to send ${payout} $WISH payout to ${session.walletAddress}`)
      payoutTx = await sendPayout(env, session.walletAddress, payout)
      console.log(`✅ Successfully sent ${payout} $WISH payout: ${payoutTx}`)
    } catch (error) {
      console.error('❌ Failed to send payout:', error.message || error)
      console.error('❌ Full error:', error)
      // Continue without payout - log for manual processing
      payoutTx = 'FAILED_' + crypto.randomUUID()
    }
  }

  // Update session
  session.status = 'resolved'
  session.result = result
  session.payout = payout
  session.payoutTx = payoutTx
  session.burnTx = txSignature
  
  await env.GAMBLING_SESSIONS.put(`session:${sessionId}`, JSON.stringify(session))
  await env.GAMBLING_SESSIONS.delete(`pending:${session.walletAddress}`)

  // Log the gambling event
  await logGambleEvent(env, {
    walletAddress: session.walletAddress,
    timestamp: Date.now(),
    sessionId,
    amountGambled: 1000,
    result: {
      ...result,
      amount: payout
    }
  })

  return new Response(JSON.stringify({
    success: true,
    sessionId,
    serverSeed: session.serverSeed,
    serverCommit: session.serverCommit,
    clientSeed: session.clientSeed,
    burnTx: txSignature,
    payoutTx,
    result: {
      tier: result.tier,
      multiplier: result.multiplier,
      payout,
      message: getResultMessage(result.tier)
    },
    timestamp: Date.now()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

async function calculateGamblingResult(serverSeed, clientSeed, blockHash) {
  // Combine seeds and blockhash for randomness
  const combined = serverSeed + clientSeed + blockHash
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined))
  const hashArray = new Uint8Array(hashBuffer)
  
  // Convert first 8 bytes to float in [0,1)
  let roll = 0
  for (let i = 0; i < 8; i++) {
    roll += hashArray[i] / Math.pow(256, i + 1)
  }
  
  // Apply probability tiers (same as frontend)
  if (roll < 0.0000001) {
    return { tier: 'JACKPOT', multiplier: 15000 }
  } else if (roll < 0.0014999) {
    return { tier: 'MAJOR WIN', multiplier: 180 }
  } else if (roll < 0.0049999) {
    return { tier: 'LARGE WIN', multiplier: 25 }
  } else if (roll < 0.0099999) {
    return { tier: 'MEDIUM WIN', multiplier: 9 }
  } else if (roll < 0.0119999) {
    return { tier: 'SMALL WIN C', multiplier: 1.65 }
  } else if (roll < 0.0199999) {
    return { tier: 'SMALL WIN B', multiplier: 1.28 }
  } else if (roll < 0.0999999) {
    return { tier: 'SMALL WIN A', multiplier: 1.1 }
  } else if (roll < 0.3999999) {
    return { tier: 'BREAK EVEN', multiplier: 1.0 }
  } else {
    return { tier: 'LOSE', multiplier: 0 }
  }
}

async function handleStats(request, env) {
  const stats = await getGlobalStats(env)
  return new Response(JSON.stringify(stats), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

async function handleLeaderboard(request, env) {
  const leaderboard = await getLeaderboard(env)
  return new Response(JSON.stringify(leaderboard), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

async function handleClearSession(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { walletAddress } = await request.json()
  
  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'Wallet address required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Clear any pending session
  const existingSession = await env.GAMBLING_SESSIONS.get(`pending:${walletAddress}`)
  if (existingSession) {
    const session = JSON.parse(existingSession)
    await env.GAMBLING_SESSIONS.delete(`pending:${walletAddress}`)
    await env.GAMBLING_SESSIONS.delete(`session:${session.sessionId}`)
  }

  return new Response(JSON.stringify({ success: true, message: 'Session cleared' }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// Helper functions
async function broadcast(env, message, excludePlayerId = null) {
  // Implementation would send to all connected WebSocket clients
  // except the one specified by excludePlayerId
}

async function getFountainPool(env) {
  const pool = await env.FOUNTAIN_POOL.get('total')
  return parseInt(pool || '0')
}

async function updateFountainPool(env, gambled, won) {
  const current = await getFountainPool(env)
  const newTotal = current + gambled - won
  await env.FOUNTAIN_POOL.put('total', newTotal.toString())
  return newTotal
}

async function logGambleEvent(env, event) {
  const key = `gamble:${event.walletAddress}:${event.timestamp}`
  await env.GAMBLE_LOGS.put(key, JSON.stringify(event))
  
  // Update user stats
  const userKey = `user:${event.walletAddress}`
  const existing = await env.USER_STATS.get(userKey)
  const stats = existing ? JSON.parse(existing) : { 
    totalGambled: 0, 
    totalWon: 0, 
    gamesPlayed: 0,
    biggestWin: 0
  }
  
  stats.totalGambled += event.amountGambled
  stats.totalWon += event.result.amount
  stats.gamesPlayed += 1
  if (event.result.amount > stats.biggestWin) {
    stats.biggestWin = event.result.amount
  }
  
  await env.USER_STATS.put(userKey, JSON.stringify(stats))
}

async function getGlobalStats(env) {
  const pool = await getFountainPool(env)
  // Additional stats would be aggregated from KV storage
  return {
    fountainPool: pool,
    totalGamesPlayed: 0,
    totalWISHGambled: 0,
    biggestWinEver: 0,
    jackpotsWon: 0
  }
}

async function getLeaderboard(env) {
  // Would query and sort user stats from KV storage
  return {
    topWinners: [],
    mostActive: [],
    luckiest: []
  }
}

async function sendPayout(env, recipientWalletAddress, amount) {
  if (!env.POOL_WALLET_PRIVATE_KEY) {
    throw new Error('Pool wallet private key not configured')
  }
  
  const connection = new Connection(env.SOLANA_RPC_URL)
  
  // Create pool wallet keypair from private key
  let poolWalletPrivateKey
  
  // Handle different private key formats
  if (env.POOL_WALLET_PRIVATE_KEY.startsWith('[')) {
    // JSON array format like [1,2,3,...]
    poolWalletPrivateKey = new Uint8Array(JSON.parse(env.POOL_WALLET_PRIVATE_KEY))
  } else {
    // Base58 string format
    poolWalletPrivateKey = base58ToUint8Array(env.POOL_WALLET_PRIVATE_KEY)
  }
  
  const poolWallet = Keypair.fromSecretKey(poolWalletPrivateKey)
  
  // Get token accounts
  const tokenMint = new PublicKey(env.WISH_TOKEN_MINT)
  const recipientWallet = new PublicKey(recipientWalletAddress)
  
  const poolTokenAccount = await getAssociatedTokenAddress(tokenMint, poolWallet.publicKey)
  const recipientTokenAccount = await getAssociatedTokenAddress(tokenMint, recipientWallet)
  
  // Check if recipient token account exists, create if not
  const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount)
  const needsTokenAccount = !recipientAccountInfo
  
  // Create transaction
  const transaction = new Transaction()
  
  // Create recipient token account if needed
  if (needsTokenAccount) {
    console.log(`Creating token account for recipient: ${recipientWalletAddress}`)
    const createAccountInstruction = createAssociatedTokenAccountInstruction(
      poolWallet.publicKey, // payer
      recipientTokenAccount,
      recipientWallet, // owner
      tokenMint
    )
    transaction.add(createAccountInstruction)
  }
  
  // TEMPORARY: Use 6 decimals (most common) until we can query mint info properly in worker
  // TODO: Query mint info once Buffer polyfill is available
  const tokenDecimals = 6 // Most SPL tokens use 6 decimals

  // Add transfer instruction with correct decimals - use BigInt for amount
  const tokenAmount = BigInt(amount * Math.pow(10, tokenDecimals))
  const transferInstruction = createTransferInstruction(
    poolTokenAccount,
    recipientTokenAccount,
    poolWallet.publicKey,
    tokenAmount, // Use BigInt for proper encoding
    [],
    TOKEN_PROGRAM_ID
  )
  
  transaction.add(transferInstruction)
  
  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = poolWallet.publicKey
  
  // Sign and send transaction
  transaction.sign(poolWallet)
  const signature = await connection.sendRawTransaction(transaction.serialize())
  
  // Wait for confirmation
  await connection.confirmTransaction(signature)
  
  return signature
}

function getResultMessage(tier) {
  const messages = {
    jackpot: "🌟 LEGENDARY JACKPOT!!! The fountain grants your ultimate wish! 🌟",
    major: "💎 MAJOR WIN! The spirits favor you greatly! 💎",
    large: "🎉 LARGE WIN! Your wish echoes through the realm! 🎉",
    medium: "✨ MEDIUM WIN! The fountain smiles upon you! ✨",
    small: "🪙 Your coins return with friends! 🪙",
    lose: "The fountain keeps your wishes for now..."
  }
  return messages[tier] || "Unknown result"
}

// Durable Object for game state management
export class GameState {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.players = new Map()
  }

  async fetch(request) {
    const url = new URL(request.url)
    
    if (url.pathname === '/addPlayer') {
      const player = await request.json()
      this.players.set(player.id, player)
      return new Response('OK')
    }
    
    if (url.pathname === '/removePlayer') {
      const { playerId } = await request.json()
      this.players.delete(playerId)
      return new Response('OK')
    }
    
    if (url.pathname === '/getPlayers') {
      return new Response(JSON.stringify(Array.from(this.players.values())))
    }
    
    return new Response('Not found', { status: 404 })
  }
}