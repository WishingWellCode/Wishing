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
  }, [isActive, connected, publicKey])

  // Handle wallet address changes specifically (wallet switching)
  useEffect(() => {
    // If publicKey changes and we had a previous connection, disconnect immediately
    if (playerIdRef.current && wsRef.current) {
      console.log('🎮 🔄 Wallet address changed, forcing immediate disconnect...')
      disconnectMultiplayer()
      // Clear players immediately to remove old wallet's sprite
      setPlayers([])
    }
  }, [publicKey?.toString()])

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
            ws.send(JSON.stringify(joinMessage))
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
        }, 30000) // Ping every 30 seconds
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
        
        setIsConnected(false)
        wsRef.current = null
        playerIdRef.current = null
      }
      
      ws.onerror = (error) => {
        console.error('🎮 💥 WEBSOCKET ERROR:', error, 'URL:', workerUrl)
        setIsConnected(false)
      }
      
      wsRef.current = ws
      
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
    setIsConnected(false)
    setPlayers([])
    playerIdRef.current = null
    
    console.log('🎮 ✅ Disconnected from multiplayer and cleared all player data')
  }

  const handleMultiplayerMessage = (message: any) => {
    // Only log important events, not movement spam
    if (message.type !== 'playerMoved') {
      console.log('🎮 📥 RECEIVED MESSAGE:', message.type, message)
    }
    
    switch (message.type) {
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
        break
        
      case 'playerLeft':
        console.log(`🎮 PLAYER LEFT: ${message.playerId}`)
        setPlayers(prev => {
          const updated = prev.filter(p => p.id !== message.playerId)
          console.log(`🎮 Total players after leave: ${updated.length}`)
          onPlayersUpdate?.(updated)
          return updated
        })
        break
        
      case 'playerMoved':
        // Reduced movement logging to prevent spam
        setPlayers(prev => {
          const updated = prev.map(p => 
            p.id === message.playerId 
              ? { ...p, x: message.x, y: message.y }
              : p
          )
          onPlayersUpdate?.(updated)
          return updated
        })
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

  const updatePosition = (x: number, y: number) => {
    if (!wsRef.current || !playerIdRef.current || !isConnected) return
    
    const roundedX = Math.round(x)
    const roundedY = Math.round(y)
    
    // Update local player position in state immediately for smooth movement
    setPlayers(prev => {
      const updated = prev.map(p => 
        p.id === playerIdRef.current 
          ? { ...p, x: roundedX, y: roundedY }
          : p
      )
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
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({
              type: 'move',
              x: roundedX,
              y: roundedY
            }))
            lastSentPosition.current = { x: roundedX, y: roundedY }
            lastSendTime.current = now
          } catch (error) {
            console.error('Error sending position update:', error)
            setIsConnected(false)
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

  // Expose methods for external use
  useEffect(() => {
    // Attach to window for Phaser scenes to access
    if (typeof window !== 'undefined') {
      (window as any).multiplayerManager = {
        updatePosition,
        sendGamblingUpdate,
        players,
        isConnected,
        playerId: playerIdRef.current,
        reconnect: connectMultiplayer  // Add reconnect method
      }
      
      // Log when multiplayer manager is ready
      if (isConnected && playerIdRef.current) {
        console.log('🎮 ✅ MultiplayerManager exposed to window:', {
          isConnected,
          playerId: playerIdRef.current,
          playerCount: players.length
        })
      }
    }
  }, [players, isConnected])

  return (
    <div className="absolute top-2 left-2 z-50">
      {isActive && (
        <div className="bg-black/70 text-white p-2 rounded text-xs font-pixel">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Multiplayer Connected' : 'Connecting...'}</span>
          </div>
          <div className="mt-1">
            Players online: {players.length}
          </div>
        </div>
      )}
    </div>
  )
}