export class LobbyDO {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Map() // playerId -> WebSocket
    this.players = new Map() // playerId -> player state
    this.lastTickTime = Date.now()
    this.tickInterval = null
    this.broadcastInterval = null
    this.cleanupInterval = null
    
    console.log('🎮 LobbyDO constructor called - instance created')
    
    // Disable game loop for now - just handle simple position updates
    // this.startGameLoop()
    
    // Start cleanup timer to handle ghost players
    this.startCleanupTimer()
  }

  // Create deterministic sprite assignment based on wallet address
  getWalletSpriteId(walletAddress, spriteCount) {
    // Simple hash function for deterministic sprite selection
    let hash = 0
    for (let i = 0; i < walletAddress.length; i++) {
      const char = walletAddress.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % spriteCount
  }

  async fetch(request) {
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    await this.handleWebSocket(server)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async handleWebSocket(webSocket) {
    webSocket.accept()
    const playerId = crypto.randomUUID()
    
    console.log(`🎮 Player ${playerId} connecting to lobby`)
    
    // Store session
    this.sessions.set(playerId, webSocket)
    
    // Handle messages
    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data)
        await this.handleMessage(playerId, message)
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    // Handle disconnect
    webSocket.addEventListener('close', () => {
      this.handleDisconnect(playerId)
    })

    webSocket.addEventListener('error', (error) => {
      console.error(`WebSocket error for ${playerId}:`, error)
      this.handleDisconnect(playerId)
    })
  }

  async handleMessage(playerId, message) {
    switch (message.type) {
      case 'join':
        await this.handleJoin(playerId, message)
        break
      case 'move':
        // Handle simple position updates from client
        await this.handleMove(playerId, message)
        break
      case 'input':
        await this.handleInput(playerId, message)
        break
      case 'ping':
        // Respond to ping for connection health
        this.sendToPlayer(playerId, { type: 'pong', timestamp: message.timestamp })
        break
    }
  }

  async handleMove(playerId, message) {
    const player = this.players.get(playerId)
    if (!player) return

    // Update player position
    player.x = message.x
    player.y = message.y
    player.lastSeen = Date.now()

    // Broadcast position update to other players
    this.broadcast({
      type: 'playerMoved',
      playerId,
      x: message.x,
      y: message.y
    }, playerId)
  }

  async handleJoin(playerId, message) {
    const { walletAddress } = message
    
    console.log(`🎮 handleJoin called for ${playerId}, current players: ${this.players.size}`)
    console.log(`🎮 Join attempt from wallet: ${walletAddress}`)
    
    // Basic validation for wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.log(`🎮 ❌ Invalid wallet address format: ${walletAddress}`)
      return
    }
    
    // Check if wallet address looks like a Solana address (base58, 32-44 chars)
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      console.log(`🎮 ❌ Suspicious wallet address length: ${walletAddress} (${walletAddress.length} chars)`)
      return
    }
    
    // Check for suspicious patterns in the wallet address
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
      console.log(`🎮 ❌ Invalid base58 characters in wallet: ${walletAddress}`)
      return
    }
    
    // Generate username from wallet (first 3 + last 2 chars)
    const username = walletAddress.length >= 5 ? 
      walletAddress.substring(0, 3) + walletAddress.slice(-2) : 
      walletAddress.substring(0, 5)

    // Assign persistent sprite based on wallet address hash
    const spriteNames = ['blue', 'default', 'grey', 'lime', 'ping', 'red']
    const spriteId = this.getWalletSpriteId(walletAddress, spriteNames.length)
    const spriteName = spriteNames[spriteId]

    // Create player state
    const player = {
      id: playerId,
      username,
      spriteId,
      spriteName,
      walletAddress,
      x: Math.random() * 700 + 100, // Random spawn position
      y: Math.random() * 500 + 100,
      lastInputSeq: 0,
      lastSeen: Date.now(),
      // Movement state
      vx: 0,
      vy: 0,
      inputQueue: []
    }

    // Check for duplicate wallet addresses BEFORE adding new player
    for (const [existingId, existingPlayer] of this.players) {
      if (existingPlayer.walletAddress === walletAddress) {
        console.log(`🎮 ❌ Wallet ${walletAddress} already connected as ${existingPlayer.username}, disconnecting old session`)
        // Disconnect the old connection and allow the new one
        this.handleDisconnect(existingId)
        break
      }
    }

    this.players.set(playerId, player)
    
    console.log(`🎮 ✅ Player ${username} joined with sprite ${spriteName}`)

    // Convert player data to match client expectations
    const clientPlayer = {
      id: player.id,
      walletAddress: player.walletAddress,
      username: player.username,
      x: player.x,
      y: player.y,
      sprite: player.spriteName
    }

    // Get all players in client format
    const allPlayersClient = Array.from(this.players.values()).map(p => ({
      id: p.id,
      walletAddress: p.walletAddress,
      username: p.username,
      x: p.x,
      y: p.y,
      sprite: p.spriteName
    }))

    // Send welcome message with current state (matching client expectations)
    this.sendToPlayer(playerId, {
      type: 'joined',
      playerId,
      player: clientPlayer,
      allPlayers: allPlayersClient
    })

    // Broadcast new player to others (matching client expectations)
    this.broadcast({
      type: 'playerJoined',
      player: clientPlayer
    }, playerId)
  }

  async handleInput(playerId, message) {
    const player = this.players.get(playerId)
    if (!player) return

    const { inputSeq, keys, timestamp } = message
    
    // Store input with sequence number for reconciliation
    player.inputQueue.push({
      seq: inputSeq,
      keys,
      timestamp,
      processed: false
    })

    // Update last seen
    player.lastSeen = Date.now()
    player.lastInputSeq = Math.max(player.lastInputSeq, inputSeq)

    // Keep only recent inputs (last 1 second)
    const cutoff = Date.now() - 1000
    player.inputQueue = player.inputQueue.filter(input => input.timestamp > cutoff)
  }

  startGameLoop() {
    // Game simulation at 60 Hz
    this.tickInterval = setInterval(() => {
      this.tick()
    }, 1000 / 60) // 16.67ms

    // Broadcast snapshots at 15 Hz  
    this.broadcastInterval = setInterval(() => {
      this.broadcastSnapshot()
    }, 1000 / 15) // 66.67ms
  }

  tick() {
    const now = Date.now()
    const deltaTime = (now - this.lastTickTime) / 1000 // Convert to seconds
    this.lastTickTime = now

    // Process player movements
    for (const [playerId, player] of this.players) {
      this.processPlayerMovement(player, deltaTime)
    }

    // Clean up disconnected players
    this.cleanupDisconnectedPlayers()
  }

  processPlayerMovement(player, deltaTime) {
    const speed = 200 // pixels per second

    // Process unprocessed inputs
    for (const input of player.inputQueue) {
      if (input.processed) continue

      // Apply movement based on keys
      let vx = 0, vy = 0
      
      if (input.keys.left || input.keys.a) vx -= speed
      if (input.keys.right || input.keys.d) vx += speed
      if (input.keys.up || input.keys.w) vy -= speed
      if (input.keys.down || input.keys.s) vy += speed

      // Apply movement for this frame
      const frameDelta = 1/60 // Fixed 60 FPS timestep
      player.x += vx * frameDelta
      player.y += vy * frameDelta

      // Keep within bounds (adjust based on your game area)
      player.x = Math.max(32, Math.min(1200 - 32, player.x))
      player.y = Math.max(32, Math.min(800 - 32, player.y))

      input.processed = true
    }

    // Clean up old processed inputs
    player.inputQueue = player.inputQueue.filter(input => !input.processed || Date.now() - input.timestamp < 500)
  }

  broadcastSnapshot() {
    // Create snapshot of all players
    const snapshot = {
      type: 'snapshot',
      timestamp: Date.now(),
      players: Array.from(this.players.values()).map(player => ({
        id: player.id,
        username: player.username,
        spriteId: player.spriteId,
        spriteName: player.spriteName,
        x: Math.round(player.x),
        y: Math.round(player.y),
        lastInputSeq: player.lastInputSeq
      }))
    }

    // Broadcast to all players
    this.broadcast(snapshot)
  }

  cleanupDisconnectedPlayers() {
    const now = Date.now()
    const timeout = 60000 // 60 second timeout (longer to avoid false positives)

    for (const [playerId, player] of this.players) {
      if (now - player.lastSeen > timeout) {
        console.log(`🎮 Cleaning up inactive player ${player.username} (${playerId.slice(0,8)})`)
        this.handleDisconnect(playerId)
      }
    }
  }

  handleDisconnect(playerId) {
    const player = this.players.get(playerId)
    if (player) {
      console.log(`🎮 Player ${player.username} disconnected`)
      
      // Broadcast player left (matching client expectations)
      this.broadcast({
        type: 'playerLeft',
        playerId
      }, playerId)
    }

    // Clean up
    this.sessions.delete(playerId)
    this.players.delete(playerId)

    // Stop game loop if no players
    if (this.players.size === 0) {
      this.stopGameLoop()
    }
  }

  startCleanupTimer() {
    // Run cleanup every 30 seconds to remove inactive players
    this.cleanupInterval = setInterval(() => {
      this.cleanupDisconnectedPlayers()
    }, 30000) // 30 seconds
  }

  stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval)
      this.broadcastInterval = null
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  sendToPlayer(playerId, message) {
    const session = this.sessions.get(playerId)
    if (session && session.readyState === 1) { // 1 = OPEN
      try {
        session.send(JSON.stringify(message))
      } catch (error) {
        console.error(`Failed to send to ${playerId}:`, error)
        this.handleDisconnect(playerId)
      }
    }
  }

  broadcast(message, excludePlayerId = null) {
    const messageStr = JSON.stringify(message)
    let sent = 0, failed = 0

    for (const [playerId, session] of this.sessions) {
      if (playerId === excludePlayerId) continue

      if (session.readyState === 1) { // 1 = OPEN
        try {
          session.send(messageStr)
          sent++
        } catch (error) {
          console.error(`Failed to broadcast to ${playerId}:`, error)
          this.handleDisconnect(playerId)
          failed++
        }
      } else {
        failed++
        this.handleDisconnect(playerId)
      }
    }

    if (sent > 0) {
      console.log(`📡 Broadcast sent to ${sent} players, ${failed} failed`)
    }
  }
}