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
  
  console.log('👀 DEBUG: MultiplayerOverlay rendered with', players.length, 'players, current:', currentPlayerId)

  useEffect(() => {
    console.log('👀 DEBUG: MultiplayerOverlay useEffect - Raw players:', players)
    console.log('👀 DEBUG: MultiplayerOverlay useEffect - Current player ID:', currentPlayerId)
    
    // Show ALL players including current player (don't filter out current player)
    // and ensure players are within reasonable bounds
    const filtered = players.filter(player => {
      const hasValidData = player.x !== undefined && player.y !== undefined && player.username
      const isInBounds = player.x >= -100 && player.x <= window.innerWidth + 100 &&
                        player.y >= -100 && player.y <= window.innerHeight + 100
      
      console.log('👀 DEBUG: Player filter check:', {
        username: player.username,
        x: player.x,
        y: player.y,
        hasValidData,
        isInBounds,
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      })
      
      return hasValidData && isInBounds
    })
    
    setVisiblePlayers(filtered)
    console.log('👀 DEBUG: MultiplayerOverlay filtered', filtered.length, 'visible players:', filtered.map(p => `${p.username}(${p.x},${p.y})`))
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

  // Debug sprite rendering
  if (visiblePlayers.length > 0) {
    console.log('👀 DEBUG: Rendering', visiblePlayers.length, 'sprites')
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 2147483647, // Maximum z-index value
        position: 'fixed', // Force new stacking context
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none' // Ensure no pointer interference
      }}
    >
      {visiblePlayers.map((player) => (
        <div
          key={player.id}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: `${player.x}px`,
            top: `${player.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.1s ease-out, top 0.1s ease-out',
            zIndex: 2147483647,
            pointerEvents: 'none' // Ensure sprite doesn't block portal interactions
          }}
        >
          {/* Player sprite */}
          <div className="relative">
            <img
              src={getSpriteUrl(player.sprite)}
              alt={`Player ${player.username}`}
              className="drop-shadow-lg"
              style={{
                width: '45px',
                height: '45px',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
              onLoad={() => console.log('👀 DEBUG: Sprite loaded for', player.username, 'at', player.x, player.y)}
              onError={(e) => console.error('👀 DEBUG: Sprite failed to load for', player.username, 'src:', getSpriteUrl(player.sprite), 'error:', e)}
            />
            
            {/* Username label - black banner with white text */}
            <div
              style={{
                position: 'absolute',
                top: '-32px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'black',
                border: '1px solid white',
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap'
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: '1',
                  fontFamily: 'monospace'
                }}
              >
                {player.username}
              </span>
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
      
      {/* Player count indicator - moved to bottom-right with white text */}
      <div 
        className="pointer-events-none"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 2147483647
        }}
      >
        <div 
          className="px-3 py-2 text-white font-pixel"
          style={{
            backgroundColor: 'black',
            border: '1px solid white',
            borderRadius: '4px',
            fontSize: '10px'
          }}
        >
          <div style={{ color: 'white', fontWeight: 'bold' }}>
            {visiblePlayers.length} players visible
          </div>
          <div style={{ color: 'white', fontSize: '9px', marginTop: '2px' }}>
            Total: {players.length} | Current: {currentPlayerId ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  )
}