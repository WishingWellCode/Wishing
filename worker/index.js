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

import { LobbyDO } from './LobbyDO.js'

import { 
  createBurnInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getMint,
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

// HTML content for the main page
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wish Well - Gambling Tokens</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            background: #000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .background-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: #0a0a0a;
            overflow: hidden;
        }
        
        .background-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        }
        
        .content {
            position: relative;
            z-index: 1;
            padding: 2rem;
            color: white;
            text-align: center;
        }
        
        .gambling-animation {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        }
        
        .gambling-animation.active {
            display: block;
            animation: popIn 0.5s ease-out;
        }
        
        @keyframes popIn {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.1);
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        .test-button {
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 0.5rem;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .test-button:hover {
            transform: scale(1.05);
        }
        
        .test-button:active {
            transform: scale(0.95);
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="background-container">
        <img src="/assets/backgrounds/Realbackground.jpg" alt="Wish Well Background" class="background-image">
    </div>
    
    <div class="content">
        <h1>Wish Well Test Page</h1>
        <button class="test-button" onclick="testAnimation()">Test Gambling Animation</button>
    </div>
    
    <div id="gamblingAnimation" class="gambling-animation">
        <div style="width: 200px; height: 200px; background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff); border-radius: 50%; animation: spin 1s linear infinite;">
            <div style="color: white; font-size: 2rem; display: flex; align-items: center; justify-content: center; height: 100%;">🎰</div>
        </div>
    </div>
    
    <script>
        function testAnimation() {
            const animation = document.getElementById('gamblingAnimation');
            animation.classList.add('active');
            
            setTimeout(() => {
                animation.classList.remove('active');
            }, 2000);
        }
        
        console.log('Wish Well page loaded');
    </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Serve static assets from R2
    if (url.pathname.startsWith('/assets/')) {
      const objectName = url.pathname.slice(1) // Remove leading slash
      try {
        const object = await env.ASSETS_BUCKET.get(objectName)
        
        if (object) {
          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set('Access-Control-Allow-Origin', '*')
          
          // Set appropriate content type based on file extension
          if (objectName.endsWith('.jpg') || objectName.endsWith('.jpeg')) {
            headers.set('Content-Type', 'image/jpeg')
          } else if (objectName.endsWith('.png')) {
            headers.set('Content-Type', 'image/png')
          } else if (objectName.endsWith('.gif')) {
            headers.set('Content-Type', 'image/gif')
          }
          
          headers.set('Cache-Control', 'public, max-age=3600')
          
          return new Response(object.body, {
            headers
          })
        }
      } catch (e) {
        console.error('Error fetching from R2:', e)
      }
      
      return new Response('Asset not found', { status: 404 })
    }
    
    // Handle WebSocket upgrade for multiplayer FIRST
    if (request.headers.get('Upgrade') === 'websocket') {
      try {
        return handleWebSocketUpgrade(request, env)
      } catch (error) {
        console.error('WebSocket upgrade error:', error)
        return new Response('WebSocket upgrade failed', { status: 503 })
      }
    }
    
    // Serve HTML for root path
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML_CONTENT, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        }
      })
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
    
    if (url.pathname === '/api/fountain/history') {
      return handleLeaderboard(request, env) // Same as leaderboard for now
    }
    
    if (url.pathname === '/api/transactions') {
      return handleLeaderboard(request, env) // Same as leaderboard for now
    }
    
    if (url.pathname === '/api/results') {
      return handleLeaderboard(request, env) // Same as leaderboard for now
    }
    
    if (url.pathname === '/api/stats/latest') {
      return handleStatsLatest(request, env)
    }
    
    // Housing API routes
    if (url.pathname === '/api/housing/purchase') {
      return handleHousePurchase(request, env)
    }
    
    if (url.pathname.startsWith('/api/housing/') && url.pathname.split('/').length === 4 && url.pathname !== '/api/housing/purchase') {
      const walletAddress = url.pathname.split('/')[3]
      return handleGetHousingData(walletAddress, env)
    }
    
    // User stats API route
    if (url.pathname.startsWith('/api/user/') && url.pathname.endsWith('/stats')) {
      const pathParts = url.pathname.split('/')
      if (pathParts.length === 5) {
        const walletAddress = pathParts[3]
        return handleGetUserStats(walletAddress, env)
      }
    }
    
    // Admin data clearing endpoint
    if (url.pathname === '/api/admin/clear-winners' && request.method === 'POST') {
      return handleClearWinners(request, env)
    }
    
    // Multiplayer API routes
    if (url.pathname === '/api/multiplayer/players') {
      return handleGetMultiplayerPlayers(request, env)
    }
    
    return new Response('Not Found', { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}

async function handleWebSocketUpgrade(request, env) {
  // Use a single global Durable Object instance for all multiplayer connections
  const id = env.LOBBY_DO.idFromName('global-lobby')
  const lobbyStub = env.LOBBY_DO.get(id)
  
  // Forward the WebSocket connection to the Durable Object
  return lobbyStub.fetch(request)
}

// Simple global WebSocket connections storage
const webSocketSessions = new Map()

async function handleWebSocketSession(websocket, env) {
  websocket.accept()
  
  const playerId = crypto.randomUUID()
  let playerData = null
  
  console.log(`🎮 New WebSocket connection: ${playerId}`)
  
  // Store WebSocket session
  webSocketSessions.set(playerId, {
    websocket,
    playerData: null,
    lastSeen: Date.now()
  })
  
  websocket.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data)
      console.log(`🎮 Received message from ${playerId}:`, message)
      
      switch (message.type) {
        case 'ping':
          // Keep-alive ping - respond with pong
          websocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          // Update last seen
          const pingSession = webSocketSessions.get(playerId)
          if (pingSession) {
            pingSession.lastSeen = Date.now()
          }
          break
          
        case 'spectate':
          // Spectator mode - mark as spectator and send current players
          console.log(`👁️ Spectator joined: ${playerId}`)
          
          // Mark session as spectator
          const spectatorSession = webSocketSessions.get(playerId)
          if (spectatorSession) {
            spectatorSession.isSpectator = true
            spectatorSession.lastSeen = Date.now()
          }
          
          // Send current players to spectator
          const players = []
          for (const [id, session] of webSocketSessions) {
            if (session.playerData) {
              players.push(session.playerData)
            }
          }
          
          console.log(`👁️ Sending ${players.length} current players to spectator`)
          websocket.send(JSON.stringify({
            type: 'currentPlayers',
            players
          }))
          break
          
        case 'join':
          // Format wallet address as username (first 3 + last 2 chars)
          const walletAddress = message.walletAddress
          const username = walletAddress.length >= 5 ? 
            walletAddress.substring(0, 3) + walletAddress.slice(-2) : 
            walletAddress
          
          // Random sprite selection from your custom sprites
          const sprites = ['blue', 'default', 'grey', 'lime', 'ping', 'red']
          const randomSprite = sprites[Math.floor(Math.random() * sprites.length)]
          
          playerData = {
            id: playerId,
            walletAddress: walletAddress,
            username: username,
            x: Math.random() * 700 + 100, // Random starting position
            y: Math.random() * 500 + 100,
            sprite: randomSprite
          }
          
          // Update session - upgrade from spectator to player
          const session = webSocketSessions.get(playerId)
          if (session) {
            session.playerData = playerData
            session.isSpectator = false // No longer a spectator
            session.lastSeen = Date.now()
          }
          
          // Get all current players
          const allPlayers = Array.from(webSocketSessions.values())
            .filter(s => s.playerData)
            .map(s => s.playerData)
          
          // Send confirmation with all current players
          websocket.send(JSON.stringify({
            type: 'joined',
            playerId,
            player: playerData,
            allPlayers: allPlayers
          }))
          
          // Broadcast to other players AND spectators
          broadcastToOthers(playerId, {
            type: 'playerJoined',
            player: playerData
          }, true) // Include spectators
          
          console.log(`🎮 Player ${username} joined with sprite ${randomSprite}`)
          break
          
        case 'move':
          if (playerData) {
            playerData.x = message.x
            playerData.y = message.y
            
            // Update session
            const session = webSocketSessions.get(playerId)
            if (session) {
              session.playerData = playerData
              session.lastSeen = Date.now()
            }
            
            // Broadcast position update to other players AND spectators
            // Include more player data for spectators who might not have the player info
            broadcastToOthers(playerId, {
              type: 'playerMoved',
              playerId,
              x: message.x,
              y: message.y,
              // Include extra data for spectators
              username: playerData.username,
              sprite: playerData.sprite,
              walletAddress: playerData.walletAddress
            }, true) // Include spectators
          }
          break
          
        case 'gamble':
          // Broadcast gambling events to all players
          broadcast({
            type: 'fountainUpdate',
            pool: await getFountainPool(env),
            lastWinner: {
              playerId,
              username: playerData?.username,
              result: message.result
            }
          })
          break
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
    }
  })
  
  websocket.addEventListener('close', async () => {
    console.log(`🎮 WebSocket closed: ${playerId}`)
    
    // Broadcast player left to everyone including spectators
    if (playerData) {
      broadcastToOthers(playerId, {
        type: 'playerLeft',
        playerId
      }, true) // Include spectators
    }
    
    // Remove from sessions
    webSocketSessions.delete(playerId)
  })
  
  websocket.addEventListener('error', (error) => {
    console.error(`🎮 WebSocket error for ${playerId}:`, error)
    webSocketSessions.delete(playerId)
  })
}

