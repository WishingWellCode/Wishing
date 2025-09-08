import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { HouseScene } from '@/scenes/HouseScene'

interface HouseCanvasProps {
  houseLevel: number
}

export default function HouseCanvas({ houseLevel }: HouseCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      transparent: true,
      backgroundColor: 0x000000,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [HouseScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      }
    }

    gameRef.current = new Phaser.Game(config)

    // Start the scene with the house level data
    gameRef.current.scene.start('HouseScene', { houseLevel })
    
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  // Update house level when it changes
  useEffect(() => {
    if (gameRef.current && gameRef.current.scene) {
      const houseScene = gameRef.current.scene.getScene('HouseScene') as HouseScene
      if (houseScene && houseScene.scene.isActive()) {
        // Restart scene with new house level
        gameRef.current.scene.stop('HouseScene')
        gameRef.current.scene.start('HouseScene', { houseLevel })
      }
    }
  }, [houseLevel])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full absolute inset-0"
      style={{ 
        background: 'transparent',
        position: 'absolute',
        zIndex: 1
      }}
    />
  )
}