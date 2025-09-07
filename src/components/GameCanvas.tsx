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
      if (gameRef.current && gameRef.current.scene) {
        const newWidth = window.innerWidth
        const newHeight = window.innerHeight
        
        // Only resize if dimensions actually changed significantly (more than 10px)
        const widthDiff = Math.abs(gameRef.current.scale.width - newWidth)
        const heightDiff = Math.abs(gameRef.current.scale.height - newHeight)
        
        if (widthDiff < 10 && heightDiff < 10) {
          return
        }
        
        // Debounce resize to prevent rapid updates
        clearTimeout((window as any)._resizeTimeout)
        ;(window as any)._resizeTimeout = setTimeout(() => {
          // Resize the game canvas
          gameRef.current!.scale.resize(newWidth, newHeight)
          
          // Update only active scenes without recreating them
          gameRef.current!.scene.scenes.forEach(scene => {
            if (scene && scene.scene && scene.scene.isActive()) {
              // Update camera bounds without recreating scene
              if (scene.cameras && scene.cameras.main) {
                scene.cameras.main.setSize(newWidth, newHeight)
                
                // Update background if it exists
                const background = scene.children?.getByName('vaporwaveBackground') as any
                if (background && background.setPosition) {
                  background.setPosition(newWidth / 2, newHeight / 2)
                  
                  // Recalculate scale
                  const texture = scene.textures?.get('vaporwave-background')
                  if (texture && texture.source && texture.source.length > 0) {
                    const originalWidth = texture.source[0].width
                    const originalHeight = texture.source[0].height
                    const scaleX = newWidth / originalWidth
                    const scaleY = newHeight / originalHeight
                    const scale = Math.max(scaleX, scaleY)
                    background.setScale(scale)
                  }
                }
              }
            }
          })
        }, 100)
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