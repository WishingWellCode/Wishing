import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { useGame } from '@/lib/GameContext'
import { HubWorldScene } from '@/scenes/HubWorldScene'
import { PreloadScene } from '@/scenes/PreloadScene'
import { CharacterSelectScene } from '@/scenes/CharacterSelectScene'
import { TestScene } from '@/scenes/TestScene'
import { LandingScene } from '@/scenes/LandingScene'

interface GameCanvasProps {
  isWalletConnected?: boolean
  testMode?: boolean
}

export default function GameCanvas({ isWalletConnected = false, testMode = false }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, updatePlayerPosition, throwCoins } = useGame()

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
          debug: true
        }
      },
      scene: [LandingScene, TestScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    gameRef.current = new Phaser.Game(config)

    gameRef.current.registry.set('gameContext', {
      gameState,
      updatePlayerPosition,
      throwCoins
    })

    const handleResize = () => {
      if (gameRef.current) {
        // Immediate resize without debounce for better responsiveness
        const newWidth = window.innerWidth
        const newHeight = window.innerHeight
        
        // Resize the game canvas
        gameRef.current.scale.resize(newWidth, newHeight)
        
        // Force immediate update of all active scenes
        gameRef.current.scene.scenes.forEach(scene => {
          if (scene.scene.isActive()) {
            // Force camera to new dimensions
            scene.cameras.main.setSize(newWidth, newHeight)
            scene.cameras.main.setViewport(0, 0, newWidth, newHeight)
            
            // Trigger resize event for scene-specific handling
            scene.events.emit('resize', newWidth, newHeight)
          }
        })
        
        // Force a render update
        gameRef.current.renderer.resize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    
    // Also listen for dev tools open/close which changes viewport
    window.addEventListener('beforeunload', () => {
      clearTimeout((window as any)._resizeTimeout)
    })

    return () => {
      window.removeEventListener('resize', handleResize)
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
      
      if (isWalletConnected || testMode) {
        // Switch to TestScene when wallet connects
        if (sceneManager.getScene('LandingScene')?.scene.isActive()) {
          sceneManager.stop('LandingScene')
        }
        if (!sceneManager.getScene('TestScene')?.scene.isActive()) {
          sceneManager.start('TestScene')
        }
      } else {
        // Switch to LandingScene when wallet disconnects  
        if (sceneManager.getScene('TestScene')?.scene.isActive()) {
          sceneManager.stop('TestScene')
        }
        if (!sceneManager.getScene('LandingScene')?.scene.isActive()) {
          sceneManager.start('LandingScene')
        }
      }
    }
  }, [isWalletConnected, testMode])

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