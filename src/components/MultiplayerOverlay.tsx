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
  const [loadedSprites, setLoadedSprites] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Show ALL players INCLUDING yourself - MultiplayerOverlay handles the visual display
    const filtered = players.filter(player => {
      const hasValidData = player.x !== undefined && player.y !== undefined && player.username && player.sprite
      return hasValidData
    })
    
    console.log(`👁️ MultiplayerOverlay: Showing ${filtered.length} players, currentPlayerId: ${currentPlayerId}`)
    console.log('Players data:', filtered)
    
    // Debug current player specifically
    if (currentPlayerId) {
      const currentPlayer = filtered.find(p => p.id === currentPlayerId)
      console.log('🎮 Current player in overlay:', currentPlayer ? 
        `${currentPlayer.username} at (${currentPlayer.x},${currentPlayer.y}) sprite:${currentPlayer.sprite}` : 
        'NOT FOUND in filtered list')
    }
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

  // Removed debug logging spam

  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 10, // Very low z-index to stay behind all Phaser elements
        position: 'fixed', // Force new stacking context
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none' // Ensure no pointer interference
      }}
    >
      
      {visiblePlayers.map((player) => {
        // Use direct coordinates - TestScene and LandingScene should use same coordinate system
        const screenX = player.x
        const screenY = player.y
        
        return (
        <div
          key={player.id}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: `${screenX}px`,
            top: `${screenY}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.033s linear, top 0.033s linear',
            zIndex: 11, // Very low z-index to stay behind all Phaser elements
            pointerEvents: 'none'
          }}
        >
          {/* Player sprite */}
          <div className="relative">
            <img
              src={getSpriteUrl(player.sprite)}
              alt={`Player ${player.username}`}
              className="drop-shadow-lg"
              style={{
                width: '48px',
                height: '48px',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                opacity: 1,  // Always visible - no fade in needed
                transition: 'none'  // Remove transition for immediate display
              }}
              onLoad={() => {
                setLoadedSprites(prev => new Set(prev).add(player.id))
                console.log('✅ Sprite loaded for player:', player.username)
              }}
              onError={(e) => {
                console.error('❌ Sprite failed to load for', player.username, 'src:', getSpriteUrl(player.sprite))
                // Force a fallback sprite on error
                const img = e.target as HTMLImageElement
                img.src = '/assets/sprites/Multiplayer-sprites/default.png'
              }}
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
        )
      })}
      
    </div>
  )
}