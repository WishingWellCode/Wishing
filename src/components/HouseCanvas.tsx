import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Phaser from 'phaser'
import { HouseScene } from '@/scenes/HouseScene'

interface HouseCanvasProps {
  houseLevel: number
  portalCoords?: { x: number, y: number }[]
}

export interface HouseCanvasRef {
  getHouseScene: () => HouseScene | null
}

const HouseCanvas = forwardRef<HouseCanvasRef, HouseCanvasProps>(({ houseLevel, portalCoords }, ref) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    getHouseScene: () => {
      if (gameRef.current) {
        return gameRef.current.scene.getScene('HouseScene') as HouseScene
      }
      return null
    }
  }))

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
  
  // Set up portal when scene is ready
  useEffect(() => {
    if (!portalCoords || portalCoords.length === 0) {
      console.log('⚠️ No portal coords provided to HouseCanvas')
      return
    }
    
    const setupPortal = () => {
      if (!gameRef.current) {
        console.log('⏳ Game not ready for portal setup')
        return false
      }
      
      const scene = gameRef.current.scene.getScene('HouseScene') as HouseScene
      if (!scene) {
        console.log('⏳ HouseScene not found yet')
        return false
      }
      
      if (!scene.sceneReady) {
        console.log('⏳ HouseScene not ready yet')
        return false
      }
      
      // Set up the portal
      scene.setExitPortal(portalCoords)
      console.log('✅ Portal set up successfully in HouseCanvas!')
      return true
    }
    
    // Try to set up portal with retries
    let attempts = 0
    const maxAttempts = 30
    
    const trySetup = () => {
      attempts++
      const success = setupPortal()
      
      if (!success && attempts < maxAttempts) {
        setTimeout(trySetup, 200)
      }
    }
    
    // Start trying after a small delay
    const timer = setTimeout(trySetup, 100)
    
    return () => clearTimeout(timer)
  }, [portalCoords, houseLevel])

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
})

HouseCanvas.displayName = 'HouseCanvas'

export default HouseCanvas