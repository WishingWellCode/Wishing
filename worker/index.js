import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle WebSocket upgrade for multiplayer
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocketUpgrade(request, env)
    }
    
    // Handle API routes
    if (url.pathname === '/api/gamble') {
      return handleGamble(request, env)
    }
    
    if (url.pathname === '/api/stats') {
      return handleStats(request, env)
    }
    
    if (url.pathname === '/api/leaderboard') {
      return handleLeaderboard(request, env)
    }
    
    return new Response('Wish Well API', { status: 200 })
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

async function handleGamble(request, env) {
  const { walletAddress, amount } = await request.json()
  
  if (amount !== 1000) {
    return new Response(JSON.stringify({ error: 'Must gamble exactly 1000 $WISH' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Generate cryptographically secure random number
  const randomBytes = new Uint8Array(4)
  crypto.getRandomValues(randomBytes)
  const randomValue = randomBytes[0] / 255
  
  // Determine outcome based on probability weights
  let result = { won: false, amount: 0, tier: 'lose' }
  
  if (randomValue < 0.00001) {
    // 0.001% - Jackpot (1,000,000 $WISH)
    result = { won: true, amount: 1000000, tier: 'jackpot' }
  } else if (randomValue < 0.00015) {
    // 0.014% - Major win (100,000 $WISH)
    result = { won: true, amount: 100000, tier: 'major' }
  } else if (randomValue < 0.0005) {
    // 0.35% - Large win (10,000 $WISH)
    result = { won: true, amount: 10000, tier: 'large' }
  } else if (randomValue < 0.001) {
    // 0.5% - Medium win (5,000 $WISH)
    result = { won: true, amount: 5000, tier: 'medium' }
  } else if (randomValue < 0.4) {
    // 39% - Break even or small gain
    const gains = [1000, 1100, 1200, 1500]
    result = { 
      won: true, 
      amount: gains[Math.floor(Math.random() * gains.length)], 
      tier: 'small' 
    }
  } else {
    // 60% - Lose
    result = { won: false, amount: 0, tier: 'lose' }
  }
  
  // Update fountain pool
  await updateFountainPool(env, amount, result.amount)
  
  // Log gambling event
  await logGambleEvent(env, {
    walletAddress,
    timestamp: Date.now(),
    amountGambled: amount,
    result
  })
  
  // If won, initiate payout from dev wallet
  if (result.won && result.amount > 0) {
    // Note: Actual Solana transaction would be initiated here
    // For now, we'll just return the result
    console.log(`Payout ${result.amount} $WISH to ${walletAddress}`)
  }
  
  return new Response(JSON.stringify({
    success: true,
    ...result,
    message: getResultMessage(result.tier),
    timestamp: Date.now()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
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