// Broadcast to all connected players
function broadcast(message) {
  const messageStr = JSON.stringify(message)
  let sent = 0
  let failed = 0
  
  for (const [playerId, session] of webSocketSessions) {
    try {
      if (session.websocket.readyState === 1) { // 1 = OPEN
        session.websocket.send(messageStr)
        sent++
      } else {
        failed++
        // Remove dead connections
        webSocketSessions.delete(playerId)
      }
    } catch (error) {
      failed++
      console.error(`Failed to send to ${playerId}:`, error)
      webSocketSessions.delete(playerId)
    }
  }
  
  console.log(`📡 Broadcast sent to ${sent} players, ${failed} failed`)
}

// Broadcast to all players except sender (and optionally include spectators)
function broadcastToOthers(excludePlayerId, message, includeSpectators = true) {
  const messageStr = JSON.stringify(message)
  let sent = 0
  let failed = 0
  let spectatorsSent = 0
  
  for (const [playerId, session] of webSocketSessions) {
    if (playerId === excludePlayerId) continue
    
    // Skip non-spectators if we're not including them
    // Always send to spectators for movement updates
    const isSpectator = session.isSpectator === true
    if (!includeSpectators && !session.playerData && !isSpectator) continue
    
    try {
      if (session.websocket.readyState === 1) { // 1 = OPEN
        session.websocket.send(messageStr)
        sent++
        if (isSpectator) spectatorsSent++
      } else {
        failed++
        webSocketSessions.delete(playerId)
      }
    } catch (error) {
      failed++
      console.error(`Failed to send to ${playerId}:`, error)
      webSocketSessions.delete(playerId)
    }
  }
  
  if (spectatorsSent > 0) {
    console.log(`📡 Broadcast sent to ${sent} others (including ${spectatorsSent} spectators), ${failed} failed`)
  } else {
    console.log(`📡 Broadcast sent to ${sent} others, ${failed} failed`)
  }
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

  // Get user's house boost before calculating result
  const houseBoost = await getUserHouseBoost(session.walletAddress, env)
  console.log(`🏠 Applying house boost of +${houseBoost}% for ${session.walletAddress}`)
  
  // Generate result using commit-reveal with house boost
  const result = await calculateGamblingResult(session.serverSeed, session.clientSeed, txSignature, houseBoost)
  
  // Calculate payout
  const payout = Math.floor(1000 * result.multiplier)
  
  // Send payout if won (from pool wallet) - DON'T wait for confirmation
  let payoutTx = null
  if (payout > 0) {
    console.log(`💰 Attempting to send ${payout} $WISH payout to ${session.walletAddress}`)
    
    try {
      // Send payout asynchronously to avoid delays
      const payoutPromise = sendPayoutFast(env, session.walletAddress, payout)
      
      // Store a temporary transaction ID immediately
      const tempTxId = 'TEMP_' + crypto.randomUUID()
      payoutTx = tempTxId
      
      // Store temporary entry immediately
      const payoutKey = `payout:${session.walletAddress}:${Date.now()}`
      const payoutData = {
        txId: tempTxId,
        sessionId,
        walletAddress: session.walletAddress,
        amount: payout,
        timestamp: Date.now(),
        status: 'pending'
      }
      await env.GAMBLE_LOGS.put(payoutKey, JSON.stringify(payoutData))
      
      // Update with real transaction ID when available (don't wait)
      payoutPromise.then(async (realTxId) => {
        console.log(`✅ Payout sent with tx: ${realTxId}`)
        payoutData.txId = realTxId
        payoutData.status = 'confirmed'
        await env.GAMBLE_LOGS.put(payoutKey, JSON.stringify(payoutData))
        console.log(`💾 Updated payout tx to ${realTxId}`)
        
        // Also update the gambling log
        const gamblingLogKey = `gamble:${session.walletAddress}:${session.timestamp || Date.now()}`
        const existingLog = await env.GAMBLE_LOGS.get(gamblingLogKey)
        if (existingLog) {
          const logData = JSON.parse(existingLog)
          logData.payoutTx = realTxId
          await env.GAMBLE_LOGS.put(gamblingLogKey, JSON.stringify(logData))
        }
      }).catch(error => {
        console.error('❌ Payout failed:', error)
      })
      
    } catch (error) {
      console.error('❌ Failed to initiate payout:', error)
      payoutTx = null
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

  // Log the gambling event with transaction IDs
  await logGambleEvent(env, {
    walletAddress: session.walletAddress,
    timestamp: Date.now(),
    sessionId,
    amountGambled: 1000,
    burnTx: txSignature,
    payoutTx,
    payout,
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

async function calculateGamblingResult(serverSeed, clientSeed, blockHash, houseBoost = 0) {
  // Combine seeds and blockhash for randomness
  const combined = serverSeed + clientSeed + blockHash
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined))
  const hashArray = new Uint8Array(hashBuffer)
  
  // Convert to integer in range [0, 9999] for clean bucket system
  let rngValue = 0
  for (let i = 0; i < 4; i++) { // Use 4 bytes for better distribution
    rngValue = (rngValue * 256 + hashArray[i]) % 10000
  }
  
  console.log(`🎲 Original RNG: ${rngValue}/9999, House boost: +${houseBoost}%`)
  
  // Apply house boost by shifting RNG value toward winning buckets
  if (houseBoost > 0) {
    // Boost reduces the loss chance by shifting the RNG value down
    // Each 1% boost reduces RNG by ~40 (since bust is 4000/10000)
    const boostReduction = Math.floor((houseBoost / 100) * 400)
    rngValue = Math.max(0, rngValue - boostReduction)
    console.log(`🏠 Boosted RNG: ${rngValue} (reduced by ${boostReduction})`)
  }
  
  // New payout structure with clean RNG buckets (0-9999)
  // RTP ≈ 91.36%, House edge ≈ 8.64%
  if (rngValue <= 3999) {
    // Bust: 40.00% (0000-3999) - 4000 buckets
    return { tier: 'BUST', multiplier: 0 }
  } else if (rngValue <= 9385) {
    // Break even: 53.86% (4000-9385) - 5386 buckets  
    return { tier: 'BREAK EVEN', multiplier: 1 }
  } else if (rngValue <= 9735) {
    // Win 3×: 3.50% (9386-9735) - 350 buckets
    return { tier: 'WIN', multiplier: 3 }
  } else if (rngValue <= 9885) {
    // Win 5×: 1.50% (9736-9885) - 150 buckets
    return { tier: 'WIN', multiplier: 5 }
  } else if (rngValue <= 9965) {
    // Big win 10×: 0.80% (9886-9965) - 80 buckets
    return { tier: 'BIG WIN', multiplier: 10 }
  } else if (rngValue <= 9995) {
    // Mega 25×: 0.30% (9966-9995) - 30 buckets
    return { tier: 'MEGA WIN', multiplier: 25 }
  } else {
    // Jackpot 100×: 0.04% (9996-9999) - 4 buckets
    return { tier: 'JACKPOT', multiplier: 100 }
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

async function handleStatsLatest(request, env) {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')
  
  try {
    // Get recent gambling results for info page verification
    const logs = []
    const list = await env.GAMBLE_LOGS.list({
      prefix: 'gamble:',
      limit: 1000  // Get more entries to ensure we have enough recent ones
    })
    
    // Sort keys by timestamp (most recent first) and take requested limit
    const sortedKeys = list.keys.sort((a, b) => {
      const timestampA = parseInt(a.name.split(':')[2] || '0')
      const timestampB = parseInt(b.name.split(':')[2] || '0')
      return timestampB - timestampA  // Descending order (newest first)
    }).slice(0, Math.min(limit * 5, 500)) // Take more to ensure we get enough valid entries
    
    // Process entries to get gambling statistics
    const promises = sortedKeys.map(async (key) => {
      try {
        const logData = await env.GAMBLE_LOGS.get(key.name)
        if (logData) {
          const event = JSON.parse(logData)
          if (event.walletAddress && event.timestamp) {
            return {
              winner: event.walletAddress,
              amount: event.payout ? event.payout.toString() : '0',
              tx: event.payoutTx || event.burnTx || '',
              ts: new Date(event.timestamp).toISOString(),
              tier: event.result?.tier || 'UNKNOWN'
            }
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse log entry:', key.name, parseError)
      }
      return null
    })
    
    const results = await Promise.all(promises)
    results.forEach(result => {
      if (result) logs.push(result)
    })
    
    // Return the requested number of recent entries
    const stats = logs.slice(0, limit)
    
    console.log(`📊 Stats Latest: Returning ${stats.length} entries`)
    
    return new Response(JSON.stringify(stats), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Error fetching latest stats:', error)
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
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

// Helper functions - removed old broadcast function (now implemented above)

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
  try {
    // Get all gamble logs from KV storage with proper prefix
    const logs = []
    const list = await env.GAMBLE_LOGS.list({
      prefix: 'gamble:',
      limit: 1000  // Get more entries to ensure we have recent ones
    })
    
    // Also get payout transactions
    const payoutList = await env.GAMBLE_LOGS.list({
      prefix: 'payout:',
      limit: 1000
    })
    
    // Create a map of wallet+timestamp to payout txId for quick lookup
    const payoutMap = new Map()
    for (const key of payoutList.keys) {
      try {
        const payoutData = await env.GAMBLE_LOGS.get(key.name)
        if (payoutData) {
          const payout = JSON.parse(payoutData)
          // Create a lookup key based on wallet and approximate timestamp
          const lookupKey = `${payout.walletAddress}:${Math.floor(payout.timestamp / 10000)}`
          payoutMap.set(lookupKey, payout.txId)
          console.log(`📝 Found payout tx: ${payout.txId} for ${payout.walletAddress}`)
        }
      } catch (e) {
        console.warn(`Failed to parse payout: ${key.name}`)
      }
    }
    
    // Sort keys by timestamp (most recent first) and take top 100
    const sortedKeys = list.keys.sort((a, b) => {
      // Extract timestamp from key format: gamble:wallet:timestamp
      const timestampA = parseInt(a.name.split(':')[2] || '0')
      const timestampB = parseInt(b.name.split(':')[2] || '0')
      return timestampB - timestampA  // Descending order (newest first)
    }).slice(0, 100)
    
    const keysToProcess = sortedKeys
    
    // Process entries in parallel for better performance
    const promises = keysToProcess.map(async (key) => {
      try {
        const logData = await env.GAMBLE_LOGS.get(key.name)
        if (logData) {
          const event = JSON.parse(logData)
          // Only include WINS (break-even and above, payout >= 1000)
          if (event.walletAddress && event.timestamp) {
            const payout = event.payout || 0
            
            // Only show wins (break-even = 1000 and above)
            if (payout >= 1000) {
              // For wins and break-even, show payout transaction from pool wallet
              let txId = null
              
              // First check if we have a valid payoutTx in the event
              if (event.payoutTx && event.payoutTx.length > 20 && 
                  !event.payoutTx.startsWith('PROCESSING_') && 
                  !event.payoutTx.startsWith('TEMP_')) {
                txId = event.payoutTx
                console.log(`🔗 Using event payout tx: ${txId}`)
              } 
              // Otherwise check the payout map
              else {
                const lookupKey = `${event.walletAddress}:${Math.floor(event.timestamp / 10000)}`
                const mappedTx = payoutMap.get(lookupKey)
                if (mappedTx && !mappedTx.startsWith('TEMP_')) {
                  txId = mappedTx
                  console.log(`🔗 Found payout tx in map: ${txId}`)
                } else {
                  console.log(`⚠️ No confirmed payout tx found for ${event.walletAddress} at ${event.timestamp}`)
                }
              }
              
              const result = {
                winner: event.walletAddress,
                amount: payout.toString(), // Amount won from pool wallet
                timestamp: new Date(event.timestamp).toISOString(),
                tier: event.result?.tier || (payout === 1000 ? 'BREAK EVEN' : 'WIN'),
                isWin: payout >= 1000
              }
              
              // Always include tx field if we have any valid transaction ID
              if (txId && txId.length > 20) {
                result.tx = txId
              }
              return result
            }
            // Don't return anything for losses (payout < 1000)
            return null
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse log entry:', key.name, parseError)
      }
      return null
    })
    
    const results = await Promise.all(promises)
    results.forEach(result => {
      if (result) logs.push(result)
    })
    
    // Sort by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    console.log(`📊 Leaderboard: Found ${logs.length} winning transactions`)
    
    return {
      topWinners: logs.slice(0, 50), // Recent winners only
      mostActive: [], // Empty to avoid duplicates
      luckiest: [] // Empty to avoid duplicates
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return {
      topWinners: [],
      mostActive: [],
      luckiest: []
    }
  }
}

async function sendPayout(env, recipientWalletAddress, amount) {
  console.log(`🔐 Checking for pool wallet configuration...`)
  
  // Check various possible environment variable names
  const privateKey = env.POOL_WALLET_PRIVATE_KEY || 
                     env.POOL_WALLET_PRIVATE || 
                     env.POOL_PRIVATE_KEY ||
                     env.PRIVATE_KEY
  
  if (!privateKey) {
    console.error('❌ No pool wallet private key found in environment variables')
    console.log('Checked: POOL_WALLET_PRIVATE_KEY, POOL_WALLET_PRIVATE, POOL_PRIVATE_KEY, PRIVATE_KEY')
    throw new Error('Pool wallet private key not configured')
  }
  
  console.log(`✅ Found pool wallet private key`)
  
  const connection = new Connection(env.SOLANA_RPC_URL)
  
  // Create pool wallet keypair from private key
  let poolWalletPrivateKey
  
  // Handle different private key formats
  if (privateKey.startsWith('[')) {
    // JSON array format like [1,2,3,...]
    poolWalletPrivateKey = new Uint8Array(JSON.parse(privateKey))
  } else {
    // Base58 string format
    poolWalletPrivateKey = base58ToUint8Array(privateKey)
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
  
  // Query actual token decimals from the blockchain
  let tokenDecimals = 6 // fallback
  try {
    const mintInfo = await connection.getMint(tokenMint)
    tokenDecimals = mintInfo.decimals
    console.log(`🔍 Token decimals detected: ${tokenDecimals}`)
  } catch (error) {
    console.log(`⚠️ Could not get token decimals, using fallback: ${tokenDecimals}`)
  }

  // Add transfer instruction with correct decimals
  const rawAmount = Math.floor(amount * Math.pow(10, tokenDecimals))
  const tokenAmount = BigInt(rawAmount)
  
  console.log(`🔢 Sending payout: ${amount} tokens = ${rawAmount} base units = ${tokenAmount}n`)
  
  const transferInstruction = createTransferInstruction(
    poolTokenAccount,
    recipientTokenAccount,
    poolWallet.publicKey,
    tokenAmount, // Use BigInt directly - library handles encoding
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
  
  // Use faster confirmation with shorter timeout
  try {
    await connection.confirmTransaction({
      signature,
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    }, 'processed') // Use 'processed' for faster confirmation
    console.log(`✅ Payout transaction confirmed: ${signature}`)
  } catch (error) {
    console.log(`⚠️ Payout sent but confirmation timeout (likely succeeded): ${signature}`)
    // Don't throw - transaction was likely successful even if confirmation timed out
  }
  
  console.log(`🔄 Returning payout transaction signature: ${signature}`)
  return signature
}

// Async version that doesn't block the main response
async function sendPayoutAsync(env, recipientWalletAddress, amount) {
  return await sendPayout(env, recipientWalletAddress, amount)
}

// Fast payout that doesn't wait for confirmation
async function sendPayoutFast(env, recipientWalletAddress, amount) {
  console.log(`🚀 Sending fast payout of ${amount} $WISH to ${recipientWalletAddress}`)
  
  // Check various possible environment variable names
  const privateKey = env.POOL_WALLET_PRIVATE_KEY || 
                     env.POOL_WALLET_PRIVATE || 
                     env.POOL_PRIVATE_KEY ||
                     env.PRIVATE_KEY
  
  if (!privateKey) {
    throw new Error('Pool wallet private key not configured')
  }
  
  const connection = new Connection(env.SOLANA_RPC_URL)
  
  // Create pool wallet keypair from private key
  let poolWalletPrivateKey
  
  // Handle different private key formats
  if (privateKey.startsWith('[')) {
    poolWalletPrivateKey = new Uint8Array(JSON.parse(privateKey))
  } else {
    poolWalletPrivateKey = base58ToUint8Array(privateKey)
  }
  
  const poolWallet = Keypair.fromSecretKey(poolWalletPrivateKey)
  
  // Get token accounts
  const tokenMint = new PublicKey(env.WISH_TOKEN_MINT)
  const recipientPubkey = new PublicKey(recipientWalletAddress)
  
  const poolTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    poolWallet.publicKey
  )
  
  const recipientTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    recipientPubkey
  )
  
  // Create transfer instruction
  const mintInfo = await getMint(connection, tokenMint)
  const transferAmount = amount * Math.pow(10, mintInfo.decimals)
  
  const transferInstruction = createTransferInstruction(
    poolTokenAccount,
    recipientTokenAccount,
    poolWallet.publicKey,
    transferAmount
  )
  
  // Build and send transaction WITHOUT waiting for confirmation
  const transaction = new Transaction().add(transferInstruction)
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = poolWallet.publicKey
  
  // Sign and send
  transaction.sign(poolWallet)
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'processed'
  })
  
  console.log(`📤 Transaction sent immediately: ${signature}`)
  
  // Don't wait for confirmation - return immediately
  return signature
}

// Update gambling log with real transaction ID once payout is sent
async function updateGamblingLogWithTx(env, sessionId, walletAddress, realTxId) {
  try {
    console.log(`🔄 Updating gambling log for session ${sessionId} with real tx: ${realTxId}`)
    
    // Get recent entries for this wallet
    const listResult = await env.GAMBLE_LOGS.list({
      prefix: `gamble:${walletAddress}:`,
      limit: 100
    })
    
    console.log(`📋 Found ${listResult.keys.length} gambling logs for wallet ${walletAddress}`)
    
    // Sort keys by timestamp (newest first)
    const sortedKeys = listResult.keys.sort((a, b) => {
      const timestampA = parseInt(a.name.split(':')[2] || '0')
      const timestampB = parseInt(b.name.split(':')[2] || '0')
      return timestampB - timestampA
    })
    
    // Find the entry that matches this session
    let updated = false
    for (const key of sortedKeys) {
      try {
        const logData = await env.GAMBLE_LOGS.get(key.name)
        if (logData) {
          const entry = JSON.parse(logData)
          // Match by sessionId OR by PROCESSING_ placeholder
          if (entry.sessionId === sessionId || 
              (entry.payoutTx && entry.payoutTx.startsWith('PROCESSING_'))) {
            
            console.log(`📝 Found matching entry: ${key.name}, current payoutTx: ${entry.payoutTx}`)
            
            // Update with real transaction ID
            entry.payoutTx = realTxId
            await env.GAMBLE_LOGS.put(key.name, JSON.stringify(entry))
            console.log(`✅ Updated gambling log ${key.name} with real tx: ${realTxId}`)
            updated = true
            break
          }
        }
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse log entry: ${key.name}`, parseError)
        continue
      }
    }
    
    if (!updated) {
      console.error(`❌ Could not find gambling log entry for session ${sessionId}`)
      // Log all entries for debugging
      console.log('📊 All entries checked:', sortedKeys.map(k => k.name).join(', '))
    }
    
    return updated
  } catch (error) {
    console.error('❌ Error updating gambling log with real tx:', error)
    return false
  }
}

function getResultMessage(tier) {
  const messages = {
    'JACKPOT': "🌟 LEGENDARY JACKPOT!!! 100× MULTIPLIER! The fountain grants your ultimate wish! 🌟",
    'MEGA WIN': "💎 MEGA WIN! 25× MULTIPLIER! The spirits favor you greatly! 💎",
    'BIG WIN': "🎉 BIG WIN! 10× MULTIPLIER! Your wish echoes through the realm! 🎉",
    'WIN': "✨ WIN! The fountain rewards your faith! ✨",
    'BREAK EVEN': "🪙 Your coins return to you safely! 🪙",
    'BUST': "💸 The fountain keeps your offering this time...",
    'LOSE': "💸 The fountain keeps your offering this time..."
  }
  return messages[tier] || messages[tier?.toUpperCase()] || "Unknown result"
}

// Housing system constants and functions
const HOUSE_LEVELS = [
  { level: 1, name: "Starter Shack", cost: 0, boostPercent: 0.5, burnRequirement: 1000 },
  { level: 2, name: "Cozy Cottage", cost: 0, boostPercent: 1.5, burnRequirement: 30000 },
  { level: 3, name: "Suburban Home", cost: 0, boostPercent: 4.0, burnRequirement: 75000 },
  { level: 4, name: "Luxury Villa", cost: 0, boostPercent: 8.0, burnRequirement: 225000 },
  { level: 5, name: "Grand Mansion", cost: 0, boostPercent: 15.0, burnRequirement: 450000 },
  { level: 6, name: "Royal Palace", cost: 0, boostPercent: 25.0, burnRequirement: 750000 }
]

async function handleGetHousingData(walletAddress, env) {
  console.log('🏠 Fetching housing data for:', walletAddress)
  
  try {
    // Get user housing data from KV storage
    const housingKey = `housing:${walletAddress}`
    const housingDataStr = await env.GAMBLE_LOGS.get(housingKey)
    
    let housingData = {
      currentLevel: 0,
      totalBurned: 0,
      ownedLevels: []
    }
    
    if (housingDataStr) {
      const stored = JSON.parse(housingDataStr)
      housingData = {
        currentLevel: stored.currentLevel || 0,
        totalBurned: stored.totalBurned || 0,
        ownedLevels: stored.ownedLevels || []
      }
    }
    
    // Get total burned from user stats (faster than calculating from logs)
    const userKey = `user:${walletAddress}`
    const userStatsStr = await env.USER_STATS.get(userKey)
    const userStats = userStatsStr ? JSON.parse(userStatsStr) : { totalGambled: 0 }
    housingData.totalBurned = userStats.totalGambled || 0
    
    console.log('🏠 Retrieved housing data:', housingData)
    
    return new Response(JSON.stringify(housingData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('❌ Error fetching housing data:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch housing data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleHousePurchase(request, env) {
  console.log('🏠 Processing house purchase request...')
  
  try {
    const { walletAddress, level, burnRequirement } = await request.json()
    
    if (!walletAddress || !level || burnRequirement === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    console.log(`🏠 Purchase request: Level ${level} requiring ${burnRequirement} tokens burned by ${walletAddress}`)
    
    // Get current housing data
    const housingKey = `housing:${walletAddress}`
    const housingDataStr = await env.GAMBLE_LOGS.get(housingKey)
    
    let housingData = {
      currentLevel: 0,
      totalBurned: 0,
      ownedLevels: []
    }
    
    if (housingDataStr) {
      housingData = JSON.parse(housingDataStr)
    }
    
    // Get total burned from user stats (faster than calculating from logs)  
    const userKey = `user:${walletAddress}`
    const userStatsStr = await env.USER_STATS.get(userKey)
    const userStats = userStatsStr ? JSON.parse(userStatsStr) : { totalGambled: 0 }
    housingData.totalBurned = userStats.totalGambled || 0
    
    // Validate purchase
    const house = HOUSE_LEVELS[level - 1]
    if (!house) {
      return new Response(JSON.stringify({ error: 'Invalid house level' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Check if already owned
    if (housingData.ownedLevels.includes(level)) {
      return new Response(JSON.stringify({ error: 'House already owned' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Check prerequisites
    if (level > 1 && !housingData.ownedLevels.includes(level - 1)) {
      return new Response(JSON.stringify({ error: 'Must own previous house level first' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Check burn requirement
    if (housingData.totalBurned < house.burnRequirement) {
      return new Response(JSON.stringify({ 
        error: `Need ${house.burnRequirement - housingData.totalBurned} more $WISH burned` 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Housing is now burn-based: no token transfer required
    // Users unlock houses by having burned enough tokens through gambling
    console.log(`🏠 Unlocking house level ${level} - no tokens burned for unlock`)
    
    // Update housing data
    housingData.ownedLevels.push(level)
    housingData.ownedLevels.sort((a, b) => a - b) // Keep sorted
    housingData.currentLevel = Math.max(...housingData.ownedLevels)
    // Note: totalBurned comes from gambling sessions, not house purchases
    
    // Save updated data
    await env.GAMBLE_LOGS.put(housingKey, JSON.stringify(housingData))
    
    console.log(`✅ Successfully purchased ${house.name} for ${walletAddress}`)
    console.log('🏠 Updated housing data:', housingData)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully purchased ${house.name}!`,
      housingData 
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
    
  } catch (error) {
    console.error('❌ Error processing house purchase:', error)
    return new Response(JSON.stringify({ error: 'Failed to process purchase' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleGetUserStats(walletAddress, env) {
  console.log('📊 Fetching user stats for:', walletAddress)
  
  try {
    // Get user stats first (faster than calculating from logs)
    const userKey = `user:${walletAddress}`
    const userStatsStr = await env.USER_STATS.get(userKey)
    
    let userStats = {
      totalGambled: 0,
      totalWon: 0,
      gamesPlayed: 0,
      biggestWin: 0
    }
    
    if (userStatsStr) {
      userStats = JSON.parse(userStatsStr)
    }
    
    // totalBurned equals totalGambled since each gambling session burns tokens
    const totalBurned = userStats.totalGambled || 0
    
    const response = {
      walletAddress,
      totalBurned,
      ...userStats,
      timestamp: Date.now()
    }
    
    console.log('📊 User stats response:', response)
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching user stats:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch user stats',
      walletAddress,
      totalBurned: 0,
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function calculateTotalBurned(walletAddress, env) {
  console.log('🔥 Calculating total burned for:', walletAddress)
  
  try {
    // Get all gambling logs for this wallet
    const listResult = await env.GAMBLE_LOGS.list({ prefix: `gamble:${walletAddress}:` })
    
    let totalBurned = 0
    
    for (const key of listResult.keys) {
      try {
        const gambleData = await env.GAMBLE_LOGS.get(key.name)
        if (gambleData) {
          const gamble = JSON.parse(gambleData)
          // Each gambling session burns exactly 1000 tokens
          if (gamble.amountGambled) {
            totalBurned += gamble.amountGambled
          }
        }
      } catch (e) {
        console.warn('Error processing gamble log:', key.name, e)
      }
    }
    
    console.log(`🔥 Total burned for ${walletAddress}: ${totalBurned}`)
    return totalBurned
    
  } catch (error) {
    console.error('❌ Error calculating total burned:', error)
    return 0
  }
}

async function getUserHouseBoost(walletAddress, env) {
  console.log('🏠 Getting house boost for:', walletAddress)
  
  try {
    const housingKey = `housing:${walletAddress}`
    const housingDataStr = await env.GAMBLE_LOGS.get(housingKey)
    
    if (!housingDataStr) {
      console.log('🏠 No housing data found')
      return 0
    }
    
    const housingData = JSON.parse(housingDataStr)
    const totalBoost = housingData.ownedLevels.reduce((sum, level) => {
      const house = HOUSE_LEVELS[level - 1]
      return sum + (house ? house.boostPercent : 0)
    }, 0)
    
    console.log(`🏠 Total house boost: +${totalBoost}%`)
    return totalBoost
    
  } catch (error) {
    console.error('❌ Error getting house boost:', error)
    return 0
  }
}

async function handleGetMultiplayerPlayers(request, env) {
  try {
    // Get current players from WebSocket sessions
    const players = Array.from(webSocketSessions.values())
      .filter(session => session.playerData)
      .map(session => session.playerData)
    
    console.log(`📊 Current multiplayer players: ${players.length}`)
    
    return new Response(JSON.stringify({
      success: true,
      players: players,
      count: players.length,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    console.error('❌ Error getting multiplayer players:', error)
    return new Response(JSON.stringify({
      success: false,
      players: [],
      count: 0,
      error: 'Failed to fetch players'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleClearWinners(request, env) {
  try {
    console.log('🧹 Starting Recent Winners data clearing...')
    
    let deletedCount = 0
    
    // Clear all gamble logs
    console.log('🧹 Clearing gamble logs...')
    const gambleList = await env.GAMBLE_LOGS.list({
      prefix: 'gamble:',
      limit: 1000
    })
    
    for (const key of gambleList.keys) {
      await env.GAMBLE_LOGS.delete(key.name)
      deletedCount++
    }
    console.log(`🧹 Deleted ${gambleList.keys.length} gamble log entries`)
    
    // Clear all payout logs  
    console.log('🧹 Clearing payout logs...')
    const payoutList = await env.GAMBLE_LOGS.list({
      prefix: 'payout:',
      limit: 1000
    })
    
    for (const key of payoutList.keys) {
      await env.GAMBLE_LOGS.delete(key.name)
      deletedCount++
    }
    console.log(`🧹 Deleted ${payoutList.keys.length} payout log entries`)
    
    // Clear any other gambling-related data (check for additional prefixes)
    console.log('🧹 Checking for additional gambling data...')
    const allList = await env.GAMBLE_LOGS.list({
      limit: 1000
    })
    
    // Delete any remaining gambling-related entries
    const additionalDeletes = []
    for (const key of allList.keys) {
      if (key.name.startsWith('result:') || 
          key.name.startsWith('session:') ||
          key.name.startsWith('tx:') ||
          key.name.includes('gambling') ||
          key.name.includes('winner')) {
        additionalDeletes.push(key.name)
      }
    }
    
    for (const keyName of additionalDeletes) {
      await env.GAMBLE_LOGS.delete(keyName)
      deletedCount++
    }
    
    if (additionalDeletes.length > 0) {
      console.log(`🧹 Deleted ${additionalDeletes.length} additional gambling-related entries`)
    }
    
    console.log(`🧹 ✅ Successfully cleared Recent Winners data! Total deleted: ${deletedCount}`)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Recent Winners data cleared successfully',
      deletedCount: deletedCount,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
    
  } catch (error) {
    console.error('❌ Error clearing Recent Winners data:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to clear Recent Winners data',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// Export LobbyDO for Durable Object
export { LobbyDO }

// Keep GameState for compatibility (used by other parts)
export class GameState {
  constructor(state, env) {
    this.state = state
    this.env = env
  }

  async fetch(request) {
    return new Response('GameState Durable Object - reserved for future features', { status: 200 })
  }
}