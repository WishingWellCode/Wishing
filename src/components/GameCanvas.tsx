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
}

export default function GameCanvas({ isWalletConnected = false }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, updatePlayerPosition, throwCoins } = useGame()

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

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

    // Phaser's RESIZE scale mode will handle resize automatically
    // No need for manual resize handling
    
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
      
      if (isWalletConnected) {
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