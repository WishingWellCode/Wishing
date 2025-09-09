import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { MultiplayerClient } from '@/lib/multiplayer'

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

interface MultiplayerSystemProps {
  isActive: boolean
}

export default function MultiplayerSystem({ isActive }: MultiplayerSystemProps) {
  const { publicKey, connected } = useWallet()
  const multiplayerClientRef = useRef<MultiplayerClient | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null)
  
  // Input handling
  const keysRef = useRef({
    left: false, right: false, up: false, down: false,
    a: false, d: false, w: false, s: false
  })

  // Initialize multiplayer client
  useEffect(() => {
    if (isActive && connected && publicKey) {
      console.log('🎮 Initializing multiplayer system')
      
      const client = new MultiplayerClient()
      multiplayerClientRef.current = client
      
      // Set up callbacks
      client.onPlayersUpdate((updatedPlayers) => {
        setPlayers(updatedPlayers)
        setLocalPlayer(client.getLocalPlayer())
      })
      
      client.onConnectionChange((connected) => {
        setIsConnected(connected)
      })
      
      // Connect to server
      client.connect(publicKey.toString())
      
      return () => {
        client.destroy()
        multiplayerClientRef.current = null
      }
    } else {
      // Disconnect if not active or wallet not connected
      if (multiplayerClientRef.current) {
        multiplayerClientRef.current.destroy()
        multiplayerClientRef.current = null
      }
      setPlayers([])
      setLocalPlayer(null)
      setIsConnected(false)
    }
  }, [isActive, connected, publicKey])

  // Keyboard input handling
  useEffect(() => {
    if (!isActive || !isConnected) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      let changed = false
      
      switch (key) {
        case 'arrowleft':
        case 'a':
          if (!keysRef.current.left && !keysRef.current.a) {
            keysRef.current.left = key === 'arrowleft'
            keysRef.current.a = key === 'a'
            changed = true
          }
          break
        case 'arrowright':
        case 'd':
          if (!keysRef.current.right && !keysRef.current.d) {
            keysRef.current.right = key === 'arrowright'
            keysRef.current.d = key === 'd'
            changed = true
          }
          break
        case 'arrowup':
        case 'w':
          if (!keysRef.current.up && !keysRef.current.w) {
            keysRef.current.up = key === 'arrowup'
            keysRef.current.w = key === 'w'
            changed = true
          }
          break
        case 'arrowdown':
        case 's':
          if (!keysRef.current.down && !keysRef.current.s) {
            keysRef.current.down = key === 'arrowdown'
            keysRef.current.s = key === 's'
            changed = true
          }
          break
      }
      
      if (changed && multiplayerClientRef.current) {
        multiplayerClientRef.current.updateInput(keysRef.current)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      let changed = false
      
      switch (key) {
        case 'arrowleft':
        case 'a':
          if (keysRef.current.left || keysRef.current.a) {
            keysRef.current.left = false
            keysRef.current.a = false
            changed = true
          }
          break
        case 'arrowright':
        case 'd':
          if (keysRef.current.right || keysRef.current.d) {
            keysRef.current.right = false
            keysRef.current.d = false
            changed = true
          }
          break
        case 'arrowup':
        case 'w':
          if (keysRef.current.up || keysRef.current.w) {
            keysRef.current.up = false
            keysRef.current.w = false
            changed = true
          }
          break
        case 'arrowdown':
        case 's':
          if (keysRef.current.down || keysRef.current.s) {
            keysRef.current.down = false
            keysRef.current.s = false
            changed = true
          }
          break
      }
      
      if (changed && multiplayerClientRef.current) {
        multiplayerClientRef.current.updateInput(keysRef.current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isActive, isConnected])

  const getSpriteUrl = (spriteName: string) => {
    return `/assets/sprites/Multiplayer-sprites/${spriteName}.png`
  }

  if (!isActive) {
    return null
  }

  return (
    <>
      {/* Connection Status */}
      <div className="absolute top-2 left-2 z-50">
        <div className="bg-black/80 text-white p-2 rounded text-xs font-pixel">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Multiplayer Connected' : 'Connecting...'}</span>
          </div>
          {isConnected && (
            <div className="mt-1 text-xs opacity-75">
              {players.length} players online
              {localPlayer && (
                <div className="text-green-400">You: {localPlayer.username} ({Math.round(localPlayer.x)}, {Math.round(localPlayer.y)})</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player Sprites Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {players.map((player) => (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${player.x}px`,
              top: `${player.y}px`,
              transition: player.id === localPlayer?.id ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
              zIndex: player.id === localPlayer?.id ? 45 : 44
            }}
          >
            {/* Player Sprite */}
            <div className="relative">
              <img
                src={getSpriteUrl(player.spriteName)}
                alt={`Player ${player.username}`}
                className="w-12 h-12 drop-shadow-lg"
                style={{
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
                }}
                onError={(e) => {
                  console.warn(`Failed to load sprite: ${player.spriteName}`)
                  e.currentTarget.src = '/assets/sprites/Multiplayer-sprites/default.png'
                }}
              />
              
              {/* Username Label */}
              <div
                className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs font-pixel whitespace-nowrap border border-white/30"
                style={{
                  fontSize: '10px',
                  textShadow: '1px 1px 2px rgba(0,0,0,1)',
                  textAlign: 'center'
                }}
              >
                {player.username}
              </div>
              
              {/* Local Player Indicator */}
              {player.id === localPlayer?.id && (
                <div
                  className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,255,0,0.3) 0%, transparent 70%)',
                    transform: 'scale(1.5)'
                  }}
                />
              )}
              
              {/* Other Players Glow */}
              {player.id !== localPlayer?.id && (
                <div
                  className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,150,255,0.2) 0%, transparent 70%)',
                    transform: 'scale(1.3)'
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

    </>
  )
}