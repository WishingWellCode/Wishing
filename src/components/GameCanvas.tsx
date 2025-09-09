import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

interface GameCanvasProps {
  isWalletConnected?: boolean
}

export default function GameCanvas({ isWalletConnected = false }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    const initializeGame = async () => {
      if (!containerRef.current || !isWalletConnected || gameRef.current) return

      // Dynamic import to avoid SSR issues
      const Phaser = await import('phaser')
      const { LandingScene } = await import('../scenes/LandingScene')

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: containerRef.current,
        backgroundColor: 'transparent',
        scene: [LandingScene],
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
          antialias: false,
          pixelArt: true
        },
        fps: {
          target: 60,
          forceSetTimeOut: true
        }
      }

      try {
        gameRef.current = new Phaser.Game(config)
        console.log('🎮 Phaser game initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize Phaser game:', error)
      }
    }

    initializeGame()

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        console.log('🎮 Phaser game destroyed')
      }
    }
  }, [isWalletConnected])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100vw',
        height: '100vh'
      }}
    />
  )
}