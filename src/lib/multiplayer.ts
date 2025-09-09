interface Player {
  id: string
  username: string
  spriteId: number
  spriteName: string
  walletAddress: string
  x: number
  y: number
  lastInputSeq: number
}

interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  a: boolean
  d: boolean
  w: boolean
  s: boolean
}

interface QueuedInput {
  seq: number
  keys: InputState
  timestamp: number
  applied: boolean
}

interface PlayerSnapshot {
  id: string
  username: string
  spriteId: number
  spriteName: string
  x: number
  y: number
  lastInputSeq: number
}

interface SnapshotMessage {
  type: 'snapshot'
  timestamp: number
  players: PlayerSnapshot[]
}

export class MultiplayerClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private playerId: string | null = null
  private players = new Map<string, Player>()
  
  // Client-side prediction
  private localPlayer: Player | null = null
  private inputSequence = 0
  private inputQueue: QueuedInput[] = []
  private currentInput: InputState = {
    left: false, right: false, up: false, down: false,
    a: false, d: false, w: false, s: false
  }
  
  // Interpolation for other players
  private snapshots: SnapshotMessage[] = []
  private interpolationDelay = 150 // 150ms buffer
  
  // Callbacks
  private onPlayersUpdateCallback?: (players: Player[]) => void
  private onConnectionCallback?: (connected: boolean) => void
  
  // Optimized game loop
  private lastUpdate = 0
  private inputSendTimer = 0
  private renderTimer = 0
  private animationFrameId: number | null = null
  private throttledUpdate = false
  
  constructor() {
    this.startGameLoop()
  }

  connect(walletAddress: string) {
    if (this.ws) {
      this.disconnect()
    }

    const isLocal = window.location.hostname === 'localhost'
    const wsUrl = isLocal 
      ? 'ws://localhost:8787'
      : 'wss://wish-well-worker.stealthbundlebot.workers.dev'

    console.log('🎮 Connecting to multiplayer:', wsUrl)
    
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onopen = () => {
      console.log('🎮 Connected to multiplayer server')
      this.isConnected = true
      this.onConnectionCallback?.(true)
      
      // Send join message
      this.send({
        type: 'join',
        walletAddress
      })
    }
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }
    
    this.ws.onclose = () => {
      console.log('🎮 Disconnected from multiplayer server')
      this.isConnected = false
      this.ws = null
      this.onConnectionCallback?.(false)
    }
    
    this.ws.onerror = (error) => {
      console.error('🎮 WebSocket error:', error)
      this.isConnected = false
      this.onConnectionCallback?.(false)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.playerId = null
    this.localPlayer = null
    this.players.clear()
    this.inputQueue = []
    this.snapshots = []
    this.onConnectionCallback?.(false)
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'joined':
        this.playerId = message.playerId
        // Convert old format to new format
        this.localPlayer = {
          ...message.player,
          spriteId: 0, // Will be updated
          spriteName: message.player.sprite || 'default'
        }
        this.players.set(message.playerId, this.localPlayer)
        
        // Add all existing players
        for (const player of message.allPlayers) {
          const convertedPlayer = {
            ...player,
            spriteId: 0,
            spriteName: player.sprite || 'default'
          }
          this.players.set(player.id, convertedPlayer)
        }
        
        console.log(`🎮 Joined as ${this.localPlayer.username} with sprite ${this.localPlayer.spriteName}`)
        this.updatePlayersCallback()
        break
        
      case 'playerJoined':
        const newPlayer = {
          ...message.player,
          spriteId: 0,
          spriteName: message.player.sprite || 'default'
        }
        this.players.set(message.player.id, newPlayer)
        console.log(`🎮 Player joined: ${message.player.username}`)
        this.updatePlayersCallback()
        break
        
      case 'playerLeft':
        this.players.delete(message.playerId)
        console.log(`🎮 Player left: ${message.playerId}`)
        this.updatePlayersCallback()
        break
        
      case 'playerMoved':
        // Handle old movement format
        const player = this.players.get(message.playerId)
        if (player && player.id !== this.playerId) {
          player.x = message.x
          player.y = message.y
        }
        this.updatePlayersCallback()
        break
        
      case 'snapshot':
        this.handleSnapshot(message)
        break
        
      case 'pong':
        // Handle ping response for connection health
        break
    }
  }

  private handleSnapshot(snapshot: SnapshotMessage) {
    // Store snapshot for interpolation
    this.snapshots.push(snapshot)
    
    // Keep only recent snapshots (last 500ms)
    const cutoff = Date.now() - 500
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff)
    
    // Update player positions with server reconciliation
    for (const serverPlayer of snapshot.players) {
      const player = this.players.get(serverPlayer.id)
      if (!player) continue
      
      if (serverPlayer.id === this.playerId && this.localPlayer) {
        // Server reconciliation for local player
        this.reconcileLocalPlayer(serverPlayer)
      } else {
        // Update other players (will be interpolated during render)
        Object.assign(player, serverPlayer)
      }
    }
    
    this.updatePlayersCallback()
  }

  private reconcileLocalPlayer(serverPlayer: PlayerSnapshot) {
    if (!this.localPlayer) return
    
    // Find inputs that the server hasn't processed yet
    const unacknowledged = this.inputQueue.filter(
      input => input.seq > serverPlayer.lastInputSeq
    )
    
    // Reset to server position
    this.localPlayer.x = serverPlayer.x
    this.localPlayer.y = serverPlayer.y
    this.localPlayer.lastInputSeq = serverPlayer.lastInputSeq
    
    // Re-apply unacknowledged inputs for client-side prediction
    for (const input of unacknowledged) {
      this.applyInput(this.localPlayer, input.keys, 1/60)
      input.applied = true
    }
    
    // Clean up old inputs
    const cutoff = Date.now() - 1000
    this.inputQueue = this.inputQueue.filter(input => input.timestamp > cutoff)
  }

  updateInput(keys: InputState) {
    this.currentInput = { ...keys }
  }

  private startGameLoop() {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdate
      this.lastUpdate = currentTime
      
      if (this.isConnected && this.localPlayer) {
        // Send input at ~20 Hz (throttled)
        if (currentTime - this.inputSendTimer > 50) {
          this.sendInput()
          this.inputSendTimer = currentTime
        }
        
        // Apply client-side prediction (smooth 60fps)
        this.applyInput(this.localPlayer, this.currentInput, deltaTime / 1000)
        
        // Interpolate other players (throttled to 30fps for performance)
        if (currentTime - this.renderTimer > 33) { // ~30 FPS
          this.interpolateOtherPlayers()
          this.renderTimer = currentTime
          this.throttledUpdate = true
        }
        
        // Only update callback when needed
        if (this.throttledUpdate) {
          this.updatePlayersCallback()
          this.throttledUpdate = false
        }
      }
      
      this.animationFrameId = requestAnimationFrame(gameLoop)
    }
    
    this.animationFrameId = requestAnimationFrame(gameLoop)
  }

  private sendInput() {
    if (!this.ws || !this.isConnected) return
    
    // Only send if input has changed or periodically for heartbeat
    const inputChanged = this.hasInputChanged()
    if (!inputChanged && this.inputQueue.length > 0) return
    
    this.inputSequence++
    
    // Send position directly (old Worker format)  
    if (!this.localPlayer) return
    
    let vx = 0, vy = 0
    if (this.currentInput.left || this.currentInput.a) vx -= 200
    if (this.currentInput.right || this.currentInput.d) vx += 200
    if (this.currentInput.up || this.currentInput.w) vy -= 200
    if (this.currentInput.down || this.currentInput.s) vy += 200
    
    // Apply movement to local player immediately
    const deltaTime = 0.05 // 50ms
    this.localPlayer.x += vx * deltaTime
    this.localPlayer.y += vy * deltaTime
    
    // Keep within bounds
    this.localPlayer.x = Math.max(24, Math.min(window.innerWidth - 24, this.localPlayer.x))
    this.localPlayer.y = Math.max(24, Math.min(window.innerHeight - 24, this.localPlayer.y))
    
    const inputMessage = {
      type: 'move',
      x: Math.round(this.localPlayer.x),
      y: Math.round(this.localPlayer.y)
    }
    
    // Store input for reconciliation
    this.inputQueue.push({
      seq: this.inputSequence,
      keys: { ...this.currentInput },
      timestamp: Date.now(),
      applied: false
    })
    
    this.send(inputMessage)
  }

  private hasInputChanged(): boolean {
    if (this.inputQueue.length === 0) return true
    
    const lastInput = this.inputQueue[this.inputQueue.length - 1]
    return JSON.stringify(lastInput.keys) !== JSON.stringify(this.currentInput)
  }

  private applyInput(player: Player, input: InputState, deltaTime: number) {
    const speed = 300 // pixels per second (increased for smoother movement)
    let vx = 0, vy = 0
    
    if (input.left || input.a) vx -= speed
    if (input.right || input.d) vx += speed
    if (input.up || input.w) vy -= speed
    if (input.down || input.s) vy += speed
    
    // Use fixed deltaTime for consistent movement
    const fixedDeltaTime = 1/60 // 60 FPS
    
    // Apply movement
    player.x += vx * fixedDeltaTime
    player.y += vy * fixedDeltaTime
    
    // Keep within bounds (expand viewport bounds)
    player.x = Math.max(24, Math.min(window.innerWidth - 24, player.x))
    player.y = Math.max(24, Math.min(window.innerHeight - 24, player.y))
  }

  private interpolateOtherPlayers() {
    const now = Date.now()
    const renderTime = now - this.interpolationDelay
    
    // Find two snapshots to interpolate between
    let snapshot1: SnapshotMessage | null = null
    let snapshot2: SnapshotMessage | null = null
    
    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime && 
          this.snapshots[i + 1].timestamp >= renderTime) {
        snapshot1 = this.snapshots[i]
        snapshot2 = this.snapshots[i + 1]
        break
      }
    }
    
    if (!snapshot1 || !snapshot2) {
      // Use latest snapshot if no interpolation possible
      const latest = this.snapshots[this.snapshots.length - 1]
      if (latest) {
        for (const serverPlayer of latest.players) {
          if (serverPlayer.id === this.playerId) continue
          const player = this.players.get(serverPlayer.id)
          if (player) {
            player.x = serverPlayer.x
            player.y = serverPlayer.y
          }
        }
      }
      return
    }
    
    // Interpolate between snapshots
    const timeDiff = snapshot2.timestamp - snapshot1.timestamp
    const t = timeDiff > 0 ? (renderTime - snapshot1.timestamp) / timeDiff : 0
    
    for (const serverPlayer of snapshot1.players) {
      if (serverPlayer.id === this.playerId) continue
      
      const player = this.players.get(serverPlayer.id)
      if (!player) continue
      
      const player2 = snapshot2.players.find(p => p.id === serverPlayer.id)
      if (!player2) continue
      
      // Lerp position
      player.x = serverPlayer.x + (player2.x - serverPlayer.x) * t
      player.y = serverPlayer.y + (player2.y - serverPlayer.y) * t
    }
  }

  private send(message: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private updatePlayersCallback() {
    if (this.onPlayersUpdateCallback) {
      this.onPlayersUpdateCallback(Array.from(this.players.values()))
    }
  }

  // Public API
  onPlayersUpdate(callback: (players: Player[]) => void) {
    this.onPlayersUpdateCallback = callback
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback
  }

  getLocalPlayer(): Player | null {
    return this.localPlayer
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  isPlayerConnected(): boolean {
    return this.isConnected && this.playerId !== null
  }

  destroy() {
    this.disconnect()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}