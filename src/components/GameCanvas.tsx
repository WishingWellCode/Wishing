import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/GameContext'

interface GameCanvasProps {
  isWalletConnected?: boolean
}

export default function GameCanvas({ isWalletConnected = false }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, updatePlayerPosition, throwCoins } = useGame()

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const initializeGame = async () => {
      console.log('🔍 DEBUG: Initializing game, wallet connected:', isWalletConnected)
      const Phaser = await import('phaser')
      const { LandingScene } = await import('../scenes/LandingScene')
      const { TestScene } = await import('../scenes/TestScene')

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO, // Let Phaser choose the best renderer
        parent: containerRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelArt: true,
        transparent: true,
        backgroundColor: 0x000000,
        antialias: false, // Disable antialiasing for better performance
        roundPixels: true, // Prevent pixel rounding issues
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false // Disable debug for better performance
          }
        },
        scene: [LandingScene, TestScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%'
        },
        render: {
          powerPreference: 'high-performance',
          antialias: false,
          mipmapFilter: 'LINEAR',
          roundPixels: true
        },
        fps: {
          target: 60,
          forceSetTimeOut: true
        }
      }

      gameRef.current = new Phaser.Game(config)

      gameRef.current.registry.set('gameContext', {
        gameState,
        updatePlayerPosition,
        throwCoins
      })

      console.log('🎮 Phaser game initialized with both scenes')
      
      // Start with appropriate initial scene
      const sceneManager = gameRef.current.scene
      if (isWalletConnected) {
        console.log('🔍 DEBUG: Starting with TestScene (wallet connected)')
        sceneManager.start('TestScene')
      } else {
        console.log('🔍 DEBUG: Starting with LandingScene (no wallet)')
        sceneManager.start('LandingScene')
      }
    }

    initializeGame()
    
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  // Handle wallet connection changes
  useEffect(() => {
    if (gameRef.current && gameRef.current.scene) {
      const sceneManager = gameRef.current.scene
      
      console.log('🔍 DEBUG: Wallet connection changed:', isWalletConnected)
      console.log('🔍 DEBUG: Available scenes:', sceneManager.scenes.map(s => s.scene.key))
      console.log('🔍 DEBUG: Active scenes:', sceneManager.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key))
      
      if (isWalletConnected) {
        // Switch to TestScene when wallet connects
        const landingScene = sceneManager.getScene('LandingScene')
        const testScene = sceneManager.getScene('TestScene')
        
        console.log('🔍 DEBUG: LandingScene active?', landingScene?.scene.isActive())
        console.log('🔍 DEBUG: TestScene active?', testScene?.scene.isActive())
        
        if (landingScene?.scene.isActive()) {
          console.log('🔍 DEBUG: Stopping LandingScene')
          sceneManager.stop('LandingScene')
        }
        if (!testScene?.scene.isActive()) {
          console.log('🔍 DEBUG: Starting TestScene')
          sceneManager.start('TestScene')
        }
        console.log('🎮 Switched to TestScene (with portals and gambling)')
      } else {
        // Switch to LandingScene when wallet disconnects  
        const landingScene = sceneManager.getScene('LandingScene')
        const testScene = sceneManager.getScene('TestScene')
        
        if (testScene?.scene.isActive()) {
          console.log('🔍 DEBUG: Stopping TestScene')
          sceneManager.stop('TestScene')
        }
        if (!landingScene?.scene.isActive()) {
          console.log('🔍 DEBUG: Starting LandingScene')
          sceneManager.start('LandingScene')
        }
        console.log('🎮 Switched to LandingScene (landing page)')
      }
      
      // Final state check
      console.log('🔍 DEBUG: Final active scenes:', sceneManager.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key))
    }
  }, [isWalletConnected])

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('gameContext', {
        gameState,
        updatePlayerPosition,
        throwCoins
      })
    }
  }, [gameState, updatePlayerPosition, throwCoins])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        background: 'transparent',
        position: 'relative',
        zIndex: 1
      }}
    />
  )
}