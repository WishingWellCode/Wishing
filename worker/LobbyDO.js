export class LobbyDO {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Map() // playerId -> WebSocket
    this.players = new Map() // playerId -> player state
    this.lastTickTime = Date.now()
    this.tickInterval = null
    this.broadcastInterval = null
    
    // Start game loop when first player joins
    this.startGameLoop()
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
      case 'input':
        await this.handleInput(playerId, message)
        break
      case 'ping':
        // Respond to ping for connection health
        this.sendToPlayer(playerId, { type: 'pong', timestamp: message.timestamp })
        break
    }
  }

  async handleJoin(playerId, message) {
    const { walletAddress } = message
    
    // Generate username from wallet (first 3 + last 2 chars)
    const username = walletAddress.length >= 5 ? 
      walletAddress.substring(0, 3) + walletAddress.slice(-2) : 
      walletAddress

    // Assign random sprite (0-5 mapping to your sprite files)
    const spriteNames = ['blue', 'default', 'grey', 'lime', 'ping', 'red']
    const spriteId = Math.floor(Math.random() * spriteNames.length)
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

    this.players.set(playerId, player)

    console.log(`🎮 Player ${username} joined with sprite ${spriteName}`)

    // Send welcome message with current state
    this.sendToPlayer(playerId, {
      type: 'welcome',
      playerId,
      player,
      allPlayers: Array.from(this.players.values())
    })

    // Broadcast new player to others
    this.broadcast({
      type: 'player_joined',
      player
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
    const timeout = 1000 // 1 second timeout

    for (const [playerId, player] of this.players) {
      if (now - player.lastSeen > timeout) {
        console.log(`🎮 Cleaning up disconnected player ${player.username}`)
        this.handleDisconnect(playerId)
      }
    }
  }

  handleDisconnect(playerId) {
    const player = this.players.get(playerId)
    if (player) {
      console.log(`🎮 Player ${player.username} disconnected`)
      
      // Broadcast player left
      this.broadcast({
        type: 'player_left',
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

  stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval)
      this.broadcastInterval = null
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