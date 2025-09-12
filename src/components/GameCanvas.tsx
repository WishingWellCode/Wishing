import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/GameContext'

interface GameCanvasProps {
  isWalletConnected?: boolean
}

export default function GameCanvas({ isWalletConnected = false }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, updatePlayerPosition, throwCoins } = useGame()
  const isHandshakingRef = useRef(false)

  const handleSceneSwitching = async (walletConnected: boolean) => {
    if (!gameRef.current || !gameRef.current.scene || isHandshakingRef.current) return
    
    const sceneManager = gameRef.current.scene
    
    console.log('🔍 DEBUG: Scene switching - wallet connected:', walletConnected)
    
    // Start handshaking process - prevent multiple rapid switches
    isHandshakingRef.current = true
    
    const landingScene = sceneManager.getScene('LandingScene')
    const testScene = sceneManager.getScene('TestScene')
    
    // FORCE STOP ALL SCENES FIRST to prevent dual scenes
    console.log('🔍 DEBUG: Force stopping all scenes to prevent dual loading')
    if (landingScene?.scene.isActive()) {
      console.log('🔍 DEBUG: Stopping LandingScene')
      // Clean up any sprites before stopping scene
      if ((landingScene as any).player) {
        console.log('🔍 DEBUG: Destroying LandingScene player sprite')
        ;(landingScene as any).player.destroy()
        ;(landingScene as any).player = null
      }
      sceneManager.stop('LandingScene')
    }
    
    if (testScene?.scene.isActive()) {
      console.log('🔍 DEBUG: Stopping TestScene')
      // Clean up TestScene player too
      if ((testScene as any).testPlayer) {
        ;(testScene as any).testPlayer.destroy()
        ;(testScene as any).testPlayer = null
      }
      sceneManager.stop('TestScene')
    }
    
    // Small delay to ensure clean scene stop
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Start new scene after ensuring clean state
    if (walletConnected) {
      console.log('🔍 DEBUG: Starting ONLY TestScene (wallet connected)')
      sceneManager.start('TestScene')
      
      // Wait for multiplayer to be ready before creating player
      const waitForMultiplayer = async () => {
        let attempts = 0
        const maxAttempts = 10
        
        while (attempts < maxAttempts) {
          const mm = (window as any).multiplayerManager
          if (mm && mm.isConnected) {
            console.log('🔍 DEBUG: Multiplayer ready, creating player')
            const testScene = sceneManager.getScene('TestScene')
            if (testScene && !(testScene as any).testPlayer) {
              ;(testScene as any).createPlayer()
            }
            break
          }
          attempts++
          console.log(`🔍 DEBUG: Waiting for multiplayer... attempt ${attempts}/${maxAttempts}`)
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        // Create player anyway if multiplayer doesn't connect
        if (attempts >= maxAttempts) {
          console.log('🔍 DEBUG: Multiplayer timeout, creating player anyway')
          const testScene = sceneManager.getScene('TestScene')
          if (testScene && !(testScene as any).testPlayer) {
            ;(testScene as any).createPlayer()
          }
        }
      }
      
      waitForMultiplayer()
    } else {
      console.log('🔍 DEBUG: Starting ONLY LandingScene (no wallet)')
      sceneManager.start('LandingScene')
      // Ensure LandingScene knows wallet is disconnected
      const newLandingScene = sceneManager.getScene('LandingScene')
      if (newLandingScene && (newLandingScene as any).setWalletConnection) {
        ;(newLandingScene as any).setWalletConnection(false)
      }
    }
    
    // Complete handshake
    isHandshakingRef.current = false
    console.log('🎮 Scene switch complete - only one scene active')
  }

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
        antialias: false, // Disable antialiasing for better performance
        roundPixels: true, // Prevent pixel rounding issues
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fps: 60, // Fixed timestep for consistent physics
            fixedStep: true
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
      
      // Start with appropriate initial scene - ONLY ONE AT A TIME
      const sceneManager = gameRef.current.scene
      
      // Force stop all scenes first to ensure clean state
      sceneManager.stop('LandingScene')
      sceneManager.stop('TestScene')
      
      console.log('🔍 DEBUG: All scenes stopped. Starting single scene based on wallet state.')
      
      if (isWalletConnected) {
        console.log('🔍 DEBUG: Starting ONLY TestScene (wallet connected)')
        sceneManager.start('TestScene')
      } else {
        console.log('🔍 DEBUG: Starting ONLY LandingScene (no wallet)')
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

  // Debounced wallet connection change handler to prevent rapid switches
  useEffect(() => {
    console.log('🔍 DEBUG: Wallet connection useEffect triggered, wallet:', isWalletConnected, 'gameRef exists:', !!gameRef.current)
    
    const debounceTimer = setTimeout(() => {
      if (gameRef.current && gameRef.current.scene && !isHandshakingRef.current) {
        handleSceneSwitching(isWalletConnected)
      }
    }, 200) // Increased delay to ensure proper initialization

    return () => clearTimeout(debounceTimer)
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
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}
    />
  )
}