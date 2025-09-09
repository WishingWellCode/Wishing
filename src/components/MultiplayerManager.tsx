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
  
  // Connect to multiplayer when wallet is connected and component is active
  useEffect(() => {
    if (isActive && connected && publicKey && !wsRef.current) {
      connectMultiplayer()
    } else if ((!isActive || !connected) && wsRef.current) {
      disconnectMultiplayer()
    }
    
    return () => {
      disconnectMultiplayer()
    }
  }, [isActive, connected, publicKey])

  const connectMultiplayer = () => {
    if (!publicKey) return

    try {
      // Connect to Cloudflare Worker WebSocket endpoint
      // For production, use the worker URL, for local development use localhost
      const isLocal = window.location.hostname === 'localhost'
      const workerUrl = isLocal 
        ? 'ws://localhost:8787' // Local wrangler dev server
        : 'wss://wish-well-worker.stealthbundlebot.workers.dev' // Production worker
      
      console.log('🎮 Connecting to multiplayer server:', workerUrl)
      
      const ws = new WebSocket(workerUrl)
      
      ws.onopen = () => {
        console.log('🎮 Connected to multiplayer server')
        setIsConnected(true)
        
        // Join the game
        try {
          ws.send(JSON.stringify({
            type: 'join',
            walletAddress: publicKey.toString()
          }))
        } catch (error) {
          console.error('Error sending join message:', error)
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
      
      ws.onclose = () => {
        console.log('🎮 Disconnected from multiplayer server')
        setIsConnected(false)
        wsRef.current = null
        playerIdRef.current = null
      }
      
      ws.onerror = (error) => {
        console.error('🎮 Multiplayer WebSocket error:', error)
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
    switch (message.type) {
      case 'joined':
        playerIdRef.current = message.playerId
        if (message.allPlayers) {
          setPlayers(message.allPlayers)
          onPlayersUpdate?.(message.allPlayers)
        }
        console.log(`🎮 Joined as player ${message.playerId} with sprite ${message.player.sprite}`)
        break
        
      case 'playerJoined':
        setPlayers(prev => {
          const updated = [...prev, message.player]
          onPlayersUpdate?.(updated)
          return updated
        })
        console.log(`🎮 Player joined: ${message.player.username}`)
        break
        
      case 'playerLeft':
        setPlayers(prev => {
          const updated = prev.filter(p => p.id !== message.playerId)
          onPlayersUpdate?.(updated)
          return updated
        })
        console.log(`🎮 Player left: ${message.playerId}`)
        break
        
      case 'playerMoved':
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
    }
  }

  const updatePosition = (x: number, y: number) => {
    if (!wsRef.current || !playerIdRef.current || !isConnected) return
    
    // More aggressive throttling for better performance
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
    }, 100) // Update every 100ms at most (reduced from 50ms)
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