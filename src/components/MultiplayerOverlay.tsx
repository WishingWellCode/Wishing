import { useEffect, useState } from 'react'

interface Player {
  id: string
  walletAddress: string
  username: string
  x: number
  y: number
  sprite: string
}

interface MultiplayerOverlayProps {
  players: Player[]
  currentPlayerId?: string | null
}

export default function MultiplayerOverlay({ players, currentPlayerId }: MultiplayerOverlayProps) {
  const [visiblePlayers, setVisiblePlayers] = useState<Player[]>([])

  useEffect(() => {
    // Show ALL players including current player (don't filter out current player)
    // and ensure players are within reasonable bounds
    const filtered = players.filter(player => {
      const hasValidData = player.x !== undefined && player.y !== undefined && player.username
      const isInBounds = player.x >= -100 && player.x <= window.innerWidth + 100 &&
                        player.y >= -100 && player.y <= window.innerHeight + 100
      return hasValidData && isInBounds
    })
    
    console.log('👥 Filtered players for overlay:', filtered.length, 'of', players.length)
    console.log('👥 Current player ID:', currentPlayerId)
    console.log('👥 All players with data:', players)
    console.log('👥 Filtered visible players:', filtered)
    
    setVisiblePlayers(filtered)
  }, [players, currentPlayerId])

  const getSpriteUrl = (spriteName: string) => {
    // Map sprite names to actual custom multiplayer sprite files
    const spriteMap: { [key: string]: string } = {
      blue: '/assets/sprites/Multiplayer-sprites/blue.png',
      default: '/assets/sprites/Multiplayer-sprites/default.png',
      grey: '/assets/sprites/Multiplayer-sprites/grey.png',
      lime: '/assets/sprites/Multiplayer-sprites/lime.png',
      ping: '/assets/sprites/Multiplayer-sprites/ping.png',
      red: '/assets/sprites/Multiplayer-sprites/red.png'
    }
    
    return spriteMap[spriteName] || '/assets/sprites/Multiplayer-sprites/default.png'
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {visiblePlayers.map((player) => (
        <div
          key={player.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${player.x}px`,
            top: `${player.y}px`,
            transition: 'left 0.1s ease-out, top 0.1s ease-out' // Smooth movement
          }}
        >
          {/* Player sprite */}
          <div className="relative">
            <img
              src={getSpriteUrl(player.sprite)}
              alt={`Player ${player.username}`}
              className="w-8 h-8 drop-shadow-lg"
              style={{
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            />
            
            {/* Username label */}
            <div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs font-pixel whitespace-nowrap"
              style={{
                fontSize: '10px',
                textShadow: '1px 1px 2px rgba(0,0,0,1)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              {player.username}
            </div>
            
            {/* Presence indicator (optional glowing effect) */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)',
                transform: 'scale(1.5)'
              }}
            />
          </div>
        </div>
      ))}
      
      {/* Player count indicator */}
      <div className="fixed bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg text-xs font-pixel">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${visiblePlayers.length > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{visiblePlayers.length} players visible</span>
        </div>
        <div className="text-xs mt-1 opacity-75">
          Total: {players.length} | Current: {currentPlayerId ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  )
}