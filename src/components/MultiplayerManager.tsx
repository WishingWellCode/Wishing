import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface Player {
  id: string
  walletAddress: string
  username: string
  x: number
  y: number
  sprite: string
}

interface MultiplayerManagerProps {
  isActive: boolean
  onPlayersUpdate?: (players: Player[]) => void
}

export default function MultiplayerManager({ isActive, onPlayersUpdate }: MultiplayerManagerProps) {
  const { publicKey, connected } = useWallet()
  const [players, setPlayers] = useState<Player[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const isConnectedRef = useRef(false)
  const wsRef = useRef<WebSocket | null>(null)
  const playerIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Trigger connection check on mount
  useEffect(() => {
    mountedRef.current = true
    console.log('🎮 MultiplayerManager mounted, checking connection')
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Connect to multiplayer - now supports spectator mode without wallet
  useEffect(() => {
    if (isActive) {
      // Always attempt to connect if active (spectator or player mode)
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('🎮 MultiplayerManager: Connecting to multiplayer', connected ? 'as player' : 'as spectator')
        connectMultiplayer()
      }
    } else {
      console.log('🎮 MultiplayerManager: Disconnecting from multiplayer (inactive)')
      // Clear players when disconnecting
      setPlayers([])
      if (wsRef.current) {
        disconnectMultiplayer()
      }
    }
    
    return () => {
      // Don't disconnect on unmount if we should stay connected
      if (!isActive) {
        disconnectMultiplayer()
      }
    }
  }, [isActive])

  // Handle wallet address changes specifically (wallet switching or connecting)
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (publicKey) {
        // Wallet just connected - upgrade from spectator to player
        console.log('🎮 Wallet connected - upgrading to player mode')
        const joinMessage = {
          type: 'join',
          walletAddress: publicKey.toString()
        }
        wsRef.current.send(JSON.stringify(joinMessage))
      } else if (playerIdRef.current) {
        // Wallet disconnected - switch to spectator mode but STAY CONNECTED
        console.log('🎮 Wallet disconnected - switching to spectator mode (staying connected)')
        playerIdRef.current = null
        
        // Clear local player from Phaser scenes so it can be respawned on reconnect
        forwardMessageToScenes({ type: 'clearLocalPlayer' })
        
        // Send spectate message to switch to spectator mode
        const spectatorMessage = {
          type: 'spectate'
        }
        console.log('🎮 📤 SENDING SPECTATE MESSAGE (wallet disconnected):', spectatorMessage)
        wsRef.current.send(JSON.stringify(spectatorMessage))
        // DO NOT disconnect or clear players - we want to keep watching!
      }
    } else if (!wsRef.current && isActive) {
      // If no connection but should be active, connect as spectator
      console.log('🎮 No connection but should be active - connecting as spectator')
      connectMultiplayer()
    }
  }, [publicKey?.toString(), isActive])

  const connectMultiplayer = () => {
    // Allow connection even without publicKey (spectator mode)
    
    // Clean up existing connection first
    if (wsRef.current) {
      console.log('🎮 Cleaning up existing connection')
      wsRef.current.close()
      wsRef.current = null
      setIsConnected(false)
    }

    try {
      // Connect to Cloudflare Worker WebSocket endpoint
      // For production, use the worker URL, for local development use localhost
      const isLocal = window.location.hostname === 'localhost'
      const workerUrl = isLocal 
        ? 'ws://localhost:8787' // Local wrangler dev server
        : 'wss://wish-well-worker.stealthbundlebot.workers.dev' // Production worker
      
      console.log('🎮 DEBUG: Connection details:', {
        hostname: window.location.hostname,
        isLocal,
        workerUrl,
        publicKey: publicKey?.toString() || 'spectator',
        mode: publicKey ? 'player' : 'spectator'
      })
      
      const ws = new WebSocket(workerUrl)
      
      ws.onopen = () => {
        console.log('🎮 ✅ CONNECTED to multiplayer server at:', workerUrl)
        console.log('🔍 DEBUG: WebSocket opened, setting wsRef.current =', ws)
        console.log('🔍 DEBUG: WebSocket readyState =', ws.readyState)
        isConnectedRef.current = true
        setIsConnected(true)
        
        // Join the game (as player or spectator)
        try {
          if (publicKey) {
            // Join as player with wallet
            const joinMessage = {
              type: 'join',
              walletAddress: publicKey.toString()
            }
            console.log('🎮 📤 SENDING JOIN MESSAGE (player):', joinMessage)
            console.log('🔍 DEBUG: Wallet address being sent:', publicKey.toString())
            console.log('🔍 DEBUG: Message JSON:', JSON.stringify(joinMessage))
            ws.send(JSON.stringify(joinMessage))
            
            // Set a timeout to check if we get a response
            setTimeout(() => {
              if (!playerIdRef.current) {
                console.error('🎮 ❌ TIMEOUT: No joined message received after 5 seconds')
                console.log('🔍 DEBUG: Current playerIdRef:', playerIdRef.current)
                console.log('🔍 DEBUG: Current wsRef state:', ws.readyState)
                console.log('🔍 DEBUG: Trying spectator mode as fallback...')
                
                // Try spectator mode as fallback
                try {
                  const spectatorMessage = { type: 'spectate' }
                  console.log('🎮 📤 SENDING SPECTATE MESSAGE (fallback):', spectatorMessage)
                  ws.send(JSON.stringify(spectatorMessage))
                } catch (error) {
                  console.error('🎮 ❌ Error sending spectator fallback:', error)
                }
              }
            }, 5000)
          } else {
            // Join as spectator without wallet
            const spectatorMessage = {
              type: 'spectate'
            }
            console.log('🎮 📤 SENDING SPECTATE MESSAGE:', spectatorMessage)
            ws.send(JSON.stringify(spectatorMessage))
          }
        } catch (error) {
          console.error('🎮 ❌ ERROR sending join/spectate message:', error)
        }
        
        // Start keepalive ping every 30 seconds to prevent disconnection
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'ping', 
              timestamp: Date.now() 
            }))
          }
        }, 20000) // Ping every 20 seconds to prevent Cloudflare timeout
        
        // Notify scenes that connection is established
        window.dispatchEvent(new CustomEvent('multiplayerConnected', {
          detail: { isConnected: true, mode: publicKey ? 'player' : 'spectator' }
        }))
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMultiplayerMessage(message)
        } catch (error) {
          console.error('Error parsing multiplayer message:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log('🎮 ❌ DISCONNECTED from multiplayer server', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: workerUrl
        })
        
        // Clean up ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        isConnectedRef.current = false
        setIsConnected(false)
        wsRef.current = null
        playerIdRef.current = null
      }
      
      ws.onerror = (error) => {
        console.error('🎮 💥 WEBSOCKET ERROR:', error, 'URL:', workerUrl)
        isConnectedRef.current = false
        setIsConnected(false)
      }
      
      // Set wsRef FIRST before any state updates that cause re-renders
      wsRef.current = ws
      console.log('🔍 DEBUG: wsRef.current set to:', wsRef.current)
      console.log('🔍 DEBUG: wsRef.current readyState:', wsRef.current?.readyState)
      
    } catch (error) {
      console.error('Error connecting to multiplayer:', error)
    }
  }

  const disconnectMultiplayer = () => {
    console.log('🎮 🔌 Disconnecting from multiplayer...')
    
    // Send leave message before closing connection if still connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && playerIdRef.current) {
      try {
        const leaveMessage = {
          type: 'leave',
          playerId: playerIdRef.current
        }
        console.log('🎮 📤 Sending leave message:', leaveMessage)
        wsRef.current.send(JSON.stringify(leaveMessage))
      } catch (error) {
        console.error('🎮 ❌ Error sending leave message:', error)
      }
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    // Clear all state immediately
    isConnectedRef.current = false
    setIsConnected(false)
    setPlayers([])
    playerIdRef.current = null
    
    console.log('🎮 ✅ Disconnected from multiplayer and cleared all player data')
  }

  // Forward multiplayer messages to active Phaser scenes for WorldRenderer handling
  const forwardMessageToScenes = (message: any) => {
    // Get the current active scene from Phaser
    try {
      // Try to get the current scene and forward the message
      const scenes = ['LandingScene', 'TestScene']
      let messageForwarded = false
      
      for (const sceneName of scenes) {
        // Check if the scene exists in the global Phaser game instance
        if (typeof window !== 'undefined' && (window as any).game) {
          const game = (window as any).game
          const scene = game.scene.getScene(sceneName)
          
          if (scene && scene.scene.isActive() && scene.handleMultiplayerMessage) {
            console.log(`📤 Forwarding message to active scene: ${sceneName}`, message.type)
            scene.handleMultiplayerMessage(message)
            messageForwarded = true
            break
          }
        }
      }
      
      if (!messageForwarded) {
        console.log(`⚠️ No active scene found to forward message:`, message.type)
      }
    } catch (error) {
      console.error('Error forwarding message to scenes:', error)
    }
  }

  const handleMultiplayerMessage = (message: any) => {
    // Log ALL messages to debug join issue
    console.log('🎮 📥 RECEIVED MESSAGE:', message.type, message)
    
    // Special debug for join-related messages
    if (message.type === 'joined' || message.type === 'error' || message.type === 'spectate') {
      console.log('🔍 DEBUG JOIN MESSAGE:', JSON.stringify(message, null, 2))
    }
    
    switch (message.type) {
      case 'pong':
        // Server responded to our ping - connection is alive
        console.log('🎮 💓 Pong received - connection alive')
        break
        
      case 'currentPlayers':
        // Legacy spectator mode - received current players (keeping for compatibility)
        console.log(`👁️ SPECTATOR: Received currentPlayers message`, message)
        if (message.players && Array.isArray(message.players)) {
          console.log(`👁️ SPECTATOR: Setting ${message.players.length} players:`, message.players)
          setPlayers(message.players)
          onPlayersUpdate?.(message.players)
          // Forward to scenes for WorldRenderer
          forwardMessageToScenes(message)
        } else {
          console.log('👁️ SPECTATOR: Invalid players array in currentPlayers message:', message.players)
        }
        break
        
      case 'stateSnapshot':
        // New spectator mode - received game state snapshot
        console.log(`👁️ SPECTATOR: Received stateSnapshot message`, message)
        if (message.players && Array.isArray(message.players)) {
          console.log(`👁️ SPECTATOR: Setting ${message.players.length} players:`, message.players)
          setPlayers(message.players)
          onPlayersUpdate?.(message.players)
          // Forward to scenes for WorldRenderer
          forwardMessageToScenes(message)
        } else {
          console.log('👁️ SPECTATOR: Invalid players array in stateSnapshot message:', message.players)
        }
        break
        
      case 'joined':
        playerIdRef.current = message.playerId
        if (message.allPlayers) {
          // Include ALL players including current player for proper display
          console.log(`🎮 ✅ JOINED SUCCESSFULLY! Received ${message.allPlayers.length} total players:`)
          message.allPlayers.forEach((player: any, index: number) => {
            console.log(`  🧑‍🤝‍🧑 Player ${index + 1}: ${player.username} (${player.id.slice(0,8)}) at (${player.x},${player.y}) sprite:${player.sprite}`)
          })
          setPlayers(message.allPlayers)
          onPlayersUpdate?.(message.allPlayers)
          // Forward to scenes for WorldRenderer
          forwardMessageToScenes(message)
        }
        console.log(`🎮 🆔 YOU ARE PLAYER: ${message.playerId} with sprite ${message.player.sprite} and username ${message.player.username}`)
        break
        
      case 'playerJoined':
        console.log(`🎮 🆕 NEW PLAYER JOINED: ${message.player.username} (${message.player.id.slice(0,8)}) sprite:${message.player.sprite} at (${message.player.x},${message.player.y})`)
        setPlayers(prev => {
          const updated = [...prev, message.player]
          console.log(`🎮 👥 TOTAL PLAYERS AFTER JOIN: ${updated.length}`)
          console.log(`🎮 📋 ALL CURRENT PLAYERS:`, updated.map(p => `${p.username}(${p.id.slice(0,8)})`))
          onPlayersUpdate?.(updated)
          return updated
        })
        
        // Forward to scenes for WorldRenderer
        forwardMessageToScenes(message)
        break
        
      case 'playerLeft':
        console.log(`🎮 PLAYER LEFT: ${message.playerId}`)
        setPlayers(prev => {
          const updated = prev.filter(p => p.id !== message.playerId)
          console.log(`🎮 Total players after leave: ${updated.length}`)
          onPlayersUpdate?.(updated)
          return updated
        })
        
        // Forward to scenes for WorldRenderer
        forwardMessageToScenes(message)
        break
        
      case 'playerMoved':
        // Handle player movement for both spectator and player modes
        const playerData = message.player || {
          id: message.playerId,
          x: message.x,
          y: message.y,
          username: message.username || message.playerId?.slice(0, 5) || 'Unknown',
          sprite: message.sprite || 'default',
          walletAddress: message.walletAddress || 'unknown'
        }
        
        setPlayers(prev => {
          // Check if player exists in our list
          const playerExists = prev.some(p => p.id === playerData.id)
          
          if (playerExists) {
            // Update existing player position
            const updated = prev.map(p => 
              p.id === playerData.id 
                ? { ...p, x: playerData.x, y: playerData.y }
                : p
            )
            onPlayersUpdate?.(updated)
            return updated
          } else {
            // Player not in our list (spectator mode) - add them with provided info
            console.log(`👁️ SPECTATOR: Adding new player ${playerData.id} to list`)
            const newPlayer = {
              id: playerData.id,
              walletAddress: playerData.walletAddress,
              username: playerData.username,
              x: playerData.x,
              y: playerData.y,
              sprite: playerData.sprite
            }
            const updated = [...prev, newPlayer]
            onPlayersUpdate?.(updated)
            return updated
          }
        })
        
        // Forward movement to scenes for WorldRenderer
        forwardMessageToScenes(message)
        break
        
      case 'fountainUpdate':
        console.log('🎮 Fountain update:', message)
        // Handle fountain/gambling updates if needed
        break
        
      default:
        console.log('🎮 Unknown message type:', message.type)
        break
    }
  }

  const lastSentPosition = useRef({ x: 0, y: 0 })
  const lastSendTime = useRef(0)

  // Create a single stable updatePosition function that uses refs to avoid closure issues
  const updatePosition = useRef<(x: number, y: number) => void>()
  
  // Initialize the function ONCE and never reassign it
  if (!updatePosition.current) {
    updatePosition.current = (x: number, y: number) => {
      // Get fresh references at execution time - no closure capture!
      const currentWs = wsRef.current
      const currentPlayerId = playerIdRef.current
      const currentConnected = isConnectedRef.current
      
      console.log(`🎮 updatePosition called with (${x}, ${y}), connected: ${currentConnected}, playerId: ${currentPlayerId}`)
      console.log(`🔍 DEBUG wsRef details:`, {
        wsRefExists: !!currentWs,
        wsRefValue: currentWs,
        wsRefReadyState: currentWs?.readyState,
        webSocketOpen: currentWs?.readyState === WebSocket.OPEN
      })
      
      if (!currentWs || currentWs.readyState !== WebSocket.OPEN || !currentPlayerId || !currentConnected) {
        console.log(`⚠️ updatePosition failed: wsRef=${!!currentWs}, wsReadyState=${currentWs?.readyState}, playerId=${currentPlayerId}, connected=${currentConnected}`)
        return
      }
      
      const roundedX = Math.round(x)
      const roundedY = Math.round(y)
      
      // Update local player position in state immediately for smooth movement
      setPlayers(prev => {
        console.log(`📍 Updating position for player ${currentPlayerId} to (${roundedX}, ${roundedY})`)
        console.log(`Current players:`, prev.map(p => `${p.id} at (${p.x},${p.y})`))
        const updated = prev.map(p => 
          p.id === currentPlayerId 
            ? { ...p, x: roundedX, y: roundedY }
            : p
        )
        console.log(`Updated players:`, updated.map(p => `${p.id} at (${p.x},${p.y})`))
        onPlayersUpdate?.(updated)
        return updated
      })
      
      // Send updates immediately if position changed and enough time has passed
      const now = Date.now()
      const timeSinceLastSend = now - lastSendTime.current
      
      // Check if position actually changed significantly (at least 2 pixels)
      const deltaX = Math.abs(lastSentPosition.current.x - roundedX)
      const deltaY = Math.abs(lastSentPosition.current.y - roundedY)
      
      if (deltaX >= 2 || deltaY >= 2) {
        // Send at 30fps (33ms) for smoother, less stuttery movement
        if (timeSinceLastSend >= 33) {
          // Get fresh WebSocket reference again just before sending
          const sendWs = wsRef.current
          if (sendWs && sendWs.readyState === WebSocket.OPEN) {
            try {
              sendWs.send(JSON.stringify({
                type: 'move',
                x: roundedX,
                y: roundedY
              }))
              lastSentPosition.current = { x: roundedX, y: roundedY }
              lastSendTime.current = now
              console.log(`📡 SENT POSITION UPDATE: (${roundedX}, ${roundedY})`)
            } catch (error) {
              console.error('Error sending position update:', error)
              setIsConnected(false)
            }
          }
        }
      }
    }
  }

  const sendGamblingUpdate = (result: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    
    wsRef.current.send(JSON.stringify({
      type: 'gamble',
      result
    }))
  }

  // Expose updatePosition globally for GameContext
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Updating global updateMultiplayerPosition function, wsRef exists:', !!wsRef.current)
      // Use a wrapper that calls the current function
      ;(window as any).updateMultiplayerPosition = (x: number, y: number) => {
        if (updatePosition.current) {
          updatePosition.current(x, y)
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        ;(window as any).updateMultiplayerPosition = null
      }
    }
  }, [])

  // Expose methods for external use
  useEffect(() => {
    // Attach to window for Phaser scenes to access
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Updating multiplayerManager on window, wsRef exists:', !!wsRef.current)
      ;(window as any).multiplayerManager = {
        updatePosition: (x: number, y: number) => {
          if (updatePosition.current) {
            updatePosition.current(x, y)
          }
        },
        sendGamblingUpdate,
        players,
        isConnected,
        playerId: playerIdRef.current,
        reconnect: connectMultiplayer,  // Add reconnect method
        walletAddress: publicKey?.toString() || null,
        wsRef: wsRef.current  // Expose wsRef for debugging
      }
      
      // Log when multiplayer manager is ready
      if (isConnected && playerIdRef.current) {
        console.log('🎮 ✅ MultiplayerManager exposed to window:', {
          isConnected,
          playerId: playerIdRef.current,
          playerCount: players.length,
          walletAddress: publicKey?.toString() || 'spectator'
        })
        
        // Dispatch event to notify scenes that multiplayer is ready
        window.dispatchEvent(new CustomEvent('multiplayerReady', {
          detail: {
            isConnected,
            playerId: playerIdRef.current,
            players
          }
        }))
      }
    }
  }, [players, isConnected, publicKey])

  return (
    <div className="absolute top-2 left-2 z-50">
      {isActive && (
        <div className="bg-black/70 text-white p-2 rounded text-xs font-pixel">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Multiplayer Connected' : 'Connecting...'}</span>
            {!connected && isConnected && (
              <span className="text-cyan-400">[SPECTATOR]</span>
            )}
          </div>
          <div className="mt-1">
            {connected ? 'Players' : 'Spectating'}: {players.length} online
          </div>
        </div>
      )}
    </div>
  )
}