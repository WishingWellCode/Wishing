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
  const positionUpdateTimeout = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(false)

  // Trigger connection check on mount
  useEffect(() => {
    mountedRef.current = true
    console.log('🎮 MultiplayerManager mounted, checking connection')
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Connect to multiplayer when wallet is connected and component is active
  useEffect(() => {
    if (isActive && connected && publicKey) {
      // Always attempt to connect if we should be connected but aren't
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('🎮 MultiplayerManager: Connecting/Reconnecting to multiplayer')
        connectMultiplayer()
      }
    } else if ((!isActive || !connected) && wsRef.current) {
      console.log('🎮 MultiplayerManager: Disconnecting from multiplayer')
      disconnectMultiplayer()
    }
    
    return () => {
      // Don't disconnect on unmount if we should stay connected
      if (!isActive || !connected) {
        disconnectMultiplayer()
      }
    }
  }, [isActive, connected, publicKey])

  const connectMultiplayer = () => {
    if (!publicKey) return

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
        publicKey: publicKey.toString()
      })
      
      const ws = new WebSocket(workerUrl)
      
      ws.onopen = () => {
        console.log('🎮 ✅ CONNECTED to multiplayer server at:', workerUrl)
        setIsConnected(true)
        
        // Join the game
        try {
          const joinMessage = {
            type: 'join',
            walletAddress: publicKey.toString()
          }
          console.log('🎮 📤 SENDING JOIN MESSAGE:', joinMessage)
          ws.send(JSON.stringify(joinMessage))
        } catch (error) {
          console.error('🎮 ❌ ERROR sending join message:', error)
        }
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
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (positionUpdateTimeout.current) {
      clearTimeout(positionUpdateTimeout.current)
      positionUpdateTimeout.current = null
    }
    
    setIsConnected(false)
    setPlayers([])
    playerIdRef.current = null
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

  const updatePosition = (x: number, y: number) => {
    if (!wsRef.current || !playerIdRef.current || !isConnected) return
    
    // Update local player position in state immediately for smooth movement
    setPlayers(prev => {
      const updated = prev.map(p => 
        p.id === playerIdRef.current 
          ? { ...p, x: Math.round(x), y: Math.round(y) }
          : p
      )
      onPlayersUpdate?.(updated)
      return updated
    })
    
    // Send position updates immediately for smooth real-time movement
    // Use a much shorter throttle (16ms = ~60fps) for fluid movement
    if (positionUpdateTimeout.current) {
      clearTimeout(positionUpdateTimeout.current)
    }
    
    positionUpdateTimeout.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'move',
            x: Math.round(x), // Round positions to reduce precision spam
            y: Math.round(y)
          }))
        } catch (error) {
          console.error('Error sending position update:', error)
          setIsConnected(false)
        }
      }
    }, 16) // Update at ~60fps for smooth movement
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
        playerId: playerIdRef.current
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